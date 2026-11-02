import { prisma } from "@/lib/prisma"
import { serializeData } from "@/lib/serialize"
import { requireSessionContext } from "@/lib/session"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { LeadDetailClient } from "@/components/crm/lead-detail-client"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireSessionContext()

  const [
    states,
    cities,
    institutes,
    programs,
    courses,
    sources,
    statuses,
    subStatuses,
    pipelines,
    applicationForms,
    users,
  ] = await Promise.all([
    prisma.states.findMany({ orderBy: { name: "asc" } }),
    prisma.cities.findMany({ orderBy: { name: "asc" } }),
    prisma.institutes.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.programs.findMany({ orderBy: { name: "asc" } }),
    prisma.products.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { name: "asc" },
    }),
    prisma.lead_sources.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.lead_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
      },
      orderBy: { sort_order: "asc" },
    }),
    prisma.lead_sub_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
      },
      orderBy: { sort_order: "asc" },
    }),
    prisma.pipelines.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { id: "asc" },
    }),
    prisma.application_forms.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { id: "desc" },
    }),
    prisma.users.findMany({
      select: { id: true, first_name: true, last_name: true, email: true },
    }),
  ])

  const master = serializeData({
    states,
    cities,
    institutes,
    programs,
    courses,
    sources,
    statuses,
    subStatuses,
    pipelines,
    applicationForms,
    users,
  })

  return (
    <div>
      <BreadcrumbBar parent="Leads" title={`Lead #${id}`} />
      <LeadDetailClient leadId={id} master={master} />
    </div>
  )
}
