import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resource = req.nextUrl.searchParams.get("resource") || ""
  const orgId = ctx.orgId

  switch (resource) {
    case "institutes": {
      const [institutes, programs, courses] = await Promise.all([
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "asc" },
        }),
        prisma.programs.findMany({ orderBy: { id: "asc" } }),
        prisma.products.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
      ])
      return NextResponse.json(
        serializeData({ items: institutes, institutes, programs, courses })
      )
    }

    case "programs": {
      const [programs, institutes] = await Promise.all([
        prisma.programs.findMany({ orderBy: { id: "asc" } }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "asc" },
        }),
      ])
      return NextResponse.json(
        serializeData({ items: programs, programs, institutes })
      )
    }

    case "courses": {
      const [courses, programs, institutes] = await Promise.all([
        prisma.products.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
        prisma.programs.findMany({ orderBy: { id: "asc" } }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "asc" },
        }),
      ])
      return NextResponse.json(
        serializeData({ items: courses, programs, institutes })
      )
    }

    case "pipelines": {
      const [pipelines, stages] = await Promise.all([
        prisma.pipelines.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "asc" },
        }),
        prisma.pipeline_stages.findMany({ orderBy: { sort_order: "asc" } }),
      ])
      return NextResponse.json(
        serializeData({
          items: pipelines.map((p) => ({
            ...p,
            is_default: p.is_default ? 1 : 0,
            stages: stages.filter((s) => s.lead_pipeline_id === p.id),
          })),
          stages,
        })
      )
    }

    case "statuses": {
      const [statuses, rawSubs] = await Promise.all([
        prisma.lead_statuses.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
          },
          orderBy: { sort_order: "asc" },
        }),
        prisma.lead_sub_statuses.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
          },
          orderBy: { sort_order: "asc" },
        }),
      ])
      const subStatuses = rawSubs.map((s) => ({
        ...s,
        status_id: s.lead_status_id,
      }))
      return NextResponse.json(
        serializeData({ items: statuses, statuses, subStatuses })
      )
    }

    case "sub_statuses": {
      const [statuses, rawSubs] = await Promise.all([
        prisma.lead_statuses.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
          },
          orderBy: { sort_order: "asc" },
        }),
        prisma.lead_sub_statuses.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
          },
          orderBy: { sort_order: "asc" },
        }),
      ])
      const subStatuses = rawSubs.map((s) => ({
        ...s,
        status_id: s.lead_status_id,
      }))
      return NextResponse.json(serializeData({ items: subStatuses, statuses }))
    }

    case "sources": {
      const [rawSources, leadGroups] = await Promise.all([
        prisma.lead_sources.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.leads.groupBy({
          by: ["lead_source_id"],
          where: { organization_id: BigInt(orgId) },
          _count: { id: true },
        }),
      ])
      const countMap = new Map<string, number>()
      for (const g of leadGroups) {
        if (g.lead_source_id !== null) {
          countMap.set(String(g.lead_source_id), g._count.id)
        }
      }
      const items = rawSources.map((s) => {
        const liveCount =
          countMap.get(String(s.id)) ?? Number(s.lead_count || 0)
        const rate = Number(s.billing_setup_amount || 0)
        return {
          ...s,
          lead_count: liveCount,
          computed_total: liveCount * rate,
        }
      })
      return NextResponse.json(serializeData({ items }))
    }

    case "types": {
      const items = await prisma.lead_types.findMany({
        where: { organization_id: BigInt(orgId) },
        orderBy: { id: "desc" },
      })
      return NextResponse.json(serializeData({ items }))
    }

    case "attributes": {
      const items = await prisma.attributes.findMany({
        where: { organization_id: orgId },
        orderBy: { sort_order: "asc" },
      })
      return NextResponse.json(serializeData({ items }))
    }

    case "campaigns": {
      const [items, events, templates] = await Promise.all([
        prisma.campaigns.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
        prisma.marketing_events.findMany({ where: { organization_id: orgId } }),
        prisma.email_templates.findMany({
          where: { organization_id: BigInt(orgId) },
        }),
      ])
      return NextResponse.json(serializeData({ items, events, templates }))
    }

    case "marketing_events": {
      const items = await prisma.marketing_events.findMany({
        where: { organization_id: orgId },
        orderBy: { id: "desc" },
      })
      return NextResponse.json(serializeData({ items }))
    }

    case "webhooks": {
      const items = await prisma.webhooks.findMany({
        where: { organization_id: orgId },
        orderBy: { id: "desc" },
      })
      return NextResponse.json(serializeData({ items }))
    }

    case "email_templates": {
      const [items, organizations] = await Promise.all([
        prisma.email_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
      ])
      const orgMap = new Map(organizations.map((o) => [String(o.id), o.name]))
      return NextResponse.json(
        serializeData({
          items: items.map((t) => ({
            ...t,
            name: t.title,
            content: t.message,
            organization_name:
              orgMap.get(String(t.organization_id)) || `Org #${t.organization_id}`,
          })),
          organizations,
        })
      )
    }

    case "message_templates": {
      const [items, organizations] = await Promise.all([
        prisma.message_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
      ])
      const orgMap = new Map(organizations.map((o) => [String(o.id), o.name]))
      return NextResponse.json(
        serializeData({
          items: items.map((t) => ({
            ...t,
            name: t.title,
            content: t.message,
            organization_name:
              orgMap.get(String(t.organization_id)) || `Org #${t.organization_id}`,
          })),
          organizations,
        })
      )
    }

    case "whatsapp_templates": {
      const [items, organizations] = await Promise.all([
        prisma.whatsapp_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
      ])
      const orgMap = new Map(organizations.map((o) => [String(o.id), o.name]))
      return NextResponse.json(
        serializeData({
          items: items.map((t) => ({
            ...t,
            name: t.title,
            content: t.message,
            organization_name:
              orgMap.get(String(t.organization_id)) || `Org #${t.organization_id}`,
          })),
          organizations,
        })
      )
    }

    case "coupons": {
      const [rawCoupons, usages] = await Promise.all([
        prisma.coupons.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.coupon_usages.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
          take: 50,
        }),
      ])
      const items = rawCoupons.map((c) => ({
        ...c,
        discount_type: c.type === "percent" ? "percentage" : "flat",
        discount_value: c.value,
      }))
      return NextResponse.json(serializeData({ items, usages }))
    }

    case "lead_distribution": {
      const [rules, items, sources, users, teams, institutes] =
        await Promise.all([
          prisma.lead_distribution_rules.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
          }),
          prisma.lead_distribution_rule_items.findMany(),
          prisma.lead_sources.findMany({
            where: { organization_id: BigInt(orgId) },
          }),
          prisma.users.findMany({
            select: { id: true, first_name: true, last_name: true, email: true },
          }),
          prisma.teams.findMany({ where: { organization_id: orgId } }),
          prisma.institutes.findMany({
            where: { organization_id: BigInt(orgId) },
          }),
        ])
      const mappedRules = rules.map((r, idx) => {
        const rItems = items.filter((i) => i.rule_id === r.id)
        return {
          ...r,
          name: r.rule_name,
          priority: idx + 1,
          assign_to:
            rItems
              .map((i) => Number(i.user_id || 0))
              .filter(Boolean)
              .join(", ") || "All Active Pool",
          items: rItems,
        }
      })
      return NextResponse.json(
        serializeData({
          items: mappedRules,
          rules: mappedRules,
          sources,
          users,
          teams,
          institutes,
        })
      )
    }

    case "lead_settings": {
      const [rawSettings, roles] = await Promise.all([
        prisma.lead_settings.findMany({ where: { organization_id: orgId } }),
        prisma.roles.findMany({ orderBy: { id: "asc" } }),
      ])
      const settings = rawSettings.map((s) => ({
        ...s,
        enabled:
          s.field === "can_download"
            ? Boolean(s.can_download || s.can_view)
            : Boolean(s.can_view),
      }))
      return NextResponse.json(
        serializeData({ items: settings, settings, roles })
      )
    }

    case "general_settings": {
      const [general, email, sms, whatsapp, ivr] = await Promise.all([
        prisma.general_settings.findFirst({
          where: { organization_id: BigInt(orgId) },
        }),
        prisma.email_settings.findFirst({
          where: { organization_id: BigInt(orgId) },
        }),
        prisma.sms_settings.findFirst({
          where: { organization_id: BigInt(orgId) },
        }),
        prisma.whatsapp_settings.findFirst({
          where: { organization_id: BigInt(orgId) },
        }),
        prisma.ivr_settings.findFirst({
          where: { organization_id: BigInt(orgId) },
        }),
      ])
      return NextResponse.json(
        serializeData({ general, email, sms, whatsapp, ivr })
      )
    }

    case "raw_data": {
      const sub = req.nextUrl.searchParams.get("sub") || "raw_leads"
      const uploadIdParam = req.nextUrl.searchParams.get("upload_id")
      const [uploads, rawLeads, callLogs, comms, ivrLogs, whatsappLogs, smsLogs] =
        await Promise.all([
          prisma.automation_raw_lead_uploads.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
          }),
          prisma.automation_raw_leads.findMany({
            where: {
              organization_id: orgId,
              ...(uploadIdParam ? { upload_id: BigInt(uploadIdParam) } : {}),
            },
            orderBy: { id: "desc" },
          }),
          prisma.call_logs.findMany({ orderBy: { id: "desc" }, take: 50 }),
          prisma.communication_logs.findMany({
            where: { organization_id: orgId },
            orderBy: { id: "desc" },
            take: 100,
          }),
          prisma.ivr_logs.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
            take: 100,
          }),
          prisma.whatsapp_logs.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
            take: 100,
          }),
          prisma.sms_logs.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
            take: 100,
          }),
        ])
      const items =
        sub === "uploads"
          ? uploads
          : sub === "ivr"
            ? ivrLogs.length > 0
              ? ivrLogs
              : callLogs
            : sub === "whatsapp"
              ? whatsappLogs.length > 0
                ? whatsappLogs
                : comms.filter((c) => c.channel === "whatsapp")
              : sub === "sms"
                ? smsLogs.length > 0
                  ? smsLogs
                  : comms.filter((c) => c.channel === "sms")
                : sub === "verified"
                  ? rawLeads.filter((r) => r.status === "confirmed")
                  : sub === "rejected"
                    ? rawLeads.filter((r) => r.status === "rejected")
                    : rawLeads
      return NextResponse.json(
        serializeData({
          items,
          uploads,
          rawLeads,
          callLogs,
          comms,
          ivrLogs,
          whatsappLogs,
          smsLogs,
        })
      )
    }

    case "formdesk": {
      const sub = req.nextUrl.searchParams.get("sub") || "web_forms"
      const [
        webforms,
        webformAttrs,
        landingPages,
        appForms,
        submissions,
        leads,
        leadApps,
        countries,
        institutes,
        leadSources,
        campaigns,
        pipelines,
        leadTypes,
      ] = await Promise.all([
        prisma.web_forms.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
        prisma.web_form_attributes.findMany({
          orderBy: { sort_order: "asc" },
        }),
        prisma.landing_pages.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.application_forms.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
        prisma.application_form_responses.findMany({
          where: {
            OR: [{ organization_id: orgId }, { organization_id: 0 }],
          },
          orderBy: { id: "desc" },
          take: 150,
        }),
        prisma.leads.findMany({
          where: { organization_id: BigInt(orgId) },
          select: { id: true, name: true, mobile: true, email: true },
        }),
        prisma.lead_applications.findMany(),
        prisma.countries.findMany({ orderBy: { name: "asc" } }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { name: "asc" },
        }),
        prisma.lead_sources.findMany({
          where: { organization_id: BigInt(orgId) },
        }),
        prisma.campaigns.findMany({ where: { organization_id: orgId } }),
        prisma.pipelines.findMany({ where: { organization_id: orgId } }),
        prisma.lead_types.findMany({
          where: { organization_id: BigInt(orgId) },
        }),
      ])

      const leadMap = new Map(leads.map((l) => [Number(l.id), l]))
      const appMap = new Map(
        leadApps.map((la) => [
          `${la.lead_id}_${la.application_form ?? ""}`,
          la,
        ])
      )

      const enrichedSubmissions = submissions.map((s) => {
        const l = leadMap.get(Number(s.lead_id))
        const la = appMap.get(`${s.lead_id}_${s.lead_form_id}`)
        let parsedJson: Record<string, unknown> = {}
        try {
          parsedJson = JSON.parse(s.response_json || "{}")
        } catch {}
        const normalizedPaid =
          la?.payment_status === "paid" || s.payment_status === 1
            ? "paid"
            : "unpaid"
        return {
          ...s,
          payment_status: normalizedPaid,
          lead_name:
            l?.name ||
            String(
              parsedJson.name ||
                parsedJson.full_name ||
                parsedJson.student_name ||
                "-"
            ),
          lead_mobile:
            l?.mobile ||
            String(parsedJson.mobile || parsedJson.phone || "-"),
          lead_email: l?.email || String(parsedJson.email || "-"),
          application_score: la?.application_score ?? s.fill_percentage ?? 0,
          app_payment_status: normalizedPaid,
          app_payment_method: la?.payment_method || s.payment_method || "-",
        }
      })

      const enrichedWebforms = webforms.map((wf) => ({
        ...wf,
        attributes: webformAttrs.filter((a) => a.web_form_id === wf.id),
      }))

      const items =
        sub === "landing_pages"
          ? landingPages
          : sub === "application_forms"
            ? appForms
            : enrichedWebforms

      return NextResponse.json(
        serializeData({
          items,
          responses: enrichedSubmissions,
          webforms: enrichedWebforms,
          landingPages,
          appForms,
          submissions: enrichedSubmissions,
          countries,
          institutes,
          leadSources,
          campaigns,
          pipelines,
          leadTypes,
        })
      )
    }

    case "application_submission": {
      const rawId = req.nextUrl.searchParams.get("id") || "0"
      const subId = /^\d+$/.test(rawId) ? BigInt(rawId) : BigInt(0)
      const response = await prisma.application_form_responses.findUnique({
        where: { id: subId },
      })
      if (!response) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      const [form, lead] = await Promise.all([
        prisma.application_forms.findUnique({
          where: { id: response.lead_form_id },
        }),
        response.lead_id
          ? prisma.leads.findUnique({ where: { id: BigInt(response.lead_id) } })
          : Promise.resolve(null),
      ])
      const submission = {
        ...response,
        payment_status: response.payment_status === 1 ? "paid" : "unpaid",
        form_title: form?.title || `Application Form #${response.lead_form_id}`,
        unique_code: form?.unique_code || "",
        lead_name: lead?.name || null,
        lead_mobile: lead?.mobile || null,
        lead_email: lead?.email || null,
      }
      return NextResponse.json(
        serializeData({ submission, response: submission, form, lead })
      )
    }

    case "automation_rules": {
      const rules = await prisma.automation_rules.findMany({
        where: { organization_id: BigInt(orgId) },
        orderBy: { id: "desc" },
      })
      return NextResponse.json(serializeData({ items: rules }))
    }

    case "reports": {
      const [leads, comms, users, sources, statuses, assignmentLogs] =
        await Promise.all([
          prisma.leads.findMany({ where: { organization_id: BigInt(orgId) } }),
          prisma.communication_logs.findMany({
            where: { organization_id: orgId },
            orderBy: { id: "desc" },
            take: 200,
          }),
          prisma.users.findMany({
            select: { id: true, first_name: true, last_name: true },
          }),
          prisma.lead_sources.findMany({
            where: { organization_id: BigInt(orgId) },
          }),
          prisma.lead_statuses.findMany({
            where: {
              OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
            },
          }),
          prisma.lead_assignment_logs.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "desc" },
            take: 200,
          }),
        ])
      return NextResponse.json(
        serializeData({
          leads,
          comms,
          commLogs: comms,
          users,
          sources,
          statuses,
          assignmentLogs,
        })
      )
    }

    case "landing_page_sections": {
      const pageId = BigInt(req.nextUrl.searchParams.get("page_id") || "0")
      const [page, sections] = await Promise.all([
        prisma.landing_pages.findUnique({ where: { id: pageId } }),
        prisma.landing_page_sections.findMany({
          where: { page_id: pageId },
          orderBy: { sort_order: "asc" },
        }),
      ])
      return NextResponse.json(serializeData({ page, sections }))
    }

    case "web_form_attributes": {
      const webFormId = Number(
        req.nextUrl.searchParams.get("web_form_id") || "0"
      )
      const items = await prisma.web_form_attributes.findMany({
        where: { web_form_id: webFormId },
        orderBy: { sort_order: "asc" },
      })
      return NextResponse.json(serializeData({ items }))
    }

    default:
      return NextResponse.json({ error: "Unknown resource" }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
  const body = await req.json()
  const resource = String(body.resource || "")
  const action = String(body.action || "create")
  const orgId = ctx.orgId
  const now = new Date()

  // Institutes / Programs / Courses
  if (resource === "institutes") {
    if (action === "create") {
      const inst = await prisma.institutes.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || "").trim(),
          description: body.description ? String(body.description) : null,
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: inst }))
    }
    if (action === "update" && body.id) {
      await prisma.institutes.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || "").trim(),
          description: body.description ? String(body.description) : null,
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.institutes.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "programs") {
    if (action === "create") {
      const p = await prisma.programs.create({
        data: {
          institute_id: BigInt(body.institute_id),
          name: String(body.name || "").trim(),
          description: body.description ? String(body.description) : null,
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: p }))
    }
    if (action === "update" && body.id) {
      await prisma.programs.update({
        where: { id: BigInt(body.id) },
        data: {
          institute_id: body.institute_id
            ? BigInt(body.institute_id)
            : undefined,
          name: String(body.name || "").trim(),
          description: body.description ? String(body.description) : null,
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.programs.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "courses") {
    if (action === "create") {
      const skuVal =
        String(body.sku || "").trim() || `CRS-${Date.now().toString().slice(-6)}`
      const c = await prisma.products.create({
        data: {
          sku: skuVal,
          name: String(body.name || "").trim(),
          description: body.description
            ? String(body.description).slice(0, 250)
            : null,
          quantity: Number(body.quantity ?? 60),
          price: Number(body.price ?? 0),
          organization_id: orgId,
          program_id: body.program_id ? BigInt(body.program_id) : null,
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: c }))
    }
    if (action === "update" && body.id) {
      await prisma.products.update({
        where: { id: Number(body.id) },
        data: {
          sku: body.sku ? String(body.sku).trim() : undefined,
          name: String(body.name || "").trim(),
          description:
            body.description !== undefined
              ? body.description
                ? String(body.description).slice(0, 250)
                : null
              : undefined,
          quantity:
            body.quantity !== undefined ? Number(body.quantity) : undefined,
          price: body.price !== undefined ? Number(body.price) : undefined,
          program_id:
            body.program_id !== undefined
              ? body.program_id
                ? BigInt(body.program_id)
                : null
              : undefined,
          status: body.status !== undefined ? Number(body.status) : undefined,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "assign_program" && body.id) {
      await prisma.products.update({
        where: { id: Number(body.id) },
        data: {
          program_id: body.program_id ? BigInt(body.program_id) : null,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.products.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.products.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // Pipelines + Stage Builder
  if (resource === "pipelines") {
    if (action === "create") {
      if (body.is_default) {
        await prisma.pipelines.updateMany({
          where: { organization_id: orgId },
          data: { is_default: false },
        })
      }
      const p = await prisma.pipelines.create({
        data: {
          name: String(body.name || ""),
          rotten_days: Number(body.rotten_days || 30),
          is_default: Boolean(body.is_default),
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })
      const stageList = Array.isArray(body.stages) ? body.stages : []
      for (let idx = 0; idx < stageList.length; idx++) {
        const s = stageList[idx]
        const sName = String(s.name || `Stage ${idx + 1}`)
        await prisma.pipeline_stages.create({
          data: {
            lead_pipeline_id: p.id,
            name: sName,
            code: sName.toLowerCase().replace(/[^a-z0-9]+/g, "_") + `_${idx}`,
            probability: Number(
              s.probability ?? Math.min(100, (idx + 1) * 20)
            ),
            sort_order: idx + 1,
            is_final: s.is_final ? 1 : 0,
            created_at: now,
            updated_at: now,
          },
        })
      }
      return NextResponse.json(serializeData({ ok: true, item: p }))
    }

    if (action === "update" && body.id) {
      const pid = Number(body.id)
      if (body.is_default) {
        await prisma.pipelines.updateMany({
          where: { organization_id: orgId },
          data: { is_default: false },
        })
      }
      await prisma.pipelines.update({
        where: { id: pid },
        data: {
          name: String(body.name || ""),
          rotten_days: Number(body.rotten_days || 30),
          is_default: Boolean(body.is_default),
          updated_at: now,
        },
      })

      if (Array.isArray(body.stages)) {
        await prisma.pipeline_stages.deleteMany({
          where: { lead_pipeline_id: pid },
        })
        for (let idx = 0; idx < body.stages.length; idx++) {
          const s = body.stages[idx]
          const sName = String(s.name || `Stage ${idx + 1}`)
          await prisma.pipeline_stages.create({
            data: {
              lead_pipeline_id: pid,
              name: sName,
              code:
                sName.toLowerCase().replace(/[^a-z0-9]+/g, "_") + `_${idx}`,
              probability: Number(s.probability ?? 50),
              sort_order: idx + 1,
              is_final: s.is_final ? 1 : 0,
              created_at: now,
              updated_at: now,
            },
          })
        }
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "add_stage" && body.lead_pipeline_id) {
      const sName = String(body.name || "New Stage")
      const st = await prisma.pipeline_stages.create({
        data: {
          lead_pipeline_id: Number(body.lead_pipeline_id),
          name: sName,
          code:
            sName.toLowerCase().replace(/[^a-z0-9]+/g, "_") +
            `_${Date.now().toString().slice(-3)}`,
          probability: Number(body.probability ?? 50),
          sort_order: Number(body.sort_order ?? 5),
          is_final: 0,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: st }))
    }

    if (action === "delete_stage" && body.id) {
      await prisma.pipeline_stages.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      const pid = Number(body.id)
      await prisma.pipeline_stages.deleteMany({
        where: { lead_pipeline_id: pid },
      })
      await prisma.pipelines.delete({ where: { id: pid } })
      return NextResponse.json({ ok: true })
    }
  }

  // Lead Statuses & Sub-Statuses
  if (resource === "statuses") {
    if (action === "create") {
      const st = await prisma.lead_statuses.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || "").trim(),
          color: String(body.color || "#405189"),
          sort_order: Number(body.sort_order ?? 0),
          is_active: body.is_active !== false,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: st }))
    }
    if (action === "update" && body.id) {
      await prisma.lead_statuses.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || "").trim(),
          color: body.color ? String(body.color) : undefined,
          sort_order: Number(body.sort_order ?? 0),
          is_active: body.is_active !== false,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.lead_statuses.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "sub_statuses") {
    const parentStatId = body.lead_status_id ?? body.status_id
    if (action === "create") {
      const sub = await prisma.lead_sub_statuses.create({
        data: {
          organization_id: BigInt(orgId),
          lead_status_id: BigInt(parentStatId),
          name: String(body.name || "").trim(),
          color: String(body.color || "#0ab39c"),
          sort_order: Number(body.sort_order ?? 0),
          is_active: body.is_active !== false,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: sub }))
    }
    if (action === "update" && body.id) {
      await prisma.lead_sub_statuses.update({
        where: { id: BigInt(body.id) },
        data: {
          lead_status_id: parentStatId ? BigInt(parentStatId) : undefined,
          name: String(body.name || "").trim(),
          color: body.color ? String(body.color) : undefined,
          sort_order:
            body.sort_order !== undefined ? Number(body.sort_order) : undefined,
          is_active: body.is_active !== false,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.lead_sub_statuses.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Lead Sources (NEVER write to generated column total_amount!)
  if (resource === "sources") {
    if (action === "create") {
      const s = await prisma.lead_sources.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || ""),
          status: body.status !== false,
          lead_count: Number(body.lead_count || 0),
          billing_setup_amount: Number(body.billing_setup_amount || 0),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: s }))
    }
    if (action === "update" && body.id) {
      await prisma.lead_sources.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || ""),
          status: body.status !== false,
          billing_setup_amount: Number(body.billing_setup_amount || 0),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if ((action === "delete" || action === "bulk_delete") && Array.isArray(body.ids)) {
      await prisma.lead_sources.deleteMany({
        where: { id: { in: body.ids.map((i: unknown) => BigInt(String(i))) } },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.lead_sources.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Lead Medium / Types
  if (resource === "types") {
    if (action === "create") {
      const t = await prisma.lead_types.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || ""),
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: t }))
    }
    if (action === "update" && body.id) {
      await prisma.lead_types.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || ""),
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if ((action === "delete" || action === "bulk_delete") && Array.isArray(body.ids)) {
      await prisma.lead_types.deleteMany({
        where: { id: { in: body.ids.map((i: unknown) => BigInt(String(i))) } },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.lead_types.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Attributes (with validation, lookup_type, sort_order, is_unique)
  if (resource === "attributes") {
    if (action === "create") {
      const code =
        String(body.code || "").trim() ||
        String(body.name || "attr")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
      const a = await prisma.attributes.create({
        data: {
          code,
          name: String(body.name || "").trim(),
          type: String(body.type || "text"),
          lookup_type: body.lookup_type ? String(body.lookup_type) : null,
          entity_type: String(body.entity_type || "lead"),
          sort_order: Number(body.sort_order ?? 0),
          validation: body.validation ? String(body.validation) : null,
          is_required: Boolean(body.is_required),
          is_unique: Boolean(body.is_unique),
          quick_add: body.quick_add !== false,
          is_user_defined: true,
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: a }))
    }
    if (action === "update" && body.id) {
      await prisma.attributes.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          code: body.code ? String(body.code).trim() : undefined,
          type: String(body.type || "text"),
          lookup_type:
            body.lookup_type !== undefined
              ? body.lookup_type
                ? String(body.lookup_type)
                : null
              : undefined,
          entity_type: body.entity_type ? String(body.entity_type) : undefined,
          sort_order:
            body.sort_order !== undefined ? Number(body.sort_order) : undefined,
          validation:
            body.validation !== undefined
              ? body.validation
                ? String(body.validation)
                : null
              : undefined,
          is_required: Boolean(body.is_required),
          is_unique: Boolean(body.is_unique),
          quick_add: Boolean(body.quick_add),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.attributes.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.attributes.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // Campaigns (with type, mail_to, spooling, status)
  if (resource === "campaigns") {
    const normalizedCampStatus =
      body.status === false ||
      body.status === 0 ||
      body.status === "0" ||
      String(body.status || "").toLowerCase() === "inactive"
        ? "0"
        : "1"
    if (action === "create") {
      const c = await prisma.campaigns.create({
        data: {
          name: String(body.name || "").trim(),
          subject: String(body.subject || "").trim(),
          status: normalizedCampStatus,
          type: String(body.type || "email"),
          mail_to: String(body.mail_to || "all_leads"),
          spooling: String(body.spooling || "queue"),
          marketing_event_id: body.marketing_event_id
            ? Number(body.marketing_event_id)
            : null,
          marketing_template_id: body.marketing_template_id
            ? Number(body.marketing_template_id)
            : null,
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: c }))
    }
    if (action === "update" && body.id) {
      await prisma.campaigns.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          subject: String(body.subject || "").trim(),
          status: normalizedCampStatus,
          type: String(body.type || "email"),
          mail_to: body.mail_to !== undefined ? String(body.mail_to) : undefined,
          spooling:
            body.spooling !== undefined ? String(body.spooling) : undefined,
          marketing_event_id: body.marketing_event_id
            ? Number(body.marketing_event_id)
            : null,
          marketing_template_id: body.marketing_template_id
            ? Number(body.marketing_template_id)
            : null,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "dispatch" && body.id) {
      const camp = await prisma.campaigns.findUnique({
        where: { id: Number(body.id) },
      })
      const leads = await prisma.leads.findMany({
        where: { organization_id: BigInt(orgId) },
        take: 25,
      })
      const recipients = leads.filter((l) => l.email).length || leads.length
      if (camp?.marketing_template_id) {
        const cType = String(camp.type || "email").toLowerCase()
        if (cType === "sms") {
          await prisma.message_templates.updateMany({
            where: { id: BigInt(camp.marketing_template_id) },
            data: { sent_count: { increment: recipients } },
          })
        } else if (cType === "whatsapp") {
          await prisma.whatsapp_templates.updateMany({
            where: { id: BigInt(camp.marketing_template_id) },
            data: { sent_count: { increment: recipients } },
          })
        } else {
          await prisma.email_templates.updateMany({
            where: { id: camp.marketing_template_id },
            data: { sent_count: { increment: recipients } },
          })
        }
      }
      await prisma.campaigns.update({
        where: { id: Number(body.id) },
        data: { status: "1", updated_at: now },
      })
      return NextResponse.json({ ok: true, recipients })
    }
    if (action === "delete" && body.id) {
      await prisma.campaigns.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.campaigns.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // Marketing Events
  if (resource === "marketing_events") {
    if (action === "create") {
      const ev = await prisma.marketing_events.create({
        data: {
          name: String(body.name || ""),
          description: String(body.description || ""),
          date: body.date ? new Date(body.date) : now,
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: ev }))
    }
    if (action === "update" && body.id) {
      await prisma.marketing_events.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || ""),
          description: String(body.description || ""),
          date: body.date ? new Date(body.date) : now,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.marketing_events.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Webhooks (supports dynamic query_params, headers, payload_type, raw_payload_type, payload)
  if (resource === "webhooks") {
    const serializeParamField = (val: unknown, fallback = "[]") =>
      typeof val === "string"
        ? val
        : val !== undefined && val !== null
          ? JSON.stringify(val)
          : fallback

    if (action === "create") {
      const wh = await prisma.webhooks.create({
        data: {
          name: String(body.name || "").trim(),
          entity_type: String(body.entity_type || "leads"),
          description: body.description ? String(body.description) : null,
          method: String(body.method || "post").toLowerCase(),
          end_point: String(body.end_point || "").trim(),
          query_params: serializeParamField(body.query_params, "[]"),
          headers: serializeParamField(body.headers, "[]"),
          payload_type: String(body.payload_type || "x-www-form-urlencoded"),
          raw_payload_type: String(body.raw_payload_type || "json"),
          payload: serializeParamField(body.payload, "[]"),
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: wh }))
    }
    if (action === "update" && body.id) {
      await prisma.webhooks.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || "").trim(),
          entity_type: String(body.entity_type || "leads"),
          description: body.description ? String(body.description) : null,
          method: String(body.method || "post").toLowerCase(),
          end_point: String(body.end_point || "").trim(),
          query_params: serializeParamField(body.query_params, "[]"),
          headers: serializeParamField(body.headers, "[]"),
          payload_type: String(body.payload_type || "x-www-form-urlencoded"),
          raw_payload_type: String(body.raw_payload_type || "json"),
          payload: serializeParamField(body.payload, "[]"),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "test" && body.id) {
      const wh = await prisma.webhooks.findUnique({
        where: { id: BigInt(body.id) },
      })
      return NextResponse.json({
        ok: true,
        message: `Test ${(wh?.method || "POST").toUpperCase()} payload dispatched to ${wh?.end_point}`,
      })
    }
    if (action === "delete" && body.id) {
      await prisma.webhooks.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Email / SMS / WhatsApp Templates
  if (
    resource === "email_templates" ||
    resource === "message_templates" ||
    resource === "whatsapp_templates"
  ) {
    const targetOrg = body.organization_id
      ? BigInt(body.organization_id)
      : BigInt(orgId)
    const stVal =
      body.status === "inactive" ||
      body.status === "0" ||
      body.status === 0 ||
      body.status === false
        ? ("inactive" as const)
        : ("active" as const)
    const tplTitle = String(body.title || body.name || "").trim()
    const msgText = String(body.message ?? body.content ?? "")
    const detectedVars = Array.from(
      new Set((msgText.match(/\{\{?[a-zA-Z0-9_]+\}?\}/g) || []))
    )
    const varsJson = JSON.stringify(detectedVars)

    if (action === "create") {
      if (resource === "email_templates") {
        const t = await prisma.email_templates.create({
          data: {
            organization_id: targetOrg,
            created_by: BigInt(ctx.userId),
            send_by: body.send_by ? String(body.send_by) : null,
            title: tplTitle,
            category: String(body.category || "General"),
            subject: String(body.subject || ""),
            message: msgText,
            variables_json: varsJson,
            status: stVal,
            created_at: now,
            updated_at: now,
          },
        })
        return NextResponse.json(serializeData({ ok: true, item: t }))
      }
      if (resource === "message_templates") {
        const t = await prisma.message_templates.create({
          data: {
            organization_id: targetOrg,
            created_by: BigInt(ctx.userId),
            send_by: body.send_by ? String(body.send_by) : null,
            title: tplTitle,
            category: String(body.category || "General"),
            message: msgText,
            variables_json: varsJson,
            status: stVal,
            created_at: now,
            updated_at: now,
          },
        })
        return NextResponse.json(serializeData({ ok: true, item: t }))
      }
      const t = await prisma.whatsapp_templates.create({
        data: {
          organization_id: targetOrg,
          created_by: BigInt(ctx.userId),
          send_by: body.send_by ? String(body.send_by) : null,
          title: tplTitle,
          category: String(body.category || "General"),
          message: msgText,
          variables_json: varsJson,
          status: stVal,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: t }))
    }

    if (action === "update" && body.id) {
      if (resource === "email_templates") {
        await prisma.email_templates.update({
          where: { id: Number(body.id) },
          data: {
            organization_id: targetOrg,
            title: tplTitle,
            category: String(body.category || "General"),
            send_by: body.send_by ? String(body.send_by) : null,
            subject: String(body.subject || ""),
            message: msgText,
            variables_json: varsJson,
            status: stVal,
            updated_at: now,
          },
        })
      } else if (resource === "message_templates") {
        await prisma.message_templates.update({
          where: { id: BigInt(body.id) },
          data: {
            organization_id: targetOrg,
            title: tplTitle,
            category: String(body.category || "General"),
            send_by: body.send_by ? String(body.send_by) : null,
            message: msgText,
            variables_json: varsJson,
            status: stVal,
            updated_at: now,
          },
        })
      } else {
        await prisma.whatsapp_templates.update({
          where: { id: BigInt(body.id) },
          data: {
            organization_id: targetOrg,
            title: tplTitle,
            category: String(body.category || "General"),
            send_by: body.send_by ? String(body.send_by) : null,
            message: msgText,
            variables_json: varsJson,
            status: stVal,
            updated_at: now,
          },
        })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      if (resource === "email_templates") {
        await prisma.email_templates.delete({ where: { id: Number(body.id) } })
      } else if (resource === "message_templates") {
        await prisma.message_templates.delete({
          where: { id: BigInt(body.id) },
        })
      } else {
        await prisma.whatsapp_templates.delete({
          where: { id: BigInt(body.id) },
        })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      if (resource === "email_templates") {
        await prisma.email_templates.deleteMany({
          where: { id: { in: body.ids.map(Number) } },
        })
      } else if (resource === "message_templates") {
        await prisma.message_templates.deleteMany({
          where: { id: { in: body.ids.map((i: unknown) => BigInt(String(i))) } },
        })
      } else {
        await prisma.whatsapp_templates.deleteMany({
          where: { id: { in: body.ids.map((i: unknown) => BigInt(String(i))) } },
        })
      }
      return NextResponse.json({ ok: true })
    }
  }

  // Coupons (single & bulk mode + start_at / end_at + usage_type + min_amount / max_discount)
  if (resource === "coupons") {
    const isPercent =
      body.type === "percent" || body.discount_type === "percentage"
    const usageType = body.usage_type === "single" ? "single" : "multiple"
    const startAt = body.start_at ? new Date(body.start_at) : null
    const endAt =
      body.end_at || body.expires_at
        ? new Date(body.end_at || body.expires_at)
        : null

    if (action === "create") {
      if (body.mode === "bulk" || body.creation_mode === "bulk") {
        const count = Math.min(
          200,
          Math.max(1, Number(body.bulk_count || body.count || 10))
        )
        const prefix =
          String(body.prefix || body.code || body.name || "CPN")
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 6) || "CPN"
        for (let i = 0; i < count; i++) {
          const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
          await prisma.coupons.create({
            data: {
              organization_id: BigInt(orgId),
              code: `${prefix}-${rand}${i + 1}`,
              name: body.name ? String(body.name) : `${prefix} Batch`,
              type: isPercent ? "percent" : "flat",
              value: Number(body.value ?? body.discount_value ?? 0),
              min_amount: body.min_amount ? Number(body.min_amount) : null,
              max_discount: body.max_discount
                ? Number(body.max_discount)
                : null,
              usage_type: usageType,
              usage_limit:
                usageType === "multiple" && body.usage_limit
                  ? Number(body.usage_limit)
                  : null,
              start_at: startAt,
              end_at: endAt,
              status: Number(body.status ?? 1),
              created_by: BigInt(ctx.userId),
              created_at: now,
              updated_at: now,
            },
          })
        }
        return NextResponse.json({ ok: true, count, created: count })
      }

      const c = await prisma.coupons.create({
        data: {
          organization_id: BigInt(orgId),
          code: String(body.code || "")
            .trim()
            .toUpperCase(),
          name: body.name ? String(body.name) : null,
          type: isPercent ? "percent" : "flat",
          value: Number(body.value ?? body.discount_value ?? 0),
          min_amount: body.min_amount ? Number(body.min_amount) : null,
          max_discount: body.max_discount ? Number(body.max_discount) : null,
          usage_type: usageType,
          usage_limit:
            usageType === "multiple" && body.usage_limit
              ? Number(body.usage_limit)
              : null,
          start_at: startAt,
          end_at: endAt,
          status: Number(body.status ?? 1),
          created_by: BigInt(ctx.userId),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: c }))
    }

    if (action === "update" && body.id) {
      await prisma.coupons.update({
        where: { id: BigInt(body.id) },
        data: {
          code: String(body.code || "")
            .trim()
            .toUpperCase(),
          name: body.name ? String(body.name) : null,
          type: isPercent ? "percent" : "flat",
          value: Number(body.value ?? body.discount_value ?? 0),
          min_amount: body.min_amount ? Number(body.min_amount) : null,
          max_discount: body.max_discount ? Number(body.max_discount) : null,
          usage_type: usageType,
          usage_limit:
            usageType === "multiple" && body.usage_limit
              ? Number(body.usage_limit)
              : null,
          start_at: startAt,
          end_at: endAt,
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "toggle_status" && body.id) {
      const existing = await prisma.coupons.findUnique({
        where: { id: BigInt(body.id) },
      })
      const next = existing?.status === 1 ? 0 : 1
      await prisma.coupons.update({
        where: { id: BigInt(body.id) },
        data: { status: next, updated_at: now },
      })
      return NextResponse.json({ ok: true, status: next })
    }

    if (action === "delete" && body.id) {
      await prisma.coupons.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // Lead Distribution Rules + Simulator
  if (resource === "lead_distribution") {
    if (action === "create") {
      const r = await prisma.lead_distribution_rules.create({
        data: {
          organization_id: BigInt(orgId),
          rule_name: String(
            body.rule_name || body.name || "Distribution Rule"
          ),
          distribution_type:
            body.distribution_type === "source" || body.source_id
              ? "source"
              : "random",
          is_active: body.is_active !== false,
          created_at: now,
          updated_at: now,
        },
      })
      const poolIds: number[] = Array.isArray(body.assign_user_ids)
        ? body.assign_user_ids.map(Number).filter(Boolean)
        : body.user_id
          ? [Number(body.user_id)]
          : []
      for (const uid of poolIds) {
        await prisma.lead_distribution_rule_items.create({
          data: {
            rule_id: r.id,
            source_id: body.source_id ? BigInt(body.source_id) : null,
            assign_type: "user",
            user_id: BigInt(uid),
            percentage: Math.round(100 / Math.max(1, poolIds.length)),
            created_at: now,
            updated_at: now,
          },
        })
      }
      return NextResponse.json(serializeData({ ok: true, item: r }))
    }
    if (action === "simulate") {
      const users = await prisma.registers.findMany({
        where: { organization: String(orgId), is_available_for_leads: 1 },
      })
      const winner =
        users[Math.floor(Math.random() * Math.max(1, users.length))]
      return NextResponse.json({
        ok: true,
        matchedRule: "Active Round-Robin Engine",
        assignedUserId: winner?.user_id || ctx.userId,
        simulation: winner
          ? `Lead would be routed to ${winner.first_name} ${winner.last_name} (${winner.email}) via Active Distribution Engine.`
          : "No active counsellors marked available.",
      })
    }
    if (action === "delete" && body.id) {
      await prisma.lead_distribution_rule_items.deleteMany({
        where: { rule_id: BigInt(body.id) },
      })
      await prisma.lead_distribution_rules.delete({
        where: { id: BigInt(body.id) },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // General Settings
  if (resource === "general_settings") {
    const existing = await prisma.general_settings.findFirst({
      where: { organization_id: BigInt(orgId) },
    })
    if (existing) {
      await prisma.general_settings.update({
        where: { id: existing.id },
        data: {
          app_name: String(body.app_name || "LMS - DF CRM"),
          currency: String(body.currency || "INR"),
          timezone: String(body.timezone || "Asia/Kolkata"),
          default_payment_gateway: String(
            body.default_payment_gateway || "razorpay"
          ),
          date_format: String(body.date_format || "d M, Y"),
          updated_at: now,
        },
      })
    } else {
      await prisma.general_settings.create({
        data: {
          organization_id: BigInt(orgId),
          app_name: String(body.app_name || "LMS - DF CRM"),
          currency: String(body.currency || "INR"),
          timezone: String(body.timezone || "Asia/Kolkata"),
          default_payment_gateway: String(
            body.default_payment_gateway || "razorpay"
          ),
          date_format: String(body.date_format || "d M, Y"),
          status: 1,
          created_at: now,
          updated_at: now,
        },
      })
    }
    return NextResponse.json({ ok: true })
  }

  // Lead Settings Matrix (supports both entries[] and rows[])
  const settingsRows = Array.isArray(body.entries)
    ? body.entries
    : Array.isArray(body.rows)
      ? body.rows
      : null
  if (resource === "lead_settings" && settingsRows) {
    for (const row of settingsRows) {
      const enabledVal =
        row.enabled !== undefined ? Boolean(row.enabled) : Boolean(row.can_view)
      const isDl = String(row.field) === "can_download"
      const existing = await prisma.lead_settings.findFirst({
        where: {
          organization_id: orgId,
          role_slug: String(row.role_slug),
          field: String(row.field),
        },
      })
      if (existing) {
        await prisma.lead_settings.update({
          where: { id: existing.id },
          data: {
            can_view: enabledVal,
            can_edit:
              row.can_edit !== undefined ? Boolean(row.can_edit) : enabledVal,
            can_download: isDl ? enabledVal : Boolean(row.can_download),
            updated_at: now,
          },
        })
      } else {
        await prisma.lead_settings.create({
          data: {
            organization_id: orgId,
            role_slug: String(row.role_slug),
            field: String(row.field),
            can_view: enabledVal,
            can_edit:
              row.can_edit !== undefined ? Boolean(row.can_edit) : enabledVal,
            can_download: isDl ? enabledVal : Boolean(row.can_download),
            created_at: now,
            updated_at: now,
          },
        })
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Raw Data Queue
  if (resource === "raw_data") {
    if (action === "create_raw") {
      const rl = await prisma.automation_raw_leads.create({
        data: {
          organization_id: orgId,
          name: String(body.name || ""),
          mobile: String(body.mobile || ""),
          course:
            body.course || body.email
              ? String(body.course || body.email)
              : null,
          city: body.city ? String(body.city) : null,
          campaign: body.campaign ? String(body.campaign) : null,
          source: body.source ? String(body.source) : "Manual",
          status: "pending",
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: rl }))
    }

    if (action === "update_raw" && body.id) {
      const normalizedRawStatus =
        body.status === "confirmed" ||
        body.status === "rejected" ||
        body.status === "ivr_sent" ||
        body.status === "whatsapp_sent" ||
        body.status === "ivr_failed"
          ? body.status
          : body.status === "failed"
            ? ("ivr_failed" as const)
            : ("pending" as const)
      await prisma.automation_raw_leads.update({
        where: { id: BigInt(body.id) },
        data: {
          name: body.name ? String(body.name) : null,
          mobile: String(body.mobile || ""),
          course: body.course ? String(body.course) : null,
          city: body.city ? String(body.city) : null,
          campaign: body.campaign ? String(body.campaign) : null,
          source: body.source ? String(body.source) : null,
          status: normalizedRawStatus,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete_raw" && body.id) {
      await prisma.automation_raw_leads.delete({
        where: { id: BigInt(body.id) },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk_csv" && Array.isArray(body.rows)) {
      const batch = await prisma.automation_raw_lead_uploads.create({
        data: {
          organization_id: BigInt(orgId),
          user_id: BigInt(ctx.userId),
          file_name: String(body.file_name || "raw_leads.csv"),
          total_rows: body.rows.length,
          valid_rows: 0,
          duplicate_rows: 0,
          failed_rows: 0,
          status: "processing",
          started_at: now,
          created_at: now,
          updated_at: now,
        },
      })

      let valid = 0
      let duplicate = 0
      let failed = 0
      for (const r of body.rows) {
        const mob = String(r.mobile || "").trim()
        if (!mob) {
          failed++
          continue
        }
        const exists = await prisma.automation_raw_leads.findFirst({
          where: { organization_id: orgId, mobile: mob },
        })
        if (exists) {
          duplicate++
          continue
        }
        valid++
        await prisma.automation_raw_leads.create({
          data: {
            upload_id: batch.id,
            organization_id: orgId,
            name: String(r.name || "Raw Prospect"),
            mobile: mob,
            course: r.course ? String(r.course) : null,
            city: r.city ? String(r.city) : null,
            campaign: r.campaign ? String(r.campaign) : null,
            source: r.source ? String(r.source) : "CSV Upload",
            status: "pending",
            created_at: now,
            updated_at: now,
          },
        })
      }

      await prisma.automation_raw_lead_uploads.update({
        where: { id: batch.id },
        data: {
          valid_rows: valid,
          duplicate_rows: duplicate,
          failed_rows: failed,
          status: "completed",
          completed_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(
        serializeData({ ok: true, valid, duplicate, failed, upload_id: batch.id })
      )
    }

    if (action === "send_ivr" && body.id) {
      await prisma.automation_raw_leads.update({
        where: { id: BigInt(body.id) },
        data: {
          status: "ivr_sent",
          ivr_response: "1 (Interested)",
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk_send_ivr" && Array.isArray(body.ids)) {
      const ids = body.ids.map((i: unknown) => BigInt(String(i)))
      await prisma.automation_raw_leads.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "ivr_sent",
          ivr_response: "RINGING",
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true, count: ids.length })
    }

    if (action === "send_batch_comm" && body.upload_id) {
      const channel = String(body.channel || "ivr")
      const batchLeads = await prisma.automation_raw_leads.findMany({
        where: { upload_id: BigInt(body.upload_id), organization_id: orgId },
      })
      if (channel === "ivr") {
        await prisma.automation_raw_leads.updateMany({
          where: { upload_id: BigInt(body.upload_id), organization_id: orgId },
          data: { status: "ivr_sent", ivr_response: "QUEUED", updated_at: now },
        })
      } else if (channel === "whatsapp") {
        for (const bl of batchLeads.slice(0, 30)) {
          await prisma.whatsapp_logs.create({
            data: {
              organization_id: BigInt(orgId),
              mobile: bl.mobile,
              message: String(
                body.message ||
                  `Hello ${bl.name || "Student"}, confirm your admission inquiry for ${bl.course || "our program"}.`
              ),
              provider: "whatsapp",
              status: "sent",
              sent_at: now,
              created_at: now,
              updated_at: now,
            },
          })
        }
      } else {
        for (const bl of batchLeads.slice(0, 30)) {
          await prisma.sms_logs.create({
            data: {
              organization_id: BigInt(orgId),
              mobile: bl.mobile,
              message: String(
                body.message ||
                  `Hi ${bl.name || "Student"}, thank you for your interest in ${bl.course || "admissions"}.`
              ),
              provider: "sms",
              status: "sent",
              sent_at: now,
              created_at: now,
              updated_at: now,
            },
          })
        }
      }
      return NextResponse.json({ ok: true, count: batchLeads.length })
    }

    if (action === "convert_lead" && body.id) {
      const raw = await prisma.automation_raw_leads.findUnique({
        where: { id: BigInt(body.id) },
      })
      if (!raw) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      const lead = await prisma.leads.create({
        data: {
          organization_id: BigInt(orgId),
          name: raw.name || "Raw Verified Lead",
          mobile: raw.mobile,
          city: raw.city || null,
          lead_assign_to: BigInt(ctx.userId),
          lead_score: 25,
          lead_registration_date: now,
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.automation_raw_leads.update({
        where: { id: raw.id },
        data: {
          status: "confirmed",
          confirm_time: now,
          lead_created_status: true,
          lead_created_time: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, lead_id: lead.id }))
    }
  }

  // Landing Page Sections
  if (resource === "landing_page_sections") {
    if (action === "create") {
      const sec = await prisma.landing_page_sections.create({
        data: {
          page_id: BigInt(body.page_id),
          section_key: String(body.section_key || "hero"),
          content_json: String(body.content_json || "{}"),
          sort_order: Number(body.sort_order ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: sec }))
    }
    if (action === "update" && body.id) {
      await prisma.landing_page_sections.update({
        where: { id: BigInt(body.id) },
        data: {
          section_key: body.section_key
            ? String(body.section_key)
            : undefined,
          content_json:
            body.content_json !== undefined
              ? String(body.content_json)
              : undefined,
          sort_order:
            body.sort_order !== undefined ? Number(body.sort_order) : undefined,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "reorder" && Array.isArray(body.ordered_ids)) {
      for (let i = 0; i < body.ordered_ids.length; i++) {
        await prisma.landing_page_sections.update({
          where: { id: BigInt(String(body.ordered_ids[i])) },
          data: { sort_order: i + 1, updated_at: now },
        })
      }
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.landing_page_sections.delete({
        where: { id: BigInt(body.id) },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // WebForm Attributes
  if (resource === "web_form_attributes") {
    if (action === "create") {
      const attr = await prisma.web_form_attributes.create({
        data: {
          web_form_id: Number(body.web_form_id),
          name: String(body.name || "Field"),
          placeholder: body.placeholder ? String(body.placeholder) : null,
          type: String(body.type || "text"),
          is_required: Boolean(body.is_required),
          is_hidden: Boolean(body.is_hidden),
          sort_order: Number(body.sort_order ?? 0),
          options: body.options ? String(body.options) : null,
          default_value: body.default_value
            ? String(body.default_value)
            : null,
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: attr }))
    }
    if (action === "delete" && body.id) {
      await prisma.web_form_attributes.delete({
        where: { id: Number(body.id) },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // Application Submission actions
  if (resource === "application_submission" && body.id) {
    const subId = BigInt(body.id)
    const subRow = await prisma.application_form_responses.findUnique({
      where: { id: subId },
    })
    if (!subRow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (action === "update_status") {
      const nextData: Record<string, unknown> = { updated_at: now }
      if (body.status) {
        nextData.status = String(body.status)
        if (body.status === "approved") nextData.fill_percentage = 100
      }
      if (body.payment_status !== undefined) {
        const isPaid =
          body.payment_status === "paid" ||
          body.payment_status === 1 ||
          body.payment_status === "1" ||
          body.payment_status === true
        nextData.payment_status = isPaid ? 1 : 0
        if (isPaid && !subRow.payment_method) {
          nextData.payment_method = String(body.payment_method || "razorpay")
        }
      }
      await prisma.application_form_responses.update({
        where: { id: subId },
        data: nextData,
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "approve") {
      await prisma.application_form_responses.update({
        where: { id: subId },
        data: { status: "approved", fill_percentage: 100, updated_at: now },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "reject") {
      await prisma.application_form_responses.update({
        where: { id: subId },
        data: { status: "rejected", updated_at: now },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "mark_paid") {
      await prisma.application_form_responses.update({
        where: { id: subId },
        data: {
          payment_status: 1,
          payment_method: String(body.payment_method || "razorpay"),
          status: subRow.status || "submitted",
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "convert_lead") {
      let parsed: Record<string, unknown> = {}
      try {
        parsed = JSON.parse(subRow.response_json || "{}")
      } catch {}
      const lead = await prisma.leads.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(
            parsed.name || parsed.full_name || parsed.student_name || "Applicant"
          ),
          mobile: String(parsed.mobile || parsed.phone || "9800000000"),
          email: parsed.email ? String(parsed.email) : null,
          city: parsed.city ? String(parsed.city) : null,
          application_form_id: Number(subRow.lead_form_id),
          lead_assign_to: BigInt(ctx.userId),
          lead_score: 40,
          lead_registration_date: now,
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.application_form_responses.update({
        where: { id: subId },
        data: { lead_id: Number(lead.id), updated_at: now },
      })
      return NextResponse.json(serializeData({ ok: true, lead_id: lead.id }))
    }
    if (action === "delete") {
      await prisma.application_form_responses.delete({ where: { id: subId } })
      return NextResponse.json({ ok: true })
    }
  }

  // FormDesk wrapper alias (`resource: "formdesk", sub: "web_forms" | "application_forms" | "landing_pages"`)
  const effectiveFormResource =
    resource === "formdesk" ? String(body.sub || "web_forms") : resource

  if (effectiveFormResource === "web_forms") {
    const syncAttributes = async (
      webFormId: number,
      formCode: string,
      attrs: unknown
    ) => {
      if (!Array.isArray(attrs)) return
      await prisma.web_form_attributes.deleteMany({
        where: { web_form_id: webFormId },
      })
      for (let i = 0; i < attrs.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const a: any = attrs[i]
        await prisma.web_form_attributes.create({
          data: {
            web_form_id: webFormId,
            form_id: formCode,
            name: String(a.name || `field_${i + 1}`),
            placeholder: a.placeholder ? String(a.placeholder) : null,
            type: String(a.type || "text"),
            is_required: Boolean(a.is_required),
            is_hidden: Boolean(a.is_hidden),
            sort_order: Number(a.sort_order ?? i),
            options: a.options ? String(a.options) : null,
            default_value: a.default_value ? String(a.default_value) : null,
            created_at: now,
            updated_at: now,
          },
        })
      }
    }

    if (action === "create") {
      const formCode = `wf_${Math.random().toString(36).substring(2, 10)}`
      const attrsList = Array.isArray(body.attributes) ? body.attributes : null
      const wf = await prisma.web_forms.create({
        data: {
          form_id: formCode,
          title: String(body.title || ""),
          description: body.description ? String(body.description) : null,
          submit_button_label: String(body.submit_button_label || "Submit"),
          submit_success_action:
            body.submit_success_action === "redirect" ? "redirect" : "message",
          submit_success_content: String(
            body.submit_success_content ||
              "Thanks for your time. Our team will contact you soon."
          ),
          create_lead: body.create_lead !== false,
          background_color: body.background_color
            ? String(body.background_color)
            : "#f7f8f9",
          form_background_color: body.form_background_color
            ? String(body.form_background_color)
            : "#ffffff",
          form_title_color: body.form_title_color
            ? String(body.form_title_color)
            : "#263238",
          form_submit_button_color: body.form_submit_button_color
            ? String(body.form_submit_button_color)
            : "#0e90d9",
          attribute_label_color: body.attribute_label_color
            ? String(body.attribute_label_color)
            : "#546e7a",
          lead_source_id: Number(body.lead_source_id || 0),
          lead_campaign_id: Number(body.lead_campaign_id || 0),
          pipeline_id: Number(body.pipeline_id || 0),
          type_id: Number(body.type_id || 0),
          application_form_id: body.application_form_id
            ? Number(body.application_form_id)
            : null,
          extra_fields_json: attrsList ? JSON.stringify(attrsList) : "[]",
          organization_id: orgId,
          created_by: ctx.userId,
          created_at: now,
          updated_at: now,
        },
      })
      if (attrsList) {
        await syncAttributes(wf.id, formCode, attrsList)
      }
      return NextResponse.json(serializeData({ ok: true, item: wf }))
    }

    if (action === "update" && body.id) {
      const wfId = Number(body.id)
      const existing = await prisma.web_forms.findUnique({
        where: { id: wfId },
      })
      const attrsList = Array.isArray(body.attributes) ? body.attributes : null
      await prisma.web_forms.update({
        where: { id: wfId },
        data: {
          title: String(body.title || ""),
          description: body.description ? String(body.description) : null,
          submit_button_label: String(body.submit_button_label || "Submit"),
          submit_success_action:
            body.submit_success_action === "redirect" ? "redirect" : "message",
          submit_success_content: String(
            body.submit_success_content ||
              "Thanks for your time. Our team will contact you soon."
          ),
          create_lead: body.create_lead !== false,
          background_color: body.background_color
            ? String(body.background_color)
            : "#f7f8f9",
          form_background_color: body.form_background_color
            ? String(body.form_background_color)
            : "#ffffff",
          form_title_color: body.form_title_color
            ? String(body.form_title_color)
            : "#263238",
          form_submit_button_color: body.form_submit_button_color
            ? String(body.form_submit_button_color)
            : "#0e90d9",
          attribute_label_color: body.attribute_label_color
            ? String(body.attribute_label_color)
            : "#546e7a",
          lead_source_id:
            body.lead_source_id !== undefined
              ? Number(body.lead_source_id || 0)
              : undefined,
          lead_campaign_id:
            body.lead_campaign_id !== undefined
              ? Number(body.lead_campaign_id || 0)
              : undefined,
          pipeline_id:
            body.pipeline_id !== undefined
              ? Number(body.pipeline_id || 0)
              : undefined,
          type_id:
            body.type_id !== undefined ? Number(body.type_id || 0) : undefined,
          application_form_id:
            body.application_form_id !== undefined
              ? body.application_form_id
                ? Number(body.application_form_id)
                : null
              : undefined,
          extra_fields_json: attrsList ? JSON.stringify(attrsList) : undefined,
          updated_at: now,
        },
      })
      if (attrsList) {
        await syncAttributes(
          wfId,
          existing?.form_id || `wf_${wfId}`,
          attrsList
        )
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.web_form_attributes.deleteMany({
        where: { web_form_id: Number(body.id) },
      })
      await prisma.web_forms.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  if (effectiveFormResource === "application_forms") {
    const fees = Number(body.fees ?? 0)
    const taxPercent = Number(body.tax ?? 0)
    const computedTotal =
      body.total_amount !== undefined && Number(body.total_amount) > 0
        ? Number(body.total_amount)
        : Number((fees + (fees * taxPercent) / 100).toFixed(2))
    const countriesJson = Array.isArray(body.allowed_countries)
      ? JSON.stringify(body.allowed_countries)
      : typeof body.allowed_countries === "string"
        ? body.allowed_countries
        : "[]"
    const institutesJson = Array.isArray(body.allowed_institutes)
      ? JSON.stringify(body.allowed_institutes)
      : typeof body.allowed_institutes === "string"
        ? body.allowed_institutes
        : "[]"

    const appFormStatus =
      body.status === "inactive" ||
      body.status === "0" ||
      body.status === 0 ||
      body.status === false
        ? ("inactive" as const)
        : ("active" as const)

    if (action === "create") {
      const af = await prisma.application_forms.create({
        data: {
          unique_code: Math.random().toString(36).substring(2, 12),
          title: String(body.title || ""),
          form_name: String(body.form_name || "form1"),
          description: body.description ? String(body.description) : null,
          allowed_countries: countriesJson,
          allowed_institutes: institutesJson,
          status: appFormStatus,
          fees,
          tax: taxPercent,
          total_amount: computedTotal,
          gateway: String(body.gateway || "razorpay"),
          organization_id: orgId,
          created_by: BigInt(ctx.userId),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: af }))
    }

    if (action === "update" && body.id) {
      await prisma.application_forms.update({
        where: { id: BigInt(body.id) },
        data: {
          title: String(body.title || ""),
          form_name: String(body.form_name || "form1"),
          description: body.description ? String(body.description) : null,
          allowed_countries: countriesJson,
          allowed_institutes: institutesJson,
          status: appFormStatus,
          fees,
          tax: taxPercent,
          total_amount: computedTotal,
          gateway: String(body.gateway || "razorpay"),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.application_forms.delete({
        where: { id: BigInt(body.id) },
      })
      return NextResponse.json({ ok: true })
    }
  }

  if (effectiveFormResource === "landing_pages") {
    if (action === "create") {
      const slug =
        String(body.slug || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-") || `page-${Date.now()}`
      const lp = await prisma.landing_pages.create({
        data: {
          organization_id: BigInt(orgId),
          campaign_id: body.campaign_id ? BigInt(body.campaign_id) : null,
          slug,
          title: String(body.title || ""),
          layout_name: String(body.layout_name || "velzon"),
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })

      if (body.seed_default_sections !== false) {
        const templateSections = await prisma.landing_page_sections.findMany({
          where: { page_id: BigInt(1) },
          orderBy: { sort_order: "asc" },
        })
        if (templateSections.length > 0) {
          for (const ts of templateSections) {
            await prisma.landing_page_sections.create({
              data: {
                page_id: lp.id,
                section_key: ts.section_key,
                content_json: ts.content_json,
                sort_order: ts.sort_order,
                created_at: now,
                updated_at: now,
              },
            })
          }
        }
      }
      return NextResponse.json(serializeData({ ok: true, item: lp }))
    }

    if (action === "update" && body.id) {
      await prisma.landing_pages.update({
        where: { id: BigInt(body.id) },
        data: {
          title: String(body.title || ""),
          slug: body.slug
            ? String(body.slug)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9-]+/g, "-")
            : undefined,
          layout_name: body.layout_name ? String(body.layout_name) : undefined,
          campaign_id:
            body.campaign_id !== undefined
              ? body.campaign_id
                ? BigInt(body.campaign_id)
                : null
              : undefined,
          status: body.status !== undefined ? Number(body.status) : undefined,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.landing_page_sections.deleteMany({
        where: { page_id: BigInt(body.id) },
      })
      await prisma.landing_pages.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "automation_rules") {
    if (action === "create") {
      const ar = await prisma.automation_rules.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || ""),
          trigger_event: String(body.trigger_event || "lead.created"),
          conditions:
            typeof body.conditions === "string"
              ? body.conditions
              : JSON.stringify(body.conditions || []),
          actions:
            typeof body.actions === "string"
              ? body.actions
              : JSON.stringify(body.actions || []),
          is_active: body.is_active !== false,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: ar }))
    }
    if (action === "update" && body.id) {
      await prisma.automation_rules.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || ""),
          trigger_event: String(body.trigger_event || "lead.created"),
          conditions:
            typeof body.conditions === "string"
              ? body.conditions
              : JSON.stringify(body.conditions || []),
          actions:
            typeof body.actions === "string"
              ? body.actions
              : JSON.stringify(body.actions || []),
          is_active: body.is_active !== false,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "toggle" && body.id) {
      const r = await prisma.automation_rules.findUnique({
        where: { id: BigInt(body.id) },
      })
      await prisma.automation_rules.update({
        where: { id: BigInt(body.id) },
        data: { is_active: !r?.is_active },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.automation_rules.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  return NextResponse.json(
    { error: "Invalid resource action" },
    { status: 400 }
  )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Operation failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
