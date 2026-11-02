import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const search = (sp.get("search") || "").trim()
  const name = (sp.get("name") || "").trim()
  const mobile = (sp.get("mobile") || "").trim()
  const email = (sp.get("email") || "").trim()
  const country = sp.get("country") || ""
  const state = sp.get("state") || ""
  const city = sp.get("city") || ""
  const instituteId = sp.get("institute_id") || (ctx.currentInstituteId ? String(ctx.currentInstituteId) : "")
  const programmeId = sp.get("programme_id") || ""
  const courseId = sp.get("faculty_id") || sp.get("programmes") || ""
  const sourceId = sp.get("lead_source_id") || ""
  const statusId = sp.get("lead_status_id") || ""
  const subStatusId = sp.get("lead_sub_status_id") || ""
  const pipelineId = sp.get("pipeline_id") || ""
  const stageId = sp.get("stage_id") || ""
  const assignTo = sp.get("lead_assign_to") || ""
  const unassigned = sp.get("unassigned") || ""
  const dateFrom = sp.get("date_from") || ""
  const dateTo = sp.get("date_to") || ""
  const idsParam = sp.get("ids") || ""
  const exportCsv = sp.get("export") === "csv"

  const andFilters: Record<string, unknown>[] = [
    { organization_id: BigInt(ctx.orgId) },
  ]

  // Role-based visibility (matches df-laravel-crm)
  if (!["root", "sadmin", "admin"].includes(ctx.roleSlug)) {
    if (ctx.roleSlug === "manager") {
      const team = await prisma.teams.findFirst({
        where: { head: ctx.userId, status: 1 },
      })
      const members = (team?.team_member || "")
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((n) => n > 0)
      const teamIds = Array.from(new Set([ctx.userId, ...members])).map((n) =>
        BigInt(n)
      )
      andFilters.push({ lead_assign_to: { in: teamIds } })
    } else {
      andFilters.push({ lead_assign_to: BigInt(ctx.userId) })
    }
  }

  if (idsParam) {
    const idList = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => BigInt(s))
    if (idList.length > 0) {
      andFilters.push({ id: { in: idList } })
    }
  }

  if (search) {
    andFilters.push({
      OR: [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
      ],
    })
  }
  if (name) andFilters.push({ name: { contains: name } })
  if (mobile) andFilters.push({ mobile: { contains: mobile } })
  if (email) andFilters.push({ email: { contains: email } })
  if (country) andFilters.push({ country })
  if (state) andFilters.push({ state })
  if (city) andFilters.push({ city })
  if (instituteId) andFilters.push({ institute_id: BigInt(instituteId) })
  if (programmeId) andFilters.push({ programme_id: BigInt(programmeId) })
  if (courseId) andFilters.push({ faculty_id: BigInt(courseId) })
  if (sourceId) andFilters.push({ lead_source_id: BigInt(sourceId) })
  if (statusId) andFilters.push({ lead_status_id: BigInt(statusId) })
  if (subStatusId) andFilters.push({ lead_sub_status_id: BigInt(subStatusId) })
  if (pipelineId) andFilters.push({ pipeline_id: BigInt(pipelineId) })
  if (stageId) andFilters.push({ stage_id: BigInt(stageId) })
  if (unassigned === "1") {
    andFilters.push({ OR: [{ lead_assign_to: BigInt(0) }, { lead_assign_to: null }] })
  } else if (assignTo) {
    andFilters.push({ lead_assign_to: BigInt(assignTo) })
  }
  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {}
    if (dateFrom) range.gte = new Date(`${dateFrom}T00:00:00`)
    if (dateTo) range.lte = new Date(`${dateTo}T23:59:59`)
    andFilters.push({ created_at: range })
  }

  const leads = await prisma.leads.findMany({
    where: { AND: andFilters },
    orderBy: { id: "desc" },
    take: 500,
  })

  // Lookup maps
  const [
    institutes,
    programs,
    courses,
    sources,
    types,
    campaigns,
    statuses,
    subStatuses,
    pipelines,
    stages,
    users,
    states,
    cities,
    orgs,
    allOrgMobiles,
  ] = await Promise.all([
    prisma.institutes.findMany({ where: { organization_id: BigInt(ctx.orgId) } }),
    prisma.programs.findMany(),
    prisma.products.findMany({ where: { organization_id: ctx.orgId } }),
    prisma.lead_sources.findMany({ where: { organization_id: BigInt(ctx.orgId) } }),
    prisma.lead_types.findMany({ where: { organization_id: BigInt(ctx.orgId) } }),
    prisma.campaigns.findMany({ where: { organization_id: ctx.orgId } }),
    prisma.lead_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
      },
    }),
    prisma.lead_sub_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
      },
    }),
    prisma.pipelines.findMany({ where: { organization_id: ctx.orgId } }),
    prisma.pipeline_stages.findMany(),
    prisma.users.findMany({ select: { id: true, first_name: true, last_name: true } }),
    prisma.states.findMany(),
    prisma.cities.findMany(),
    prisma.organizations.findMany({ select: { id: true, name: true } }),
    prisma.leads.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      select: { id: true, name: true, email: true, mobile: true, lead_campaign_id: true, stage_id: true, created_at: true },
      orderBy: { id: "desc" },
    }),
  ])

  const instMap = new Map(institutes.map((i) => [Number(i.id), i.name]))
  const progMap = new Map(programs.map((p) => [Number(p.id), p.name]))
  const courseMap = new Map(courses.map((c) => [c.id, c.name || ""]))
  const srcMap = new Map(sources.map((s) => [Number(s.id), s.name]))
  const typeMap = new Map(types.map((t) => [Number(t.id), t.name]))
  const campMap = new Map(campaigns.map((c) => [c.id, c.name]))
  const statusMap = new Map(statuses.map((s) => [Number(s.id), { name: s.name, color: s.color || "#405189" }]))
  const subStatusMap = new Map(subStatuses.map((s) => [Number(s.id), s.name]))
  const pipeMap = new Map(pipelines.map((p) => [p.id, p.name]))
  const stageMap = new Map(stages.map((s) => [s.id, s.name || ""]))
  const userMap = new Map(
    users.map((u) => [u.id, `${u.first_name || ""} ${u.last_name || ""}`.trim()])
  )
  const stateMap = new Map(states.map((s) => [String(s.id), s.name || ""]))
  const cityMap = new Map(cities.map((c) => [String(c.id), c.name]))
  const orgMap = new Map(orgs.map((o) => [o.id, o.name || ""]))

  const mobileGroup = new Map<string, typeof allOrgMobiles>()
  for (const row of allOrgMobiles) {
    const arr = mobileGroup.get(row.mobile) || []
    arr.push(row)
    mobileGroup.set(row.mobile, arr)
  }

  const enriched = leads.map((l) => {
    const dupsRaw = (mobileGroup.get(l.mobile) || []).filter((d) => d.id !== l.id)
    const dupCount = dupsRaw.length
    const dupBadge = dupCount === 0 ? "P" : dupCount === 1 ? "S" : "T"
    const stInfo = l.lead_status_id ? statusMap.get(Number(l.lead_status_id)) : undefined

    return {
      ...l,
      city_name: l.city ? cityMap.get(l.city) || l.city : "-",
      state_name: l.state ? stateMap.get(l.state) || l.state : "-",
      country_name: l.country === "1" || l.country === "India" ? "India" : l.country || "India",
      organization_name: orgMap.get(Number(l.organization_id)) || "-",
      institute_name: l.institute_id ? instMap.get(Number(l.institute_id)) || "-" : "-",
      programme_name: l.programme_id ? progMap.get(Number(l.programme_id)) || "-" : "-",
      faculty_name: l.faculty_id ? courseMap.get(Number(l.faculty_id)) || "-" : "-",
      lead_source_name: l.lead_source_id ? srcMap.get(Number(l.lead_source_id)) || "-" : "-",
      lead_campaign_name: l.lead_campaign_id ? campMap.get(Number(l.lead_campaign_id)) || "-" : "-",
      lead_type_name: l.type_id ? typeMap.get(Number(l.type_id)) || "-" : "-",
      lead_status_name: stInfo?.name || "-",
      lead_status_color: stInfo?.color || "#405189",
      lead_sub_status_name: l.lead_sub_status_id ? subStatusMap.get(Number(l.lead_sub_status_id)) || "-" : "-",
      pipeline_name: l.pipeline_id ? pipeMap.get(Number(l.pipeline_id)) || "-" : "-",
      stage_name: l.stage_id ? stageMap.get(Number(l.stage_id)) || "-" : "-",
      assigned_user_name:
        l.lead_assign_to && Number(l.lead_assign_to) > 0
          ? userMap.get(Number(l.lead_assign_to)) || `User #${l.lead_assign_to}`
          : "Unassigned",
      created_by_name:
        l.created_by && Number(l.created_by) > 0
          ? userMap.get(Number(l.created_by)) || `User #${l.created_by}`
          : "System",
      duplicate_count: dupCount,
      duplicate_badge: dupBadge,
      duplicates: dupsRaw.map((d) => ({
        id: Number(d.id),
        name: d.name || "-",
        email: d.email || "-",
        campaign_name: d.lead_campaign_id ? campMap.get(Number(d.lead_campaign_id)) || "-" : "-",
        stage_name: d.stage_id ? stageMap.get(Number(d.stage_id)) || "-" : "-",
        created_at: d.created_at ? d.created_at.toISOString() : null,
      })),
    }
  })

  // Enforce Role × Field permissions from lead_settings
  const rolePerms = await prisma.lead_settings.findMany({
    where: { organization_id: ctx.orgId, role_slug: ctx.roleSlug },
  })
  const mobPerm = rolePerms.find((p) => p.field === "mobile")
  const emlPerm = rolePerms.find((p) => p.field === "email")
  const isSuper = ["root", "sadmin"].includes(ctx.roleSlug)
  const canViewMobile = isSuper || (mobPerm ? Boolean(mobPerm.can_view) : true)
  const canViewEmail = isSuper || (emlPerm ? Boolean(emlPerm.can_view) : true)
  const canDownload =
    isSuper || (mobPerm ? Boolean(mobPerm.can_download) : ctx.roleSlug !== "operater")

  const maskedItems = enriched.map((r) => ({
    ...r,
    mobile:
      canViewMobile || !r.mobile
        ? r.mobile
        : `${r.mobile.slice(0, 2)}******${r.mobile.slice(-2)}`,
    email:
      canViewEmail || !r.email
        ? r.email
        : r.email.replace(/^(..).*(@.*)$/, "$1***$2"),
  }))

  if (exportCsv) {
    if (!canDownload) {
      return NextResponse.json(
        { error: "CSV export disabled for your role in Lead Settings" },
        { status: 403 }
      )
    }
    const headers = [
      "ID",
      "Name",
      "Mobile",
      "Email",
      "City",
      "State",
      "Institute",
      "Program",
      "Course",
      "Source",
      "Status",
      "Sub Status",
      "Pipeline",
      "Stage",
      "Score",
      "Assigned To",
      "Created At",
    ]
    const csvRows = [headers.join(",")]
    for (const r of maskedItems) {
      const vals = [
        String(r.id),
        r.name || "",
        r.mobile || "",
        r.email || "",
        r.city_name,
        r.state_name,
        r.institute_name,
        r.programme_name,
        r.faculty_name,
        r.lead_source_name,
        r.lead_status_name,
        r.lead_sub_status_name,
        r.pipeline_name,
        r.stage_name,
        String(r.lead_score || 0),
        r.assigned_user_name,
        r.created_at ? r.created_at.toISOString() : "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`)
      csvRows.push(vals.join(","))
    }
    return new NextResponse(csvRows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads_export_${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json(
    serializeData({
      items: maskedItems,
      total: maskedItems.length,
      fieldPermissions: { canViewMobile, canViewEmail, canDownload },
    })
  )
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const now = new Date()

  const defaultPipe = await prisma.pipelines.findFirst({
    where: { organization_id: ctx.orgId },
    orderBy: [{ is_default: "desc" }, { id: "asc" }],
  })
  const firstStage = defaultPipe
    ? await prisma.pipeline_stages.findFirst({
        where: { lead_pipeline_id: defaultPipe.id },
        orderBy: { sort_order: "asc" },
      })
    : null
  const firstStatus = await prisma.lead_statuses.findFirst({
    where: {
      OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
    },
    orderBy: { sort_order: "asc" },
  })
  const firstSubStatus = firstStatus
    ? await prisma.lead_sub_statuses.findFirst({
        where: { lead_status_id: firstStatus.id },
        orderBy: { sort_order: "asc" },
      })
    : null

  const ownerId =
    body.lead_assign_to !== undefined && body.lead_assign_to !== ""
      ? Number(body.lead_assign_to)
      : ctx.userId

  const lead = await prisma.leads.create({
    data: {
      name: String(body.name || "").trim() || "Unnamed Lead",
      mobile: String(body.mobile || "").trim(),
      alternate_mobile: body.alternate_mobile ? String(body.alternate_mobile).trim() : null,
      email: body.email ? String(body.email).trim() : null,
      state: body.state ? String(body.state) : null,
      city: body.city ? String(body.city) : null,
      country: body.country ? String(body.country) : "1",
      organization_id: BigInt(ctx.orgId),
      institute_id: body.institute_id ? BigInt(body.institute_id) : ctx.currentInstituteId ? BigInt(ctx.currentInstituteId) : null,
      programme_id: body.programme_id ? BigInt(body.programme_id) : null,
      faculty_id: body.faculty_id ? BigInt(body.faculty_id) : null,
      application_form_id: body.application_form_id ? Number(body.application_form_id) : null,
      lead_source_id: body.source || body.lead_source_id ? BigInt(body.source || body.lead_source_id) : null,
      type_id: body.medium || body.type_id ? BigInt(body.medium || body.type_id) : null,
      lead_campaign_id: body.campaign || body.lead_campaign_id ? BigInt(body.campaign || body.lead_campaign_id) : null,
      lead_marketing_event: body.lead_marketing_event ? Number(body.lead_marketing_event) : null,
      pipeline_id: body.pipeline_id
        ? BigInt(body.pipeline_id)
        : defaultPipe
          ? BigInt(defaultPipe.id)
          : null,
      stage_id: body.stage_id
        ? BigInt(body.stage_id)
        : firstStage
          ? BigInt(firstStage.id)
          : null,
      lead_status_id: body.lead_status_id
        ? BigInt(body.lead_status_id)
        : firstStatus?.id ?? null,
      lead_sub_status_id: body.lead_sub_status_id
        ? BigInt(body.lead_sub_status_id)
        : firstSubStatus?.id ?? null,
      lead_score: Number(body.lead_score ?? 50),
      lead_weight_count: Number(body.lead_weight_count ?? 5),
      lead_assign_to: BigInt(ownerId),
      created_by: BigInt(ctx.userId),
      lead_registration_date: now,
      extra_fields_json: body.extra_fields
        ? JSON.stringify(body.extra_fields)
        : JSON.stringify({ upload_via: body.upload_via || "email" }),
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.lead_activity_logs.create({
    data: {
      organization_id: BigInt(ctx.orgId),
      lead_id: lead.id,
      user_id: BigInt(ctx.userId),
      action: "lead_created",
      description: `Lead ${lead.name} created via ${body.upload_via === "whatsapp" ? "Quick Add (WhatsApp)" : "CRM Form"}`,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.notifications.create({
    data: {
      organization_id: BigInt(ctx.orgId),
      user_id: BigInt(ownerId || ctx.userId),
      type: "alert",
      title: `New Lead Added: ${lead.name}`,
      body: `Mobile: ${lead.mobile}${lead.email ? ` | Email: ${lead.email}` : ""}`,
      url: `/leads/${lead.id}`,
      is_read: 0,
      created_at: now,
      updated_at: now,
    },
  })

  return NextResponse.json(serializeData({ ok: true, lead }))
}
