import { prisma } from "@/lib/prisma"
import { serializeData } from "@/lib/serialize"
import { requireSessionContext } from "@/lib/session"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { LeadsManagerClient } from "@/components/crm/leads-manager-client"

export default async function LeadsIndexPage() {
  const ctx = await requireSessionContext()

  const [
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
    applicationForms,
    emailTemplates,
    smsTemplates,
    whatsappTemplates,
    users,
  ] = await Promise.all([
    prisma.states.findMany({ orderBy: { name: "asc" } }),
    prisma.cities.findMany({ orderBy: { name: "asc" } }),
    prisma.institutes.findMany({
      where: { organization_id: BigInt(ctx.orgId), status: 1 },
      orderBy: { name: "asc" },
    }),
    prisma.programs.findMany({
      where: { status: 1 },
      orderBy: { name: "asc" },
    }),
    prisma.products.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { name: "asc" },
    }),
    prisma.lead_sources.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.lead_types.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { name: "asc" },
    }),
    prisma.campaigns.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { name: "asc" },
    }),
    prisma.marketing_events.findMany({
      where: { organization_id: ctx.orgId },
      orderBy: { name: "asc" },
    }),
    prisma.lead_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
        is_active: true,
      },
      orderBy: { sort_order: "asc" },
    }),
    prisma.lead_sub_statuses.findMany({
      where: {
        OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
        is_active: true,
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
    prisma.email_templates.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { id: "desc" },
    }),
    prisma.message_templates.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { id: "desc" },
    }),
    prisma.whatsapp_templates.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
      orderBy: { id: "desc" },
    }),
    prisma.users.findMany({
      select: { id: true, first_name: true, last_name: true, email: true },
      orderBy: { first_name: "asc" },
    }),
  ])

  const initialMaster = serializeData({
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
    applicationForms,
    emailTemplates,
    smsTemplates,
    whatsappTemplates,
    users,
  })

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Leads" />
      <LeadsManagerClient
        initialMaster={initialMaster}
        roleSlug={ctx.roleSlug}
        userEmail={ctx.email}
        userName={ctx.fullName}
      />
    </div>
  )
}
