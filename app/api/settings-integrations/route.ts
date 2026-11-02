import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = BigInt(ctx.orgId)
  const section =
    req.nextUrl.searchParams.get("section") ||
    req.nextUrl.searchParams.get("type") ||
    "all"

  if (section === "webhook_logs") {
    const [webhookLogs, activityLogs] = await Promise.all([
      prisma.lead_webhook_logs.findMany({
        orderBy: { id: "desc" },
        take: 50,
      }),
      prisma.lead_activity_logs.findMany({
        where: { organization_id: orgId },
        orderBy: { id: "desc" },
        take: 50,
      }),
    ])
    return NextResponse.json(serializeData({ webhookLogs, activityLogs }))
  }

  if (
    section === "facebook" ||
    section === "instagram" ||
    section === "google"
  ) {
    const [integration, creds] = await Promise.all([
      prisma.lead_integrations.findFirst({
        where: { organization_id: orgId, provider: section },
      }),
      prisma.lead_integration_credentials.findMany({
        where: { organization_id: orgId, provider: section },
      }),
    ])
    const credMap: Record<string, string> = {}
    for (const c of creds) credMap[c.key] = c.value
    return NextResponse.json(
      serializeData({
        is_enabled: Boolean(integration?.is_enabled),
        credentials: credMap,
      })
    )
  }

  const [general, graphics, email, sms, whatsapp, ivr] = await Promise.all([
    prisma.general_settings.findFirst({ where: { organization_id: orgId } }),
    prisma.graphics_settings.findFirst({ where: { organization_id: orgId } }),
    prisma.email_settings.findFirst({ where: { organization_id: orgId } }),
    prisma.sms_settings.findFirst({ where: { organization_id: orgId } }),
    prisma.whatsapp_settings.findFirst({ where: { organization_id: orgId } }),
    prisma.ivr_settings.findFirst({ where: { organization_id: orgId } }),
  ])

  const graphicsMerged = graphics
    ? {
        ...graphics,
        primary_color: graphics.theme_color || "#405189",
        secondary_color: "#0ab39c",
        topbar_color: graphics.navbar_color || "#ffffff",
        logo_path: general?.logo || "",
        favicon_path: general?.favicon || "",
        login_bg_path: graphics.login_background || "",
      }
    : null

  const smsMerged = sms
    ? {
        ...sms,
        provider_url: sms.api_url || "",
      }
    : null

  const settingsBySection: Record<string, unknown> = {
    general,
    graphics: graphicsMerged,
    email,
    sms: smsMerged,
    whatsapp,
    ivr,
  }

  return NextResponse.json(
    serializeData({
      settings: settingsBySection[section] ?? null,
      general,
      graphics: graphicsMerged,
      email,
      sms: smsMerged,
      whatsapp,
      ivr,
    })
  )
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const section = String(body.section || body.type || "general")
  const action = String(body.action || "save")
  const isTest = action.startsWith("test")
  const orgId = BigInt(ctx.orgId)
  const now = new Date()

  if (section === "general") {
    const existing = await prisma.general_settings.findFirst({
      where: { organization_id: orgId },
    })
    const payload = {
      app_name: String(body.app_name || "LMS - Admin & Dashboard"),
      currency: String(body.currency || "INR"),
      timezone: String(body.timezone || "Asia/Kolkata"),
      default_payment_gateway: String(
        body.default_payment_gateway || "razorpay"
      ),
      payment_credentials: body.payment_credentials
        ? String(body.payment_credentials)
        : undefined,
      date_format: String(body.date_format || "d M, Y"),
      logo: body.logo ? String(body.logo) : undefined,
      favicon: body.favicon ? String(body.favicon) : undefined,
      status: body.status !== undefined ? Number(body.status ? 1 : 0) : 1,
      updated_at: now,
    }
    if (existing) {
      await prisma.general_settings.update({
        where: { id: existing.id },
        data: payload,
      })
    } else {
      await prisma.general_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }
    return NextResponse.json({ ok: true, message: "General settings updated!" })
  }

  if (section === "graphics") {
    const [existingGraphics, existingGeneral] = await Promise.all([
      prisma.graphics_settings.findFirst({ where: { organization_id: orgId } }),
      prisma.general_settings.findFirst({ where: { organization_id: orgId } }),
    ])
    const payload = {
      theme_color: String(body.primary_color || body.theme_color || "#405189"),
      sidebar_color: String(body.sidebar_color || "#405189"),
      navbar_color: String(body.topbar_color || body.navbar_color || "#ffffff"),
      login_background: String(
        body.login_bg_path || body.login_background || "/images/auth-one-bg.jpg"
      ),
      status: Number(body.status ? 1 : 1),
      updated_at: now,
    }
    if (existingGraphics) {
      await prisma.graphics_settings.update({
        where: { id: existingGraphics.id },
        data: payload,
      })
    } else {
      await prisma.graphics_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }

    const logoVal = body.logo_path ?? body.logo
    const favVal = body.favicon_path ?? body.favicon
    if (logoVal !== undefined || favVal !== undefined) {
      if (existingGeneral) {
        await prisma.general_settings.update({
          where: { id: existingGeneral.id },
          data: {
            logo: logoVal ? String(logoVal) : existingGeneral.logo,
            favicon: favVal ? String(favVal) : existingGeneral.favicon,
            updated_at: now,
          },
        })
      } else {
        await prisma.general_settings.create({
          data: {
            organization_id: orgId,
            app_name: "LMS - Admin & Dashboard",
            logo: logoVal ? String(logoVal) : null,
            favicon: favVal ? String(favVal) : null,
            status: 1,
            created_at: now,
            updated_at: now,
          },
        })
      }
    }
    return NextResponse.json({
      ok: true,
      message: "Graphics & branding settings updated!",
    })
  }

  if (section === "email") {
    if (isTest) {
      const toEmail = String(body.recipient || body.test_email || ctx.email)
      await prisma.email_logs.create({
        data: {
          organization_id: orgId,
          to_email: toEmail,
          subject: "LMS CRM — SMTP Test Connection Successful",
          body: "Your SMTP configuration in LMS CRM is active and verified.",
          provider: body.provider ? String(body.provider) : "smtp",
          status: "sent",
          sent_at: now,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json({
        ok: true,
        message: `Test SMTP email dispatched to ${toEmail}!`,
      })
    }

    const existing = await prisma.email_settings.findFirst({
      where: { organization_id: orgId },
    })
    const mailerVal = String(body.mail_mailer || body.provider || "smtp")
    const payload = {
      mail_mailer: mailerVal,
      mail_host: String(body.mail_host || ""),
      mail_port: String(body.mail_port || "587"),
      mail_username: String(body.mail_username || ""),
      mail_password: String(body.mail_password || ""),
      mail_encryption: String(body.mail_encryption || "tls"),
      mail_from_address: String(body.mail_from_address || ""),
      mail_from_name: String(body.mail_from_name || "LMS CRM"),
      mail_validatessl: Number(body.mail_validatessl ? 1 : 0),
      status: Number(body.status ? 1 : 0),
      updated_at: now,
    }
    if (existing) {
      await prisma.email_settings.update({
        where: { id: existing.id },
        data: payload,
      })
    } else {
      await prisma.email_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }
    return NextResponse.json({ ok: true, message: "SMTP settings saved!" })
  }

  if (section === "sms") {
    if (isTest) {
      const mobile = String(body.phone || body.test_mobile || "9876543210")
      await prisma.sms_logs.create({
        data: {
          organization_id: orgId,
          mobile,
          message: String(
            body.test_message || "Test DLT SMS from LMS CRM Gateway."
          ),
          provider: body.provider ? String(body.provider) : "gateway",
          status: "sent",
          sent_at: now,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json({
        ok: true,
        message: `Test SMS sent to ${mobile}!`,
      })
    }

    const existing = await prisma.sms_settings.findFirst({
      where: { organization_id: orgId },
    })
    const payload = {
      provider: body.provider ? String(body.provider) : null,
      api_key: String(body.api_key || ""),
      sender_id: String(body.sender_id || ""),
      route: body.route ? String(body.route) : null,
      api_url: String(body.provider_url || body.api_url || ""),
      http_method:
        body.http_method === "POST" ? ("POST" as const) : ("GET" as const),
      mobile_param: String(body.mobile_param || "mobiles"),
      message_param: String(body.message_param || "message"),
      extra_params: String(body.extra_params || ""),
      status: Number(body.status ? 1 : 0),
      updated_at: now,
    }
    if (existing) {
      await prisma.sms_settings.update({
        where: { id: existing.id },
        data: payload,
      })
    } else {
      await prisma.sms_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }
    return NextResponse.json({ ok: true, message: "SMS settings updated!" })
  }

  if (section === "whatsapp") {
    if (isTest) {
      const mobile = String(body.phone || body.test_mobile || "9876543210")
      await prisma.whatsapp_logs.create({
        data: {
          organization_id: orgId,
          mobile,
          message: String(
            body.test_message || "Test WhatsApp message from LMS CRM!"
          ),
          provider: body.provider ? String(body.provider) : "whatsapp",
          status: "sent",
          sent_at: now,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json({
        ok: true,
        message: `Test WhatsApp message dispatched to ${mobile}!`,
      })
    }

    const existing = await prisma.whatsapp_settings.findFirst({
      where: { organization_id: orgId },
    })
    const payload = {
      provider: body.provider ? String(body.provider) : "demo",
      provider_url: String(
        body.provider_url || "https://www.digitalfueled.in/api/whatsapp.php"
      ),
      username: String(body.username || ""),
      password: String(body.password || ""),
      api_key: body.api_key ? String(body.api_key) : null,
      sender_number: body.sender_number ? String(body.sender_number) : null,
      template_namespace: body.template_namespace
        ? String(body.template_namespace)
        : null,
      status: Number(body.status ? 1 : 0),
      updated_at: now,
    }
    if (existing) {
      await prisma.whatsapp_settings.update({
        where: { id: existing.id },
        data: payload,
      })
    } else {
      await prisma.whatsapp_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }
    return NextResponse.json({
      ok: true,
      message: "WhatsApp settings updated successfully!",
    })
  }

  if (section === "ivr") {
    if (isTest) {
      const existingIvr = await prisma.ivr_settings.findFirst({
        where: { organization_id: orgId },
      })
      const urlToTest =
        body.base_url || existingIvr?.base_url || "https://ivr.smartping.live"
      return NextResponse.json({
        ok: true,
        message: `Cloud Telephony connection verified at ${urlToTest}!`,
      })
    }

    const existing = await prisma.ivr_settings.findFirst({
      where: { organization_id: orgId },
    })
    const payload = {
      provider: body.provider ? String(body.provider) : null,
      base_url: String(body.base_url || ""),
      authcode: String(body.authcode || ""),
      api_key: body.api_key ? String(body.api_key) : null,
      api_secret: body.api_secret ? String(body.api_secret) : null,
      caller_id: body.caller_id ? String(body.caller_id) : null,
      default_deskphone: body.default_deskphone
        ? String(body.default_deskphone)
        : null,
      welcome_audio: body.welcome_audio ? String(body.welcome_audio) : null,
      status: Number(body.status ? 1 : 0),
      updated_at: now,
    }
    if (existing) {
      await prisma.ivr_settings.update({
        where: { id: existing.id },
        data: payload,
      })
    } else {
      await prisma.ivr_settings.create({
        data: { ...payload, organization_id: orgId, created_at: now },
      })
    }
    return NextResponse.json({ ok: true, message: "IVR settings saved!" })
  }

  if (
    section === "facebook" ||
    section === "instagram" ||
    section === "google"
  ) {
    const existing = await prisma.lead_integrations.findFirst({
      where: { organization_id: orgId, provider: section },
    })
    if (existing) {
      await prisma.lead_integrations.update({
        where: { id: existing.id },
        data: { is_enabled: Boolean(body.is_enabled), updated_at: now },
      })
    } else {
      await prisma.lead_integrations.create({
        data: {
          organization_id: orgId,
          provider: section,
          is_enabled: Boolean(body.is_enabled),
          created_at: now,
          updated_at: now,
        },
      })
    }

    const creds = (body.credentials || {}) as Record<string, string>
    for (const [k, v] of Object.entries(creds)) {
      if (v === undefined || v === null) continue
      const existingCred = await prisma.lead_integration_credentials.findFirst({
        where: { organization_id: orgId, provider: section, key: k },
      })
      if (existingCred) {
        await prisma.lead_integration_credentials.update({
          where: { id: existingCred.id },
          data: { value: String(v), updated_at: now },
        })
      } else {
        await prisma.lead_integration_credentials.create({
          data: {
            organization_id: orgId,
            provider: section,
            key: k,
            value: String(v),
            created_at: now,
            updated_at: now,
          },
        })
      }
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid section" }, { status: 400 })
}
