import crypto from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ProviderName = "facebook" | "instagram" | "google"

function normalizeProvider(raw: string): ProviderName {
  if (raw === "google") return "google"
  if (raw === "instagram") return "instagram"
  return "facebook"
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "")
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2)
  }
  if (digits.length > 12) {
    return digits.slice(-10)
  }
  return digits
}

/**
 * GET /api/webhook/[provider]
 * Handles Meta (Facebook & Instagram) Webhook Verification Handshake:
 * ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params
  const provider = normalizeProvider(rawProvider)

  const sp = req.nextUrl.searchParams
  const mode = sp.get("hub.mode") || sp.get("hub_mode")
  const token = sp.get("hub.verify_token") || sp.get("hub_verify_token")
  const challenge = sp.get("hub.challenge") || sp.get("hub_challenge")

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json(
      {
        provider,
        endpoint: `/api/webhook/${provider}`,
        status: "ready",
        supports:
          provider === "google"
            ? ["POST Google Ads WebhookLead JSON (google_key + user_column_data)"]
            : [
                "GET Meta hub.challenge verification",
                "POST X-Hub-Signature-256 verification",
                "POST Meta leadgen pointer -> Graph API v20.0 fetch",
              ],
      },
      { status: 200 }
    )
  }

  const creds = await prisma.lead_integration_credentials.findMany({
    where: {
      provider,
      key: "verify_token",
    },
  })

  if (creds.some((c) => c.value === token)) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return new NextResponse("Verify token mismatch", { status: 403 })
}

/**
 * Extract normalized { name, email, mobile, city, externalLeadId } from:
 * 1) Google Ads Lead Form Webhook (`WebhookLead` proto JSON: `user_column_data[]`)
 * 2) Meta Lead Ads Graph API / Webhook `field_data[]`
 * 3) Direct / custom flat JSON payloads
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLeadFields(provider: ProviderName, payload: any) {
  // 1) Google Ads Lead Form Asset Webhook format
  if (Array.isArray(payload?.user_column_data)) {
    let fullName = ""
    let firstName = ""
    let lastName = ""
    let email = ""
    let mobile = ""
    let city = ""
    for (const col of payload.user_column_data) {
      const cid = String(col.column_id || col.column_name || "").toUpperCase()
      const val = String(col.string_value || "").trim()
      if (cid === "FULL_NAME" || cid.includes("FULL_NAME")) fullName = fullName || val
      else if (cid === "FIRST_NAME") firstName = firstName || val
      else if (cid === "LAST_NAME") lastName = lastName || val
      else if (cid.includes("NAME") && !fullName) fullName = val
      if (cid.includes("EMAIL")) email = email || val
      if (cid.includes("PHONE")) mobile = mobile || normalizePhone(val)
      if (cid === "CITY" || cid.includes("CITY")) city = city || val
    }
    const name =
      fullName || `${firstName} ${lastName}`.trim() || "Google Ads Lead"
    if (mobile) {
      return {
        name,
        email,
        mobile,
        city,
        externalLeadId: payload.lead_id ? String(payload.lead_id) : "",
      }
    }
  }

  // 2) Meta Graph API / Webhook `field_data` format
  const changeVal = payload?.entry?.[0]?.changes?.[0]?.value
  const fieldData = payload?.field_data || changeVal?.field_data
  if (Array.isArray(fieldData)) {
    let fullName = ""
    let firstName = ""
    let lastName = ""
    let email = ""
    let mobile = ""
    let city = ""
    for (const f of fieldData) {
      const k = String(f.name || "").toLowerCase()
      const v = Array.isArray(f.values)
        ? String(f.values[0] || "").trim()
        : String(f.value || "").trim()
      if (k === "full_name") fullName = fullName || v
      else if (k === "first_name") firstName = firstName || v
      else if (k === "last_name") lastName = lastName || v
      else if (k.includes("name") && !fullName) fullName = v
      if (k.includes("email")) email = email || v
      if (k.includes("phone") || k.includes("mobile")) {
        mobile = mobile || normalizePhone(v)
      }
      if (k === "city") city = city || v
    }
    const name =
      fullName ||
      `${firstName} ${lastName}`.trim() ||
      `${provider.toUpperCase()} Lead`
    if (mobile) {
      return {
        name,
        email,
        mobile,
        city,
        externalLeadId: String(
          changeVal?.leadgen_id || payload?.id || ""
        ),
      }
    }
  }

  // 3) Flat / normalized webhook payload
  const mobile = normalizePhone(
    String(payload?.mobile || payload?.phone || changeVal?.phone || "").trim()
  )
  const name = String(
    payload?.name ||
      payload?.full_name ||
      changeVal?.name ||
      `${provider.toUpperCase()} Lead`
  ).trim()
  const email = String(payload?.email || changeVal?.email || "").trim()
  const city = String(payload?.city || "").trim()

  return {
    name,
    email,
    mobile,
    city,
    externalLeadId: String(
      payload?.lead_id || changeVal?.leadgen_id || ""
    ),
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params
  const provider = normalizeProvider(rawProvider)
  const now = new Date()

  const rawText = await req.text()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = {}
  try {
    body = rawText ? JSON.parse(rawText) : {}
  } catch {
    body = {}
  }

  const headerSnapshot = JSON.stringify({
    "content-type": req.headers.get("content-type"),
    "x-hub-signature-256": req.headers.get("x-hub-signature-256")
      ? "present"
      : null,
    "user-agent": req.headers.get("user-agent"),
  })

  // Resolve tenant integration by page_id / customer_id / enabled state (fallback to org 1)
  const entryPageId = String(
    body?.entry?.[0]?.id ||
      body?.entry?.[0]?.changes?.[0]?.value?.page_id ||
      ""
  )

  let orgId: bigint | null = null
  if (entryPageId && (provider === "facebook" || provider === "instagram")) {
    const matchedPageCred = await prisma.lead_integration_credentials.findFirst({
      where: {
        provider,
        key: { in: ["page_id", "ig_business_id"] },
        value: entryPageId,
      },
    })
    if (matchedPageCred) orgId = matchedPageCred.organization_id
  }

  if (!orgId) {
    const activeIntegration = await prisma.lead_integrations.findFirst({
      where: { provider, is_enabled: true },
    })
    orgId =
      activeIntegration?.organization_id ?? BigInt(body.organization_id || 1)
  }

  // Load saved credentials for this tenant + provider
  const savedCredRows = await prisma.lead_integration_credentials.findMany({
    where: { organization_id: orgId, provider },
  })
  const credMap: Record<string, string> = {}
  for (const row of savedCredRows) {
    credMap[row.key] = row.value
  }

  // A) Meta X-Hub-Signature-256 verification when header is present & app_secret is configured
  const sigHeader = req.headers.get("x-hub-signature-256")
  if (
    (provider === "facebook" || provider === "instagram") &&
    sigHeader &&
    credMap.app_secret
  ) {
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", credMap.app_secret)
        .update(rawText, "utf8")
        .digest("hex")
    const validSig =
      expected.length === sigHeader.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigHeader))
    if (!validSig) {
      await prisma.lead_webhook_logs.create({
        data: {
          organization_id: orgId,
          provider,
          event_type: "signature_mismatch",
          request_headers: headerSnapshot,
          payload: rawText || "{}",
          is_processed: false,
          error_message: "Invalid X-Hub-Signature-256 HMAC signature",
          created_at: now,
        },
      })
      return NextResponse.json(
        { ok: false, error: "Invalid X-Hub-Signature-256 signature" },
        { status: 403 }
      )
    }
  }

  // B) Google Ads Lead Form Webhook `google_key` validation when configured
  const expectedGoogleKey = credMap.google_key || credMap.webhook_key
  if (
    provider === "google" &&
    expectedGoogleKey &&
    body?.google_key &&
    String(body.google_key) !== expectedGoogleKey
  ) {
    await prisma.lead_webhook_logs.create({
      data: {
        organization_id: orgId,
        provider,
        event_type: "invalid_google_key",
        request_headers: headerSnapshot,
        payload: rawText || "{}",
        is_processed: false,
        error_message: "Google Lead Form webhook google_key mismatch",
        created_at: now,
      },
    })
    return NextResponse.json(
      { ok: false, error: "Invalid google_key secret" },
      { status: 403 }
    )
  }

  // C) Two-Step Meta Production Flow: if webhook sent `leadgen_id` pointer without `field_data`, fetch from Graph API!
  const changeVal = body?.entry?.[0]?.changes?.[0]?.value
  const leadgenId = changeVal?.leadgen_id
  if (
    (provider === "facebook" || provider === "instagram") &&
    leadgenId &&
    !Array.isArray(changeVal?.field_data) &&
    !Array.isArray(body?.field_data) &&
    credMap.page_access_token
  ) {
    try {
      const graphUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(
        String(leadgenId)
      )}?access_token=${encodeURIComponent(credMap.page_access_token)}`
      const graphRes = await fetch(graphUrl, { method: "GET" })
      if (graphRes.ok) {
        const graphData = await graphRes.json()
        if (Array.isArray(graphData?.field_data)) {
          body = { ...body, field_data: graphData.field_data }
        }
      }
    } catch {
      // Graceful fallback if Graph token is a test placeholder
    }
  }

  const extracted = extractLeadFields(provider, body)

  if (!extracted.mobile) {
    await prisma.lead_webhook_logs.create({
      data: {
        organization_id: orgId,
        provider,
        event_type: "invalid_payload",
        request_headers: headerSnapshot,
        payload: JSON.stringify(body),
        is_processed: false,
        error_message:
          "Missing mobile/phone in webhook payload (or leadgen_id requires valid Page Access Token)",
        created_at: now,
      },
    })
    return NextResponse.json(
      { ok: false, status: "invalid_payload" },
      { status: 200 }
    )
  }

  // Duplicate check by mobile within organization
  const existingLead = await prisma.leads.findFirst({
    where: { organization_id: orgId, mobile: extracted.mobile },
  })

  if (existingLead) {
    await prisma.lead_webhook_logs.create({
      data: {
        organization_id: orgId,
        provider,
        event_type: "duplicate",
        request_headers: headerSnapshot,
        payload: JSON.stringify(body),
        is_processed: true,
        error_message: `Duplicate mobile matched Lead #${existingLead.id}`,
        created_at: now,
      },
    })
    return NextResponse.json({
      ok: true,
      status: "duplicate",
      lead_id: Number(existingLead.id),
    })
  }

  // Match or auto-resolve lead source (NEVER touch generated column `total_amount`!)
  let source = await prisma.lead_sources.findFirst({
    where: {
      organization_id: orgId,
      name: { contains: provider },
    },
  })
  if (!source) {
    source = await prisma.lead_sources.create({
      data: {
        organization_id: orgId,
        name:
          provider === "facebook"
            ? "Facebook Lead Ads"
            : provider === "instagram"
              ? "Instagram Lead Ads"
              : "Google Lead Form",
        status: true,
        lead_count: 0,
        billing_setup_amount: 0,
        created_at: now,
        updated_at: now,
      },
    })
  }

  const lead = await prisma.leads.create({
    data: {
      organization_id: orgId,
      lead_source_id: source.id,
      name: extracted.name,
      mobile: extracted.mobile,
      email: extracted.email || null,
      lead_assign_to: BigInt(0),
      lead_score: 20,
      lead_registration_date: now,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.lead_sources.update({
    where: { id: source.id },
    data: { lead_count: { increment: 1 }, updated_at: now },
  })

  await Promise.all([
    prisma.lead_webhook_logs.create({
      data: {
        organization_id: orgId,
        provider,
        event_type: "leadgen_captured",
        request_headers: headerSnapshot,
        payload: JSON.stringify(body),
        is_processed: true,
        created_at: now,
      },
    }),
    prisma.lead_activity_logs.create({
      data: {
        organization_id: orgId,
        lead_id: lead.id,
        action: "webhook_captured",
        description: `Lead #${lead.id} captured automatically via ${provider.toUpperCase()} Webhook${
          extracted.externalLeadId ? ` (Ref: ${extracted.externalLeadId})` : ""
        }`,
        created_at: now,
        updated_at: now,
      },
    }),
  ])

  return NextResponse.json({ ok: true, status: "ok", lead_id: Number(lead.id) })
}
