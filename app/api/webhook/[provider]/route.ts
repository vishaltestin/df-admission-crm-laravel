import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ProviderName = "facebook" | "instagram" | "google"

function normalizeProvider(raw: string): ProviderName {
  if (raw === "google") return "google"
  if (raw === "instagram") return "instagram"
  return "facebook"
}

/**
 * GET /api/webhook/[provider]
 * Handles Meta (Facebook / Instagram) Webhook Verification Challenge:
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
        supports: ["GET hub.challenge verification", "POST leadgen webhook"],
      },
      { status: 200 }
    )
  }

  const cred = await prisma.lead_integration_credentials.findFirst({
    where: {
      provider,
      key: "verify_token",
    },
  })

  if (cred && cred.value === token) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return new NextResponse("Verify token mismatch", { status: 403 })
}

/**
 * Extract normalized { name, email, mobile } from:
 * 1) Direct JSON payloads ({ name, full_name, mobile, phone, email })
 * 2) Meta Lead Ads field_data / nested entry[0].changes[0].value
 * 3) Google Ads Lead Form Extensions user_column_data[]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLeadFields(provider: ProviderName, payload: any) {
  // 1) Google Ads Lead Form Extension format
  if (Array.isArray(payload?.user_column_data)) {
    let name = ""
    let email = ""
    let mobile = ""
    for (const col of payload.user_column_data) {
      const cid = String(col.column_id || col.column_name || "").toUpperCase()
      const val = String(col.string_value || "")
      if (cid.includes("NAME")) name = name || val
      if (cid.includes("EMAIL")) email = email || val
      if (cid.includes("PHONE")) mobile = mobile || val
    }
    if (mobile) return { name: name || "Google Lead", email, mobile }
  }

  // 2) Meta Graph / Webhook field_data format
  const changeVal = payload?.entry?.[0]?.changes?.[0]?.value
  const fieldData = payload?.field_data || changeVal?.field_data
  if (Array.isArray(fieldData)) {
    let name = ""
    let email = ""
    let mobile = ""
    for (const f of fieldData) {
      const k = String(f.name || "").toLowerCase()
      const v = Array.isArray(f.values) ? String(f.values[0] || "") : String(f.value || "")
      if (k.includes("name")) name = name || v
      if (k.includes("email")) email = email || v
      if (k.includes("phone") || k.includes("mobile")) mobile = mobile || v
    }
    if (mobile) return { name: name || `${provider.toUpperCase()} Lead`, email, mobile }
  }

  // 3) Flat / normalized webhook payload
  const mobile = String(
    payload?.mobile || payload?.phone || changeVal?.phone || ""
  ).trim()
  const name = String(
    payload?.name ||
      payload?.full_name ||
      changeVal?.name ||
      `${provider.toUpperCase()} Lead`
  ).trim()
  const email = String(payload?.email || changeVal?.email || "").trim()

  return { name, email, mobile }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: rawProvider } = await params
  const provider = normalizeProvider(rawProvider)

  const body = await req.json().catch(() => ({}))
  const now = new Date()

  // Resolve active tenant integration (fallback to org 1 so simulation works out-of-the-box)
  const activeIntegration = await prisma.lead_integrations.findFirst({
    where: { provider, is_enabled: true },
  })
  const orgId = activeIntegration?.organization_id ?? BigInt(body.organization_id || 1)

  const extracted = extractLeadFields(provider, body)

  if (!extracted.mobile) {
    await prisma.lead_webhook_logs.create({
      data: {
        organization_id: orgId,
        provider,
        event_type: "invalid_payload",
        payload: JSON.stringify(body),
        is_processed: false,
        error_message: "Missing mobile/phone in webhook payload",
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

  // Increment lead_count only; MariaDB computes generated column `total_amount` automatically
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
        description: `Lead #${lead.id} captured automatically via ${provider.toUpperCase()} Webhook`,
        created_at: now,
        updated_at: now,
      },
    }),
  ])

  return NextResponse.json({ ok: true, status: "ok", lead_id: Number(lead.id) })
}
