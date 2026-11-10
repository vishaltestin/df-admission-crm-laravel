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
      const [institutes, programs, rawCourses, inventories, org] =
        await Promise.all([
          prisma.institutes.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "asc" },
          }),
          prisma.programs.findMany({ orderBy: { id: "asc" } }),
          prisma.products.findMany({
            where: { organization_id: orgId },
            orderBy: { id: "desc" },
          }),
          prisma.product_inventories.findMany({
            where: {
              OR: [{ organization_id: orgId }, { organization_id: null }],
            },
          }),
          prisma.organizations.findUnique({ where: { id: orgId } }),
        ])

      const courses = rawCourses.map((c) => {
        const prog = programs.find((p) => String(p.id) === String(c.program_id))
        const inst = prog
          ? institutes.find((i) => String(i.id) === String(prog.institute_id))
          : null
        const inv = inventories.find((iv) => iv.product_id === c.id)
        return {
          ...c,
          program_name: prog?.name || null,
          institute_id: inst?.id || prog?.institute_id || null,
          institute_name: inst?.name || null,
          organization_name: org?.name || "-",
          in_stock: inv?.in_stock ?? c.quantity ?? 0,
          allocated: inv?.allocated ?? 0,
        }
      })

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
      const [rawCourses, programs, institutes, inventories, org] =
        await Promise.all([
          prisma.products.findMany({
            where: { organization_id: orgId },
            orderBy: { id: "desc" },
          }),
          prisma.programs.findMany({ orderBy: { id: "asc" } }),
          prisma.institutes.findMany({
            where: { organization_id: BigInt(orgId) },
            orderBy: { id: "asc" },
          }),
          prisma.product_inventories.findMany({
            where: {
              OR: [{ organization_id: orgId }, { organization_id: null }],
            },
          }),
          prisma.organizations.findUnique({ where: { id: orgId } }),
        ])

      const courses = rawCourses.map((c) => {
        const prog = programs.find((p) => String(p.id) === String(c.program_id))
        const inst = prog
          ? institutes.find((i) => String(i.id) === String(prog.institute_id))
          : null
        const inv = inventories.find((iv) => iv.product_id === c.id)
        return {
          ...c,
          program_name: prog?.name || null,
          institute_id: inst?.id || prog?.institute_id || null,
          institute_name: inst?.name || null,
          organization_name: org?.name || "-",
          in_stock: inv?.in_stock ?? c.quantity ?? 0,
          allocated: inv?.allocated ?? 0,
        }
      })

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
      const [items, events, emailTpls, smsTpls, waTpls] = await Promise.all([
        prisma.campaigns.findMany({
          where: { organization_id: orgId },
          orderBy: { id: "desc" },
        }),
        prisma.marketing_events.findMany({ where: { organization_id: orgId } }),
        prisma.email_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.message_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.whatsapp_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
      ])
      const mapTpl = <T extends { title?: string | null }>(rows: T[]) =>
        rows.map((r) => ({ ...r, name: r.title || "" }))
      return NextResponse.json(
        serializeData({
          items,
          events,
          templates: mapTpl(emailTpls),
          emailTemplates: mapTpl(emailTpls),
          messageTemplates: mapTpl(smsTpls),
          whatsappTemplates: mapTpl(waTpls),
        })
      )
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
      const [rawCoupons, rawUsages, users, leads] = await Promise.all([
        prisma.coupons.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.coupon_usages.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
          take: 200,
        }),
        prisma.users.findMany({
          select: { id: true, first_name: true, last_name: true, email: true },
        }),
        prisma.leads.findMany({
          where: { organization_id: BigInt(orgId) },
          select: { id: true, name: true, mobile: true, email: true },
        }),
      ])
      const items = rawCoupons.map((c) => ({
        ...c,
        discount_type: c.type === "percent" ? "percentage" : "flat",
        discount_value: c.value,
      }))
      const usages = rawUsages.map((u) => {
        const cpn = rawCoupons.find((c) => c.id === u.coupon_id)
        const usr = users.find((x) => x.id === Number(u.used_by_user_id))
        const ld = leads.find((x) => Number(x.id) === Number(u.lead_id))
        let metaObj: Record<string, unknown> = {}
        if (u.meta_json) {
          try {
            metaObj =
              typeof u.meta_json === "string"
                ? JSON.parse(u.meta_json)
                : (u.meta_json as Record<string, unknown>)
          } catch {
            metaObj = {}
          }
        }
        return {
          ...u,
          coupon_code:
            cpn?.code || (metaObj.coupon_code as string) || `#${u.coupon_id}`,
          user_name: usr
            ? `${usr.first_name || ""} ${usr.last_name || ""}`.trim() ||
              usr.email
            : u.used_by_user_id
              ? `User #${u.used_by_user_id}`
              : "-",
          lead_name: ld?.name || null,
          mobile:
            ld?.mobile ||
            (metaObj.mobile as string) ||
            (metaObj.phone as string) ||
            "-",
          ip_address:
            (metaObj.ip as string) ||
            (metaObj.ip_address as string) ||
            "-",
          payment_method: (metaObj.payment_method as string) || null,
        }
      })
      return NextResponse.json(serializeData({ items, usages }))
    }

    case "lead_distribution": {
      const [
        rules,
        items,
        sources,
        allUsers,
        registers,
        teams,
        designations,
        institutes,
      ] = await Promise.all([
        prisma.lead_distribution_rules.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.lead_distribution_rule_items.findMany({
          orderBy: { id: "asc" },
        }),
        prisma.lead_sources.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { name: "asc" },
        }),
        prisma.users.findMany({
          select: { id: true, first_name: true, last_name: true, email: true },
          orderBy: { id: "asc" },
        }),
        prisma.registers.findMany({
          where: { organization: String(orgId) },
        }),
        prisma.teams.findMany({
          where: { organization_id: orgId },
          orderBy: { name: "asc" },
        }),
        prisma.designation.findMany({
          where: { organization_id: orgId },
          orderBy: { name: "asc" },
        }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
        }),
      ])

      const orgUserIds = new Set(registers.map((r) => Number(r.user_id)))
      const users = (
        orgUserIds.size > 0
          ? allUsers.filter((u) => orgUserIds.has(Number(u.id)))
          : allUsers
      ).map((u) => ({
        ...u,
        name:
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          u.email ||
          `User #${u.id}`,
      }))

      const userNameMap = new Map(
        allUsers.map((u) => [
          Number(u.id),
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
            u.email ||
            `User #${u.id}`,
        ])
      )
      const sourceNameMap = new Map(
        sources.map((s) => [Number(s.id), s.name || `Source #${s.id}`])
      )
      const teamNameMap = new Map(
        teams.map((t) => [Number(t.id), t.name || `Team #${t.id}`])
      )
      const desigNameMap = new Map(
        designations.map((d) => [
          Number(d.id),
          d.name || `Designation #${d.id}`,
        ])
      )

      const mappedRules = rules.map((r, idx) => {
        const rItems = items
          .filter((i) => i.rule_id === r.id)
          .map((i) => {
            const assignId =
              i.assign_type === "team"
                ? i.team_id
                : i.assign_type === "designation"
                  ? i.designation_id
                  : i.user_id
            const targetLabel =
              i.assign_type === "team"
                ? `Team: ${teamNameMap.get(Number(i.team_id || 0)) || `#${i.team_id}`}`
                : i.assign_type === "designation"
                  ? `Designation: ${desigNameMap.get(Number(i.designation_id || 0)) || `#${i.designation_id}`}`
                  : userNameMap.get(Number(i.user_id || 0)) ||
                    `User #${i.user_id}`
            return {
              ...i,
              assign_id: assignId ? Number(assignId) : null,
              source_name: i.source_id
                ? sourceNameMap.get(Number(i.source_id)) ||
                  `Source #${i.source_id}`
                : null,
              target_label: targetLabel,
            }
          })

        const summary =
          r.distribution_type === "source"
            ? rItems
                .map(
                  (i) =>
                    `${i.source_name || "Any Source"} → ${i.target_label}${
                      i.percentage !== null && i.percentage !== undefined
                        ? ` (${i.percentage}%)`
                        : ""
                    }`
                )
                .join(" · ") || "No source mappings"
            : rItems.map((i) => i.target_label).join(", ") || "All Active Pool"

        return {
          ...r,
          name: r.rule_name,
          priority: idx + 1,
          assign_to: summary,
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
          designations,
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
      const [
        uploads,
        rawLeads,
        callLogs,
        comms,
        ivrLogsRaw,
        whatsappLogsRaw,
        smsLogsRaw,
        leads,
        campaigns,
        waTemplates,
        smsTemplates,
      ] = await Promise.all([
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
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: BigInt(0) }],
          },
          orderBy: { id: "desc" },
          take: 100,
        }),
        prisma.whatsapp_logs.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: BigInt(0) }],
          },
          orderBy: { id: "desc" },
          take: 100,
        }),
        prisma.sms_logs.findMany({
          where: {
            OR: [{ organization_id: BigInt(orgId) }, { organization_id: BigInt(0) }],
          },
          orderBy: { id: "desc" },
          take: 100,
        }),
        prisma.leads.findMany({
          where: { organization_id: BigInt(orgId) },
          select: {
            id: true,
            name: true,
            mobile: true,
            lead_campaign_id: true,
          },
        }),
        prisma.campaigns.findMany({
          where: { organization_id: orgId },
          select: { id: true, name: true },
        }),
        prisma.whatsapp_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          select: { id: true, title: true },
        }),
        prisma.message_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          select: { id: true, title: true },
        }),
      ])

      const leadById = new Map(leads.map((l) => [Number(l.id), l]))
      const leadByMobile = new Map(
        leads.map((l) => [String(l.mobile || "").slice(-10), l])
      )
      const rawById = new Map(rawLeads.map((r) => [Number(r.id), r]))
      const rawByMobile = new Map(
        rawLeads.map((r) => [String(r.mobile || "").slice(-10), r])
      )
      const campMap = new Map(campaigns.map((c) => [Number(c.id), c.name]))
      const waTplMap = new Map(
        waTemplates.map((t) => [String(t.id), t.title || `Template #${t.id}`])
      )
      const smsTplMap = new Map(
        smsTemplates.map((t) => [String(t.id), t.title || `Template #${t.id}`])
      )

      const resolvePerson = (leadIdVal: unknown, mobileVal: unknown) => {
        const lid = Number(leadIdVal || 0)
        const last10 = String(mobileVal || "").replace(/\D/g, "").slice(-10)
        const l =
          (lid ? leadById.get(lid) : undefined) ||
          (last10 ? leadByMobile.get(last10) : undefined)
        const r =
          (lid ? rawById.get(lid) : undefined) ||
          (last10 ? rawByMobile.get(last10) : undefined)
        const campName = l?.lead_campaign_id
          ? campMap.get(Number(l.lead_campaign_id)) || "-"
          : r?.campaign || "-"
        return {
          lead_id: lid || (l ? Number(l.id) : null),
          lead_name: l?.name || r?.name || "-",
          mobile: String(mobileVal || l?.mobile || r?.mobile || "-"),
          campaign: campName,
        }
      }

      const ivrSource =
        ivrLogsRaw.length > 0
          ? ivrLogsRaw.map((row) => {
              const p = resolvePerson(row.lead_id, row.mobile)
              return {
                id: row.id,
                lead_id: p.lead_id,
                lead_name: p.lead_name,
                mobile: p.mobile,
                campaign: p.campaign,
                provider: row.provider || "ivr-gateway",
                call_status: row.status || "completed",
                ivr_response:
                  row.dtmf && row.response_json
                    ? `DTMF ${row.dtmf} - ${row.response_json}`
                    : row.response_json || row.dtmf || "-",
                created_at: row.created_at,
              }
            })
          : callLogs.map((cl) => {
              const p = resolvePerson(cl.lead_id, null)
              return {
                id: cl.id,
                lead_id: p.lead_id,
                lead_name: p.lead_name,
                mobile: p.mobile,
                campaign: p.campaign,
                provider: cl.direction
                  ? `cloud-telephony (${cl.direction})`
                  : "cloud-telephony",
                call_status: cl.duration ? `completed (${cl.duration}s)` : "completed",
                ivr_response:
                  cl.summary || cl.notes || (cl.duration ? `${cl.duration}s` : "-"),
                created_at: cl.created_at,
              }
            })

      const whatsappLogs = [
        ...whatsappLogsRaw.map((w) => {
          const p = resolvePerson(w.lead_id, w.mobile)
          const tplName = w.template_id
            ? waTplMap.get(String(w.template_id)) || String(w.template_id)
            : "Custom"
          return {
            id: w.id,
            lead_id: p.lead_id,
            lead_name: p.lead_name,
            mobile: p.mobile,
            template_name: tplName,
            message: w.message || "-",
            provider: w.provider || "whatsapp",
            status: w.status || "sent",
            created_at: w.sent_at || w.created_at,
          }
        }),
        ...comms
          .filter((c) => c.channel === "whatsapp")
          .map((c) => {
            const p = resolvePerson(c.lead_id, c.to)
            return {
              id: `c-${c.id}`,
              lead_id: p.lead_id,
              lead_name: p.lead_name,
              mobile: p.mobile,
              template_name: c.subject || "WhatsApp Message",
              message: c.content || "-",
              provider: "whatsapp",
              status: c.status || "sent",
              created_at: c.sent_at || c.created_at,
            }
          }),
      ]

      const smsLogs = [
        ...smsLogsRaw.map((s) => {
          const p = resolvePerson(s.lead_id, s.mobile)
          let tplName = "Transactional SMS"
          if (/otp|one-time password/i.test(s.message || "")) {
            tplName = "OTP Verification"
          } else if (/login details/i.test(s.message || "")) {
            tplName = "Login Credentials"
          } else if (smsTplMap.size > 0) {
            tplName = Array.from(smsTplMap.values())[0]
          }
          return {
            id: s.id,
            lead_id: p.lead_id,
            lead_name: p.lead_name,
            mobile: p.mobile,
            template_name: tplName,
            message: s.message || "-",
            provider: s.provider || "sms-gateway",
            status: s.status || "sent",
            created_at: s.sent_at || s.created_at,
          }
        }),
        ...comms
          .filter((c) => c.channel === "sms")
          .map((c) => {
            const p = resolvePerson(c.lead_id, c.to)
            return {
              id: `c-${c.id}`,
              lead_id: p.lead_id,
              lead_name: p.lead_name,
              mobile: p.mobile,
              template_name: c.subject || "SMS Broadcast",
              message: c.content || "-",
              provider: "sms-gateway",
              status: c.status || "sent",
              created_at: c.sent_at || c.created_at,
            }
          }),
      ]

      const ivrLogs = ivrSource
      const items =
        sub === "uploads"
          ? uploads
          : sub === "ivr"
            ? ivrLogs
            : sub === "whatsapp"
              ? whatsappLogs
              : sub === "sms"
                ? smsLogs
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

      const enrichedAppForms = appForms.map((af) => ({
        ...af,
        responses_count: submissions.filter(
          (s) => Number(s.lead_form_id) === Number(af.id)
        ).length,
      }))

      const items =
        sub === "landing_pages"
          ? landingPages
          : sub === "application_forms"
            ? enrichedAppForms
            : enrichedWebforms

      return NextResponse.json(
        serializeData({
          items,
          responses: enrichedSubmissions,
          webforms: enrichedWebforms,
          landingPages,
          appForms: enrichedAppForms,
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
      const [
        form,
        lead,
        leadApp,
        documents,
        countries,
        states,
        cities,
        institutes,
        programs,
        courses,
        users,
      ] = await Promise.all([
        prisma.application_forms.findUnique({
          where: { id: response.lead_form_id },
        }),
        response.lead_id
          ? prisma.leads.findUnique({ where: { id: BigInt(response.lead_id) } })
          : Promise.resolve(null),
        response.lead_id
          ? prisma.lead_applications.findFirst({
              where: { lead_id: BigInt(response.lead_id) },
              orderBy: { id: "desc" },
            })
          : Promise.resolve(null),
        response.lead_id
          ? prisma.lead_documents.findMany({
              where: { lead_id: BigInt(response.lead_id) },
              orderBy: { id: "desc" },
            })
          : Promise.resolve([]),
        prisma.countries.findMany({ select: { id: true, name: true } }),
        prisma.states.findMany({ select: { id: true, name: true } }),
        prisma.cities.findMany({ select: { id: true, name: true } }),
        prisma.institutes.findMany({ select: { id: true, name: true } }),
        prisma.programs.findMany({ select: { id: true, name: true } }),
        prisma.products.findMany({ select: { id: true, name: true } }),
        prisma.users.findMany({
          select: { id: true, first_name: true, last_name: true, email: true },
        }),
      ])
      const isPaid =
        response.payment_status === 1 || leadApp?.payment_status === "paid"
      const assignedCounsellor = response.assigned_to
        ? users.find((u) => Number(u.id) === Number(response.assigned_to))
        : lead?.lead_assign_to
          ? users.find((u) => Number(u.id) === Number(lead.lead_assign_to))
          : null

      const submission = {
        ...response,
        payment_status: isPaid ? "paid" : "unpaid",
        payment_method:
          response.payment_method || leadApp?.payment_method || null,
        application_score:
          leadApp?.application_score ?? response.fill_percentage ?? 0,
        form_title: form?.title || `Application Form #${response.lead_form_id}`,
        unique_code: form?.unique_code || "",
        lead_name: lead?.name || null,
        lead_mobile: lead?.mobile || null,
        lead_email: lead?.email || null,
      }
      return NextResponse.json(
        serializeData({
          submission,
          response: submission,
          form,
          lead,
          leadApp,
          documents,
          assignedCounsellor,
          lookups: {
            countries,
            states,
            cities,
            institutes,
            programs,
            courses,
          },
        })
      )
    }

    case "automation_cities": {
      const stateId = Number(req.nextUrl.searchParams.get("state_id") || 0)
      if (!stateId) {
        return NextResponse.json(serializeData({ items: [] }))
      }
      const cities = await prisma.cities.findMany({
        where: { state_id: stateId },
        orderBy: { name: "asc" },
        take: 400,
      })
      return NextResponse.json(serializeData({ items: cities }))
    }

    case "automation_rules": {
      const [
        rules,
        institutes,
        courses,
        statuses,
        subStatuses,
        sources,
        indiaStates,
        emailTemplates,
        whatsappTemplates,
        smsTemplates,
        teams,
        allUsers,
        registers,
      ] = await Promise.all([
        prisma.automation_rules.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.institutes.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { name: "asc" },
        }),
        prisma.products.findMany({
          where: { organization_id: orgId },
          orderBy: { name: "asc" },
        }),
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
        prisma.lead_sources.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { name: "asc" },
        }),
        prisma.states.findMany({
          where: { country_id: 101 },
          orderBy: { name: "asc" },
        }),
        prisma.email_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.whatsapp_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.message_templates.findMany({
          where: { organization_id: BigInt(orgId) },
          orderBy: { id: "desc" },
        }),
        prisma.teams.findMany({
          where: { organization_id: orgId },
          orderBy: { name: "asc" },
        }),
        prisma.users.findMany({
          select: { id: true, first_name: true, last_name: true, email: true },
          orderBy: { id: "asc" },
        }),
        prisma.registers.findMany({
          where: { organization: String(orgId) },
        }),
      ])

      const instIds = institutes.map((i) => i.id)
      const programs =
        instIds.length > 0
          ? await prisma.programs.findMany({
              where: { institute_id: { in: instIds } },
              orderBy: { name: "asc" },
            })
          : []

      const states =
        indiaStates.length > 0
          ? indiaStates
          : await prisma.states.findMany({
              orderBy: { name: "asc" },
              take: 100,
            })

      const orgUserIds = new Set(registers.map((r) => Number(r.user_id)))
      const users = (
        orgUserIds.size > 0
          ? allUsers.filter((u) => orgUserIds.has(Number(u.id)))
          : allUsers
      ).map((u) => ({
        ...u,
        name:
          `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
          u.email ||
          `User #${u.id}`,
      }))

      return NextResponse.json(
        serializeData({
          items: rules,
          institutes,
          programs,
          courses,
          statuses,
          subStatuses,
          sources,
          states,
          emailTemplates,
          whatsappTemplates,
          smsTemplates,
          teams,
          users,
        })
      )
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
      const qty = Number(body.quantity ?? 60)
      const c = await prisma.products.create({
        data: {
          sku: skuVal,
          name: String(body.name || "").trim(),
          description: body.description
            ? String(body.description).slice(0, 250)
            : null,
          quantity: qty,
          price: Number(body.price ?? 0),
          organization_id: orgId,
          program_id: body.program_id ? BigInt(body.program_id) : null,
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.product_inventories.create({
        data: {
          product_id: c.id,
          organization_id: orgId,
          in_stock: qty,
          allocated: 0,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: c }))
    }
    if (action === "update" && body.id) {
      const pid = Number(body.id)
      const qty =
        body.quantity !== undefined ? Number(body.quantity) : undefined
      await prisma.products.update({
        where: { id: pid },
        data: {
          sku: body.sku ? String(body.sku).trim() : undefined,
          name: String(body.name || "").trim(),
          description:
            body.description !== undefined
              ? body.description
                ? String(body.description).slice(0, 250)
                : null
              : undefined,
          quantity: qty,
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
      if (qty !== undefined) {
        const inv = await prisma.product_inventories.findFirst({
          where: { product_id: pid },
        })
        if (inv) {
          await prisma.product_inventories.update({
            where: { id: inv.id },
            data: { in_stock: qty },
          })
        } else {
          await prisma.product_inventories.create({
            data: {
              product_id: pid,
              organization_id: orgId,
              in_stock: qty,
              allocated: 0,
            },
          })
        }
      }
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
      const pid = Number(body.id)
      await prisma.product_inventories.deleteMany({
        where: { product_id: pid },
      })
      await prisma.products.delete({ where: { id: pid } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const ids = body.ids.map(Number)
      await prisma.product_inventories.deleteMany({
        where: { product_id: { in: ids } },
      })
      await prisma.products.deleteMany({
        where: { id: { in: ids } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // Pipelines + Stage Builder (Fixed New Lead + Sortable Middle Stages + Standalone Final Stage)
  if (resource === "pipelines") {
    const slugifyStage = (val: string, suffix?: string | number) => {
      const base =
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "") || "stage"
      return suffix !== undefined ? `${base}_${suffix}` : base
    }

    if (action === "create") {
      const pName = String(body.name || "").trim()
      if (!pName) {
        return NextResponse.json(
          { error: "Pipeline name is required." },
          { status: 400 }
        )
      }
      const dup = await prisma.pipelines.findFirst({
        where: { name: pName },
      })
      if (dup) {
        return NextResponse.json(
          { error: `A pipeline named "${pName}" already exists.` },
          { status: 400 }
        )
      }
      if (body.is_default) {
        await prisma.pipelines.updateMany({
          where: { organization_id: orgId },
          data: { is_default: false },
        })
      }
      const p = await prisma.pipelines.create({
        data: {
          name: pName,
          rotten_days: Number(body.rotten_days ?? 15),
          is_default: Boolean(body.is_default),
          organization_id: orgId,
          created_at: now,
          updated_at: now,
        },
      })

      // 1. Fixed First Stage ("New Lead", sort_order: 0, is_final: 0)
      await prisma.pipeline_stages.create({
        data: {
          lead_pipeline_id: p.id,
          name: "New Lead",
          code: "new_lead",
          probability: 10,
          sort_order: 0,
          is_final: 0,
          created_at: now,
          updated_at: now,
        },
      })

      // 2. Optional middle stages (sort_order: 1..N, is_final: 0)
      const middleStages = Array.isArray(body.middle_stages)
        ? body.middle_stages
        : Array.isArray(body.stages)
          ? body.stages.filter(
              (s: Record<string, unknown>) =>
                !s.is_final &&
                Number(s.sort_order ?? 1) !== 0 &&
                String(s.name || "").toLowerCase() !== "new lead"
            )
          : []
      const usedNames = new Set<string>(["new lead"])
      const finalLabel =
        String(body.final_stage || "Closed").trim() || "Closed"
      usedNames.add(finalLabel.toLowerCase())

      for (let idx = 0; idx < middleStages.length; idx++) {
        const s = middleStages[idx]
        let sName = String(s.name || `Stage ${idx + 1}`).trim()
        if (!sName) continue
        if (usedNames.has(sName.toLowerCase())) {
          sName = `${sName} (${idx + 1})`
        }
        usedNames.add(sName.toLowerCase())
        await prisma.pipeline_stages.create({
          data: {
            lead_pipeline_id: p.id,
            name: sName,
            code: slugifyStage(sName, idx + 1),
            probability: Number(
              s.probability ?? Math.min(90, (idx + 1) * 20)
            ),
            sort_order: idx + 1,
            is_final: 0,
            created_at: now,
            updated_at: now,
          },
        })
      }

      // 3. Standalone Final Stage ("Closed" or custom, sort_order: 9999, is_final: 1)
      await prisma.pipeline_stages.create({
        data: {
          lead_pipeline_id: p.id,
          name: finalLabel,
          code: slugifyStage(finalLabel, "final"),
          probability: 100,
          sort_order: 9999,
          is_final: 1,
          created_at: now,
          updated_at: now,
        },
      })

      return NextResponse.json(serializeData({ ok: true, item: p }))
    }

    if ((action === "update" || action === "builder_save") && body.id) {
      const pid = Number(body.id)
      const existingPipeline = await prisma.pipelines.findUnique({
        where: { id: pid },
      })
      if (!existingPipeline) {
        return NextResponse.json(
          { error: "Pipeline not found." },
          { status: 404 }
        )
      }

      if (body.name !== undefined || body.rotten_days !== undefined || body.is_default !== undefined) {
        const nextName =
          body.name !== undefined
            ? String(body.name).trim() || existingPipeline.name
            : existingPipeline.name
        if (nextName !== existingPipeline.name) {
          const dup = await prisma.pipelines.findFirst({
            where: { name: nextName, id: { not: pid } },
          })
          if (dup) {
            return NextResponse.json(
              { error: `A pipeline named "${nextName}" already exists.` },
              { status: 400 }
            )
          }
        }
        if (body.is_default) {
          await prisma.pipelines.updateMany({
            where: { organization_id: orgId },
            data: { is_default: false },
          })
        }
        await prisma.pipelines.update({
          where: { id: pid },
          data: {
            name: nextName,
            rotten_days:
              body.rotten_days !== undefined
                ? Number(body.rotten_days || 15)
                : existingPipeline.rotten_days,
            is_default:
              body.is_default !== undefined
                ? Boolean(body.is_default)
                : existingPipeline.is_default,
            updated_at: now,
          },
        })
      }

      // Stage Builder update preserving existing stage IDs
      if (
        Array.isArray(body.middle_stages) ||
        Array.isArray(body.stages) ||
        body.final_stage !== undefined
      ) {
        const currentStages = await prisma.pipeline_stages.findMany({
          where: { lead_pipeline_id: pid },
          orderBy: { sort_order: "asc" },
        })

        // 1. Ensure Fixed First Stage (sort_order: 0, is_final: 0)
        const firstStage = currentStages.find(
          (st) => st.is_final === 0 && st.sort_order === 0
        )
        if (!firstStage) {
          await prisma.pipeline_stages.create({
            data: {
              lead_pipeline_id: pid,
              name: "New Lead",
              code: `new_lead_${pid}`,
              probability: 10,
              sort_order: 0,
              is_final: 0,
              created_at: now,
              updated_at: now,
            },
          })
        } else if (firstStage.name !== "New Lead") {
          await prisma.pipeline_stages.update({
            where: { id: firstStage.id },
            data: { name: "New Lead", sort_order: 0, is_final: 0, updated_at: now },
          })
        }

        // 2. Standalone Final Stage (is_final: 1, sort_order: 9999)
        const existingFinal = currentStages.find((st) => st.is_final === 1)
        const rawFinalName =
          body.final_stage !== undefined
            ? String(body.final_stage).trim()
            : existingFinal?.name || "Closed"
        const finalName =
          rawFinalName.toLowerCase() === "new lead" || !rawFinalName
            ? "Closed"
            : rawFinalName

        if (existingFinal) {
          await prisma.pipeline_stages.update({
            where: { id: existingFinal.id },
            data: {
              name: `__tmp_final_${existingFinal.id}`,
              code: `__tmp_final_${existingFinal.id}`,
              sort_order: 9999,
              is_final: 1,
              updated_at: now,
            },
          })
        }

        // 3. Reconcile sortable middle stages (sort_order: 1..N, is_final: 0)
        const incomingMiddle: Record<string, unknown>[] = Array.isArray(
          body.middle_stages
        )
          ? body.middle_stages
          : Array.isArray(body.stages)
            ? body.stages.filter(
                (s: Record<string, unknown>) =>
                  !s.is_final && Number(s.sort_order ?? 1) !== 0
              )
            : currentStages
                .filter((st) => st.is_final === 0 && st.sort_order > 0)
                .map((st) => ({
                  id: st.id,
                  name: st.name,
                  probability: st.probability,
                }))

        const keptIds = incomingMiddle
          .map((s) => (s.id ? Number(s.id) : 0))
          .filter((n) => n > 0)

        const removableIds = currentStages
          .filter(
            (st) =>
              st.is_final === 0 &&
              st.sort_order > 0 &&
              !keptIds.includes(st.id)
          )
          .map((st) => st.id)

        if (removableIds.length > 0) {
          await prisma.pipeline_stages.deleteMany({
            where: { id: { in: removableIds } },
          })
        }

        // Temporarily rename kept stages so unique(name, lead_pipeline_id) never collides during swaps
        for (const kid of keptIds) {
          await prisma.pipeline_stages.updateMany({
            where: { id: kid, lead_pipeline_id: pid },
            data: {
              name: `__tmp_stage_${kid}`,
              code: `__tmp_stage_${kid}`,
            },
          })
        }

        const usedNames = new Set<string>([
          "new lead",
          finalName.toLowerCase(),
        ])

        for (let idx = 0; idx < incomingMiddle.length; idx++) {
          const item = incomingMiddle[idx]
          let stName = String(item.name || "").trim()
          if (!stName) continue
          if (usedNames.has(stName.toLowerCase())) {
            stName = `${stName} (${idx + 1})`
          }
          usedNames.add(stName.toLowerCase())
          const stProb = Number(item.probability ?? 0)
          const stId = item.id ? Number(item.id) : 0

          if (stId > 0) {
            await prisma.pipeline_stages.update({
              where: { id: stId },
              data: {
                name: stName,
                code: slugifyStage(stName, stId),
                probability: stProb,
                sort_order: idx + 1,
                is_final: 0,
                updated_at: now,
              },
            })
          } else {
            await prisma.pipeline_stages.create({
              data: {
                lead_pipeline_id: pid,
                name: stName,
                code: slugifyStage(
                  stName,
                  `${idx + 1}_${Date.now().toString().slice(-4)}`
                ),
                probability: stProb,
                sort_order: idx + 1,
                is_final: 0,
                created_at: now,
                updated_at: now,
              },
            })
          }
        }

        // Finalize Standalone Final Stage
        if (existingFinal) {
          await prisma.pipeline_stages.update({
            where: { id: existingFinal.id },
            data: {
              name: finalName,
              code: slugifyStage(finalName, `final_${existingFinal.id}`),
              probability: 100,
              sort_order: 9999,
              is_final: 1,
              updated_at: now,
            },
          })
        } else {
          await prisma.pipeline_stages.create({
            data: {
              lead_pipeline_id: pid,
              name: finalName,
              code: slugifyStage(finalName, "final"),
              probability: 100,
              sort_order: 9999,
              is_final: 1,
              created_at: now,
              updated_at: now,
            },
          })
        }
      }

      return NextResponse.json({ ok: true })
    }

    if (action === "add_stage" && body.lead_pipeline_id) {
      const sName = String(body.name || "New Stage").trim()
      const st = await prisma.pipeline_stages.create({
        data: {
          lead_pipeline_id: Number(body.lead_pipeline_id),
          name: sName,
          code: slugifyStage(sName, Date.now().toString().slice(-4)),
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

    if (
      (action === "delete" || action === "bulk_delete") &&
      Array.isArray(body.ids)
    ) {
      const pids = body.ids.map(Number).filter(Boolean)
      await prisma.pipeline_stages.deleteMany({
        where: { lead_pipeline_id: { in: pids } },
      })
      await prisma.pipelines.deleteMany({ where: { id: { in: pids } } })
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
    const parseSourceStatus = (val: unknown) =>
      val !== false &&
      val !== 0 &&
      val !== "0" &&
      String(val ?? "1").toLowerCase() !== "inactive"

    if (action === "create") {
      const s = await prisma.lead_sources.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || "").trim(),
          status: parseSourceStatus(body.status),
          lead_count: Number(body.lead_count || 0),
          billing_setup_amount: Number(body.billing_setup_amount || 0),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: s }))
    }
    if (action === "billing_update" && body.id) {
      await prisma.lead_sources.update({
        where: { id: BigInt(body.id) },
        data: {
          billing_setup_amount: Number(body.billing_setup_amount || 0),
          status: parseSourceStatus(body.status),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "update" && body.id) {
      await prisma.lead_sources.update({
        where: { id: BigInt(body.id) },
        data: {
          ...(body.name !== undefined
            ? { name: String(body.name || "").trim() }
            : {}),
          ...(body.status !== undefined
            ? { status: parseSourceStatus(body.status) }
            : {}),
          ...(body.billing_setup_amount !== undefined
            ? { billing_setup_amount: Number(body.billing_setup_amount || 0) }
            : {}),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (
      (action === "delete" || action === "bulk_delete") &&
      Array.isArray(body.ids)
    ) {
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
    const AUDIENCE_SEGMENTS = new Set([
      "all_leads",
      "new_leads",
      "counseling_pending",
      "application_started",
      "application_submitted",
      "closed_leads",
    ])
    const normalizedCampStatus =
      body.status === false ||
      body.status === 0 ||
      body.status === "0" ||
      String(body.status || "").toLowerCase() === "inactive"
        ? "0"
        : "1"
    if (action === "create") {
      const mailToVal = String(body.mail_to ?? "").trim()
      if (!mailToVal) {
        return NextResponse.json(
          { error: "Send To / Mail To recipient is required." },
          { status: 400 }
        )
      }
      const c = await prisma.campaigns.create({
        data: {
          name: String(body.name || "").trim(),
          subject: String(body.subject || "").trim(),
          status: normalizedCampStatus,
          type: String(body.type || "Email"),
          mail_to: mailToVal,
          spooling: String(body.spooling || "No"),
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
          type: String(body.type || "Email"),
          mail_to:
            body.mail_to !== undefined
              ? String(body.mail_to).trim()
              : undefined,
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
      const rawMailTo = String(camp?.mail_to || "").trim()
      const isAudience = AUDIENCE_SEGMENTS.has(rawMailTo.toLowerCase())

      let recipients = 1
      if (isAudience) {
        const leads = await prisma.leads.findMany({
          where: { organization_id: BigInt(orgId) },
          select: { id: true, email: true, mobile: true },
        })
        const cType = String(camp?.type || "Email").toLowerCase()
        recipients =
          cType === "sms" || cType === "whatsapp"
            ? leads.filter((l) => l.mobile).length || leads.length
            : leads.filter((l) => l.email).length || leads.length
      } else {
        const directList = rawMailTo
          .split(/[,;\n]+/)
          .map((x) => x.trim())
          .filter(Boolean)
        recipients = Math.max(1, directList.length)
      }

      if (camp?.marketing_template_id && recipients > 0) {
        const cType = String(camp.type || "Email").toLowerCase()
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
      return NextResponse.json({
        ok: true,
        recipients,
        mode: isAudience ? "audience" : "standalone",
        target: rawMailTo,
      })
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
      const samplePayload =
        wh?.payload_type === "default"
          ? {
              event: `${wh.entity_type || "leads"}.created`,
              entity_type: wh.entity_type || "leads",
              organization_id: orgId,
              dispatched_at: now.toISOString(),
              data: {
                id: 1001,
                name: "Aarav Sharma",
                email: "aarav.sharma@example.com",
                mobile: "9876543210",
                city: "Delhi",
                state: "Delhi",
                lead_source_id: 1,
                pipeline_id: 1,
                stage_id: 1,
                status: "New Lead",
              },
            }
          : wh?.payload
      return NextResponse.json({
        ok: true,
        message: `Test ${(wh?.method || "POST").toUpperCase()} (${wh?.payload_type || "default"}) dispatched to ${wh?.end_point}`,
        sample_payload: samplePayload,
      })
    }
    if (
      (action === "delete" || action === "bulk_delete") &&
      Array.isArray(body.ids)
    ) {
      await prisma.webhooks.deleteMany({
        where: { id: { in: body.ids.map((i: unknown) => BigInt(String(i))) } },
      })
      return NextResponse.json({ ok: true })
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
    const tplCategory =
      body.category !== undefined
        ? String(body.category || "").trim() || null
        : "General"
    const msgText = String(body.message ?? body.content ?? "")
    const subjText = String(body.subject ?? "")
    const detectedVars = Array.from(
      new Set(
        (`${subjText} ${msgText}`.match(/\{\{?[a-zA-Z0-9_]+\}?\}/g) || [])
      )
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
            category: tplCategory,
            subject: subjText,
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
            category: tplCategory,
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
          category: tplCategory,
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
            ...(body.category !== undefined ? { category: tplCategory } : {}),
            send_by: body.send_by ? String(body.send_by) : null,
            subject: subjText,
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
            ...(body.category !== undefined ? { category: tplCategory } : {}),
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
            ...(body.category !== undefined ? { category: tplCategory } : {}),
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
    const parseActive = (val: unknown) =>
      val === undefined
        ? true
        : val === true || val === 1 || val === "1" || val === "true"

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saveRuleItems = async (ruleId: bigint, distType: "random" | "source", payload: any) => {
      if (distType === "random") {
        const rawUsers = Array.isArray(payload.selected_users)
          ? payload.selected_users
          : Array.isArray(payload.assign_user_ids)
            ? payload.assign_user_ids
            : payload.user_id
              ? [payload.user_id]
              : []
        const userIds: number[] = Array.from(
          new Set<number>(rawUsers.map(Number).filter(Boolean))
        )
        for (const uid of userIds) {
          await prisma.lead_distribution_rule_items.create({
            data: {
              rule_id: ruleId,
              source_id: null,
              assign_type: "user",
              user_id: BigInt(uid),
              team_id: null,
              designation_id: null,
              percentage: null,
              created_at: now,
              updated_at: now,
            },
          })
        }
      } else {
        // source-based distribution items
        const rawItems = Array.isArray(payload.items) ? payload.items : []
        for (const row of rawItems) {
          const sourceId = Number(row?.source_id || 0)
          const assignType =
            row?.assign_type === "team"
              ? ("team" as const)
              : row?.assign_type === "designation"
                ? ("designation" as const)
                : ("user" as const)
          const assignId = Number(
            row?.assign_id ||
              row?.user_id ||
              row?.team_id ||
              row?.designation_id ||
              0
          )
          if (!sourceId || !assignId) continue

          const pctRaw = row?.percentage
          const pct =
            pctRaw !== undefined && pctRaw !== null && String(pctRaw).trim() !== ""
              ? Math.max(0, Math.min(100, Number(pctRaw)))
              : null

          await prisma.lead_distribution_rule_items.create({
            data: {
              rule_id: ruleId,
              source_id: BigInt(sourceId),
              assign_type: assignType,
              user_id: assignType === "user" ? BigInt(assignId) : null,
              team_id: assignType === "team" ? BigInt(assignId) : null,
              designation_id:
                assignType === "designation" ? BigInt(assignId) : null,
              percentage: pct,
              created_at: now,
              updated_at: now,
            },
          })
        }
      }
    }

    if (action === "create") {
      const distType: "random" | "source" =
        body.distribution_type === "source" ? "source" : "random"
      const r = await prisma.lead_distribution_rules.create({
        data: {
          organization_id: BigInt(orgId),
          rule_name: String(
            body.rule_name || body.name || "Distribution Rule"
          ).trim(),
          distribution_type: distType,
          is_active: parseActive(body.is_active),
          created_at: now,
          updated_at: now,
        },
      })
      await saveRuleItems(r.id, distType, body)
      return NextResponse.json(serializeData({ ok: true, item: r }))
    }

    if (action === "update" && body.id) {
      const ruleId = BigInt(body.id)
      const distType: "random" | "source" =
        body.distribution_type === "source" ? "source" : "random"
      const r = await prisma.lead_distribution_rules.update({
        where: { id: ruleId },
        data: {
          rule_name: String(
            body.rule_name || body.name || "Distribution Rule"
          ).trim(),
          distribution_type: distType,
          is_active: parseActive(body.is_active),
          updated_at: now,
        },
      })
      await prisma.lead_distribution_rule_items.deleteMany({
        where: { rule_id: ruleId },
      })
      await saveRuleItems(ruleId, distType, body)
      return NextResponse.json(serializeData({ ok: true, item: r }))
    }

    if (action === "toggle" && body.id) {
      const existing = await prisma.lead_distribution_rules.findUnique({
        where: { id: BigInt(body.id) },
      })
      if (existing) {
        await prisma.lead_distribution_rules.update({
          where: { id: existing.id },
          data: { is_active: !existing.is_active, updated_at: now },
        })
      }
      return NextResponse.json({ ok: true })
    }

    if (action === "simulate") {
      const simCount = Math.max(
        1,
        Math.min(1000, Number(body.count || body.lead_count || 100))
      )
      const selectedSourceId = Number(body.source_id || 0)

      const [activeRules, allItems, allUsers, registers, sources, teams, designations] =
        await Promise.all([
          prisma.lead_distribution_rules.findMany({
            where: { organization_id: BigInt(orgId), is_active: true },
            orderBy: { id: "desc" },
          }),
          prisma.lead_distribution_rule_items.findMany({
            orderBy: { id: "asc" },
          }),
          prisma.users.findMany({
            select: { id: true, first_name: true, last_name: true, email: true },
          }),
          prisma.registers.findMany({
            where: { organization: String(orgId) },
          }),
          prisma.lead_sources.findMany({
            where: { organization_id: BigInt(orgId) },
          }),
          prisma.teams.findMany({ where: { organization_id: orgId } }),
          prisma.designation.findMany({ where: { organization_id: orgId } }),
        ])

      const userMap = new Map(
        allUsers.map((u) => [
          Number(u.id),
          {
            id: Number(u.id),
            name:
              `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
              u.email ||
              `User #${u.id}`,
            email: u.email || "",
          },
        ])
      )
      const orgUserIds =
        registers.length > 0
          ? registers.map((r) => Number(r.user_id))
          : allUsers.map((u) => Number(u.id))
      const availRegs = registers.filter((r) => r.is_available_for_leads === 1)
      const fallbackPool =
        availRegs.length > 0
          ? availRegs.map((r) => Number(r.user_id))
          : orgUserIds

      const countsByUser = new Map<number, number>()
      const addCount = (uid: number, n = 1) => {
        countsByUser.set(uid, (countsByUser.get(uid) || 0) + n)
      }

      // Resolve assign_type -> candidate user_ids
      const resolveUsersForItem = (item: {
        assign_type: string | null
        user_id: bigint | null
        team_id: bigint | null
        designation_id: bigint | null
      }): number[] => {
        if (item.assign_type === "user" && item.user_id) {
          return [Number(item.user_id)]
        }
        if (item.assign_type === "team" && item.team_id) {
          const tid = String(item.team_id)
          const teamObj = teams.find((t) => String(t.id) === tid)
          const fromReg = registers
            .filter((r) => String(r.team || "") === tid)
            .map((r) => Number(r.user_id))
          if (fromReg.length > 0) return fromReg
          if (teamObj?.team_member) {
            try {
              const parsed = JSON.parse(teamObj.team_member)
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(Number).filter(Boolean)
              }
            } catch {
              const csv = teamObj.team_member
                .split(",")
                .map((s) => Number(s.trim()))
                .filter(Boolean)
              if (csv.length > 0) return csv
            }
          }
          if (teamObj?.head) return [Number(teamObj.head)]
          return fallbackPool
        }
        if (item.assign_type === "designation" && item.designation_id) {
          const did = String(item.designation_id)
          const desigObj = designations.find((d) => String(d.id) === did)
          const fromReg = registers
            .filter(
              (r) =>
                String(r.designation || "") === did ||
                (desigObj?.name &&
                  String(r.designation || "").toLowerCase() ===
                    desigObj.name.toLowerCase())
            )
            .map((r) => Number(r.user_id))
          if (fromReg.length > 0) return fromReg
          return fallbackPool
        }
        return fallbackPool
      }

      // 1) Check active Source-Based rule matching selectedSourceId
      const sourceRules = activeRules.filter(
        (r) => r.distribution_type === "source"
      )
      let matchedRuleName = ""
      let matchedRuleType = ""
      let note = ""

      let handled = false
      if (selectedSourceId) {
        for (const sr of sourceRules) {
          const matchingRows = allItems.filter(
            (i) =>
              i.rule_id === sr.id && Number(i.source_id || 0) === selectedSourceId
          )
          if (matchingRows.length > 0) {
            matchedRuleName = sr.rule_name
            matchedRuleType = `Source Based (${sr.rule_name})`
            const srcObj = sources.find((s) => Number(s.id) === selectedSourceId)

            const rawWeights = matchingRows.map((row) =>
              row.percentage !== null && row.percentage !== undefined && row.percentage > 0
                ? Number(row.percentage)
                : null
            )
            const explicitSum = rawWeights.reduce<number>(
              (acc, w) => acc + (w ?? 0),
              0
            )
            const unsetCount = rawWeights.filter((w) => w === null).length
            const defaultBlankWeight =
              unsetCount > 0
                ? Math.max(1, (100 - Math.min(100, explicitSum)) / unsetCount)
                : 0
            const weights = rawWeights.map((w) => w ?? defaultBlankWeight)
            const totalWeight =
              weights.reduce((acc, w) => acc + w, 0) || matchingRows.length

            let allocated = 0
            matchingRows.forEach((row, idx) => {
              const rowQuota =
                idx === matchingRows.length - 1
                  ? Math.max(0, simCount - allocated)
                  : Math.round((simCount * weights[idx]) / totalWeight)
              allocated += rowQuota
              const candidateUsers = resolveUsersForItem(row)
              if (candidateUsers.length > 0 && rowQuota > 0) {
                for (let k = 0; k < rowQuota; k++) {
                  const uid = candidateUsers[k % candidateUsers.length]
                  addCount(uid, 1)
                }
              }
            })

            note = `Matched ${matchingRows.length} source mapping(s) for "${srcObj?.name || `Source #${selectedSourceId}`}" using proportional percentage weights.`
            handled = true
            break
          }
        }
      }

      // 2) Fallback to active Random (User-wise) rule
      if (!handled) {
        const randomRule = activeRules.find(
          (r) => r.distribution_type === "random"
        )
        if (randomRule) {
          const rRows = allItems.filter((i) => i.rule_id === randomRule.id)
          const pool =
            rRows.length > 0
              ? rRows.map((i) => Number(i.user_id)).filter(Boolean)
              : fallbackPool
          matchedRuleName = randomRule.rule_name
          matchedRuleType = `Random / User-wise (${randomRule.rule_name})`
          note = selectedSourceId
            ? `No source-specific mapping matched; fell back to active Random rule "${randomRule.rule_name}" across ${pool.length} user(s).`
            : `Distributed across ${pool.length} user(s) configured in Random rule "${randomRule.rule_name}".`
          if (pool.length > 0) {
            for (let k = 0; k < simCount; k++) {
              addCount(pool[k % pool.length], 1)
            }
            handled = true
          }
        }
      }

      // 3) Fallback to available org counsellors
      if (!handled) {
        matchedRuleName = "Default Available Counsellor Pool"
        matchedRuleType = "Default Round-Robin Pool"
        note = `No active rule matched; distributed equally across ${fallbackPool.length} active organization user(s).`
        if (fallbackPool.length > 0) {
          for (let k = 0; k < simCount; k++) {
            addCount(fallbackPool[k % fallbackPool.length], 1)
          }
        }
      }

      const breakdown = Array.from(countsByUser.entries())
        .map(([uid, cnt]) => {
          const u = userMap.get(uid)
          return {
            user_id: uid,
            name: u?.name || `User #${uid}`,
            email: u?.email || "",
            count: cnt,
            percentage: Number(((cnt / simCount) * 100).toFixed(1)),
          }
        })
        .sort((a, b) => b.count - a.count)

      const topWinner = breakdown[0]
      return NextResponse.json({
        ok: true,
        matchedRule: matchedRuleName,
        ruleType: matchedRuleType,
        note,
        totalLeads: simCount,
        breakdown,
        assignedUserId: topWinner?.user_id || ctx.userId,
        simulation: topWinner
          ? `Simulated ${simCount} lead(s) via ${matchedRuleType}: ${breakdown
              .map((b) => `${b.name} → ${b.count} (${b.percentage}%)`)
              .join(", ")}.`
          : "No active counsellors available.",
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

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const bigIds = body.ids.map((id: string | number) => BigInt(id))
      await prisma.lead_distribution_rule_items.deleteMany({
        where: { rule_id: { in: bigIds } },
      })
      await prisma.lead_distribution_rules.deleteMany({
        where: { id: { in: bigIds } },
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

    if (action === "bulk_delete_raw" && Array.isArray(body.ids)) {
      await prisma.automation_raw_leads.deleteMany({
        where: {
          id: { in: body.ids.map((id: string | number) => BigInt(id)) },
        },
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
  if (
    resource === "application_submission" &&
    action === "bulk_delete" &&
    Array.isArray(body.ids)
  ) {
    await prisma.application_form_responses.deleteMany({
      where: { id: { in: body.ids.map((id: string | number) => BigInt(id)) } },
    })
    return NextResponse.json({ ok: true })
  }

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

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const numIds = body.ids.map((id: string | number) => Number(id))
      await prisma.web_form_attributes.deleteMany({
        where: { web_form_id: { in: numIds } },
      })
      await prisma.web_forms.deleteMany({
        where: { id: { in: numIds } },
      })
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

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.application_forms.deleteMany({
        where: {
          id: { in: body.ids.map((id: string | number) => BigInt(id)) },
        },
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

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const bigIds = body.ids.map((id: string | number) => BigInt(id))
      await prisma.landing_page_sections.deleteMany({
        where: { page_id: { in: bigIds } },
      })
      await prisma.landing_pages.deleteMany({
        where: { id: { in: bigIds } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  if (resource === "automation_rules") {
    const serializeActions = () => {
      if (typeof body.actions === "string") return body.actions
      if (body.action_type) {
        return JSON.stringify({
          type: String(body.action_type),
          data: body.action_data || body.actions || {},
          extra_actions: Array.isArray(body.extra_actions)
            ? body.extra_actions
            : undefined,
        })
      }
      return JSON.stringify(body.actions || [])
    }

    if (action === "create") {
      const ar = await prisma.automation_rules.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || "").trim(),
          trigger_event: String(body.trigger_event || "lead.created"),
          conditions:
            typeof body.conditions === "string"
              ? body.conditions
              : JSON.stringify(body.conditions || []),
          actions: serializeActions(),
          is_active:
            body.is_active === undefined
              ? true
              : body.is_active === true ||
                body.is_active === 1 ||
                body.is_active === "1",
          created_by: BigInt(ctx.userId),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: ar }))
    }
    if (action === "update" && body.id) {
      await prisma.automation_rules.update({
        where: { id: BigInt(body.id) },
        data: {
          name: String(body.name || "").trim(),
          trigger_event: String(body.trigger_event || "lead.created"),
          conditions:
            typeof body.conditions === "string"
              ? body.conditions
              : JSON.stringify(body.conditions || []),
          actions: serializeActions(),
          is_active:
            body.is_active === undefined
              ? true
              : body.is_active === true ||
                body.is_active === 1 ||
                body.is_active === "1",
          updated_at: now,
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
        data: { is_active: !r?.is_active, updated_at: now },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.automation_rules.delete({ where: { id: BigInt(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const bigIds = body.ids.map((id: string | number) => BigInt(id))
      await prisma.automation_rules.deleteMany({
        where: { id: { in: bigIds } },
      })
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
