import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  const orgId = ctx?.orgId ?? 1
  const url = req.nextUrl
  const type = url.searchParams.get("type") || "all"

  if (type === "states") {
    const countryId = url.searchParams.get("country_id")
    const states = await prisma.states.findMany({
      where: countryId ? { country_id: Number(countryId) } : undefined,
      orderBy: { name: "asc" },
    })
    return NextResponse.json(serializeData(states))
  }

  if (type === "cities") {
    const stateId = url.searchParams.get("state_id")
    const cities = await prisma.cities.findMany({
      where: stateId ? { state_id: Number(stateId) } : undefined,
      orderBy: { name: "asc" },
    })
    return NextResponse.json(serializeData(cities))
  }

  if (type === "programs") {
    const instId = url.searchParams.get("institute_id")
    const programs = await prisma.programs.findMany({
      where: instId ? { institute_id: BigInt(instId), status: 1 } : { status: 1 },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(serializeData(programs))
  }

  if (type === "courses") {
    const progId = url.searchParams.get("program_id") || url.searchParams.get("programme_ids")
    const courses = await prisma.products.findMany({
      where: progId
        ? { program_id: BigInt(progId), status: 1 }
        : { organization_id: orgId, status: 1 },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(serializeData(courses))
  }

  if (type === "substatuses") {
    const statusId = url.searchParams.get("lead_status_id")
    const subs = await prisma.lead_sub_statuses.findMany({
      where: statusId
        ? { lead_status_id: BigInt(statusId), is_active: true }
        : { organization_id: BigInt(orgId), is_active: true },
      orderBy: { sort_order: "asc" },
    })
    return NextResponse.json(serializeData(subs))
  }

  const [
    countries,
    states,
    cities,
    institutes,
    programs,
    courses,
    sources,
    leadTypes,
    campaigns,
    events,
    statuses,
    subStatuses,
    pipelines,
    stages,
    applicationForms,
    emailTemplates,
    smsTemplates,
    whatsappTemplates,
    users,
  ] = await Promise.all([
    prisma.countries.findMany({ orderBy: { name: "asc" } }),
    prisma.states.findMany({ orderBy: { name: "asc" } }),
    prisma.cities.findMany({ orderBy: { name: "asc" } }),
    prisma.institutes.findMany({
      where: { organization_id: BigInt(orgId), status: 1 },
      orderBy: { name: "asc" },
    }),
    prisma.programs.findMany({ where: { status: 1 }, orderBy: { name: "asc" } }),
    prisma.products.findMany({
      where: { organization_id: orgId, status: 1 },
      orderBy: { name: "asc" },
    }),
    prisma.lead_sources.findMany({
      where: { organization_id: BigInt(orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.lead_types.findMany({
      where: { organization_id: BigInt(orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.campaigns.findMany({
      where: { organization_id: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.marketing_events.findMany({
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
    prisma.pipelines.findMany({
      where: { organization_id: orgId },
      orderBy: { id: "asc" },
    }),
    prisma.pipeline_stages.findMany({
      orderBy: { sort_order: "asc" },
    }),
    prisma.application_forms.findMany({
      where: { organization_id: orgId },
      orderBy: { id: "asc" },
    }),
    prisma.email_templates.findMany({
      where: { organization_id: BigInt(orgId), status: "active" },
      orderBy: { id: "desc" },
    }),
    prisma.message_templates.findMany({
      where: { organization_id: BigInt(orgId), status: "active" },
      orderBy: { id: "desc" },
    }),
    prisma.whatsapp_templates.findMany({
      where: { organization_id: BigInt(orgId), status: "active" },
      orderBy: { id: "desc" },
    }),
    prisma.users.findMany({
      where: { status: 1 },
      select: { id: true, first_name: true, last_name: true, email: true },
      orderBy: { first_name: "asc" },
    }),
  ])

  return NextResponse.json(
    serializeData({
      countries,
      states,
      cities,
      institutes,
      programs,
      courses,
      sources,
      leadTypes,
      campaigns,
      events,
      statuses,
      subStatuses,
      pipelines,
      stages,
      applicationForms,
      emailTemplates,
      smsTemplates,
      whatsappTemplates,
      users,
    })
  )
}
