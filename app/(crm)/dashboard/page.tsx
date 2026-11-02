import { prisma } from "@/lib/prisma"
import { requireSessionContext } from "@/lib/session"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import {
  DashboardCharts,
  DashboardRecentLeadsTable,
} from "@/components/crm/dashboard-charts"
import { Card } from "@/components/ui/card"

export default async function DashboardPage() {
  const ctx = await requireSessionContext()

  const leadFilter: Record<string, unknown> = {
    organization_id: BigInt(ctx.orgId),
  }
  if (ctx.currentInstituteId) {
    leadFilter.institute_id = BigInt(ctx.currentInstituteId)
  }

  if (!["root", "sadmin", "admin"].includes(ctx.roleSlug)) {
    if (ctx.roleSlug === "manager") {
      const team = await prisma.teams.findFirst({
        where: { head: ctx.userId, status: 1 },
      })
      const members = (team?.team_member || "")
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((n) => n > 0)
      leadFilter.lead_assign_to = {
        in: Array.from(new Set([ctx.userId, ...members])).map((n) => BigInt(n)),
      }
    } else {
      leadFilter.lead_assign_to = BigInt(ctx.userId)
    }
  }

  const [
    leads,
    verifications,
    appResponses,
    sources,
    users,
    queries,
  ] = await Promise.all([
    prisma.leads.findMany({
      where: leadFilter,
      orderBy: { id: "desc" },
    }),
    prisma.lead_verifications.findMany(),
    prisma.application_form_responses.findMany({
      where: {
        OR: [{ organization_id: ctx.orgId }, { organization_id: 0 }],
      },
    }),
    prisma.lead_sources.findMany({
      where: { organization_id: BigInt(ctx.orgId) },
    }),
    prisma.users.findMany({
      select: { id: true, first_name: true, last_name: true },
    }),
    prisma.lead_queries.findMany(),
  ])

  const leadIdSet = new Set(leads.map((l) => Number(l.id)))
  const verifiedLeadSet = new Set(
    verifications
      .filter((v) => v.sms_verified === 1 || v.email_verified === 1)
      .map((v) => Number(v.lead_id))
  )

  const totalLeads = leads.length
  const verified = leads.filter((l) => verifiedLeadSet.has(Number(l.id))).length
  const unverified = totalLeads - verified
  const verifiedPercent = totalLeads
    ? Math.round((verified / totalLeads) * 100)
    : 0
  const unverifiedPercent = totalLeads ? 100 - verifiedPercent : 0

  const scopedApps = appResponses.filter(
    (a) => a.lead_id === 0 || leadIdSet.has(a.lead_id)
  )
  const totalApplications = scopedApps.length
  const paidApps = scopedApps.filter((a) => a.payment_status === 1)
  const paidApplications = paidApps.length
  const unpaidApplications = Math.max(0, totalApplications - paidApplications)

  const paidOnlineCount = paidApps.filter((a) => a.payment_method === "online").length
  const paidOfflineCount = paidApps.filter((a) => a.payment_method === "offline").length
  const paidCashCount = paidApps.filter((a) => a.payment_method === "cash").length
  const paidDDCount = paidApps.filter((a) => a.payment_method === "dd").length
  const paidFreeCount = paidApps.filter((a) => a.payment_method === "free").length
  const totalPaidCount =
    paidOnlineCount +
    paidOfflineCount +
    paidCashCount +
    paidDDCount +
    paidFreeCount
  const paidSafe = totalPaidCount > 0 ? totalPaidCount : 1

  const leadConversion = totalLeads
    ? Number(((paidApplications / totalLeads) * 100).toFixed(1))
    : 0

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const todayRevenue = paidApps
    .filter((a) => a.created_at && a.created_at.toISOString().slice(0, 10) === todayStr)
    .reduce((acc, a) => acc + (a.payment_amount || 0), 0)
  const monthRevenue = paidApps
    .filter(
      (a) =>
        a.created_at &&
        a.created_at.getMonth() === now.getMonth() &&
        a.created_at.getFullYear() === now.getFullYear()
    )
    .reduce((acc, a) => acc + (a.payment_amount || 0), 0)

  const pendingFollowups = leads.filter(
    (l) => l.next_followup_at && l.next_followup_at <= now
  ).length

  const processedUnpaid = Math.round(unpaidApplications * 0.6)
  const unapprovedUnpaid = unpaidApplications - processedUnpaid

  // Ticket stats
  const scopedQueries = queries.filter((q) => leadIdSet.has(q.lead_id))
  const totalQueries = scopedQueries.length
  const openQueries = scopedQueries.filter((q) => q.status === "open").length
  const inProgressQueries = scopedQueries.filter(
    (q) => q.status === "in_progress"
  ).length
  const closedQueries = scopedQueries.filter(
    (q) => q.status === "closed" || q.status === "resolved"
  ).length

  // Charts data
  const dealData = [
    { name: "Paid", value: Math.max(paidApplications, 1) },
    { name: "Unpaid", value: unpaidApplications },
    { name: "Free Waiver", value: paidFreeCount },
  ]

  const enrolledCount = paidApps.filter((a) => a.status === "approved").length
  const funnelData = [
    { stage: "Leads", count: totalLeads },
    { stage: "Applications", count: totalApplications },
    { stage: "Paid", count: paidApplications },
    { stage: "Enrolled", count: enrolledCount },
  ]

  const srcNameMap = new Map(sources.map((s) => [Number(s.id), s.name]))
  const srcCounts = new Map<string, number>()
  for (const l of leads) {
    const label = l.lead_source_id
      ? srcNameMap.get(Number(l.lead_source_id)) || "Other"
      : "Direct"
    srcCounts.set(label, (srcCounts.get(label) || 0) + 1)
  }
  const sourceData = Array.from(srcCounts.entries()).map(([name, cnt]) => ({
    name,
    leads: cnt,
  }))

  const userMap = new Map(
    users.map((u) => [u.id, `${u.first_name || ""} ${u.last_name || ""}`.trim()])
  )
  const ownerLeadCounts = new Map<number, number>()
  for (const l of leads) {
    const oid = Number(l.lead_assign_to || 0)
    ownerLeadCounts.set(oid, (ownerLeadCounts.get(oid) || 0) + 1)
  }
  const teamData = Array.from(ownerLeadCounts.entries()).map(([oid, cnt]) => ({
    name: oid > 0 ? userMap.get(oid) || `User #${oid}` : "Unassigned",
    leads: cnt,
    paid: paidApps.filter((a) => a.assigned_to === oid).length,
  }))

  const recentLeads = leads.slice(0, 15).map((l) => ({
    id: String(l.id),
    name: l.name || "-",
    mobile: l.mobile || "-",
    email: l.email || "-",
    lead_score: Number(l.lead_score ?? 0),
    owner:
      l.lead_assign_to && Number(l.lead_assign_to) > 0
        ? userMap.get(Number(l.lead_assign_to)) || `User #${l.lead_assign_to}`
        : null,
  }))

  return (
    <div>
      <BreadcrumbBar parent="Dashboards" title="CRM" />

      {/* ==================== TOP CRM WIDGET STRIP ==================== */}
      <Card className="gap-0 overflow-hidden py-0 shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-6">
          {/* 1. Total Leads */}
          <div className="flex flex-col justify-between">
            <div className="p-4">
              <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Total Leads</span>
                <i className="ri-arrow-up-circle-line text-lg text-[#0ab39c]" />
              </h5>
              <div className="mt-3 flex items-center gap-3">
                <i className="ri-space-ship-line text-3xl text-muted-foreground" />
                <h2 className="text-2xl font-bold">{totalLeads}</h2>
              </div>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  <span className="mr-1 inline-block size-2 rounded-full bg-[#0ab39c]" />
                  Verified: <strong className="text-foreground">{verified}</strong>
                </span>
                <span>
                  <span className="mr-1 inline-block size-2 rounded-full bg-[#299cdb]" />
                  Unverified:{" "}
                  <strong className="text-foreground">{unverified}</strong>
                </span>
              </div>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden bg-muted">
              <div
                style={{ width: `${verifiedPercent}%` }}
                className="bg-[#0ab39c]"
              />
              <div
                style={{ width: `${unverifiedPercent}%` }}
                className="bg-[#299cdb]"
              />
            </div>
          </div>

          {/* 2. Paid Applications */}
          <div className="flex flex-col justify-between">
            <div className="p-4">
              <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Paid Applications</span>
                <i className="ri-arrow-up-circle-line text-lg text-[#0ab39c]" />
              </h5>
              <div className="mt-3 flex items-center gap-3">
                <i className="ri-exchange-dollar-line text-3xl text-muted-foreground" />
                <div>
                  <h2 className="text-2xl font-bold">{totalPaidCount}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Total Paid Applications
                  </p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                <span>Online: {paidOnlineCount}</span>
                <span>Offline: {paidOfflineCount}</span>
                <span>Cash: {paidCashCount}</span>
                <span>DD: {paidDDCount}</span>
                <span>Free: {paidFreeCount}</span>
              </div>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden bg-muted">
              <div
                style={{ width: `${Math.round((paidOnlineCount / paidSafe) * 100)}%` }}
                className="bg-[#0ab39c]"
              />
              <div
                style={{ width: `${Math.round((paidOfflineCount / paidSafe) * 100)}%` }}
                className="bg-[#299cdb]"
              />
              <div
                style={{ width: `${Math.round((paidCashCount / paidSafe) * 100)}%` }}
                className="bg-[#405189]"
              />
              <div
                style={{ width: `${Math.round((paidDDCount / paidSafe) * 100)}%` }}
                className="bg-[#f7b84b]"
              />
              <div
                style={{ width: `${Math.round((paidFreeCount / paidSafe) * 100)}%` }}
                className="bg-[#f06548]"
              />
            </div>
          </div>

          {/* 3. Daily Average Income */}
          <div className="flex flex-col justify-between p-4">
            <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Daily Average Income</span>
              <i className="ri-arrow-up-circle-line text-lg text-[#0ab39c]" />
            </h5>
            <div className="my-auto flex items-center gap-3 py-2">
              <i className="ri-trophy-line text-3xl text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-bold">
                  ₹{todayRevenue.toLocaleString("en-IN")}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Collected Today
                </p>
              </div>
            </div>
          </div>

          {/* 4. Lead Conversion */}
          <div className="flex flex-col justify-between p-4">
            <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Lead Conversion</span>
              <i className="ri-arrow-up-circle-line text-lg text-[#0ab39c]" />
            </h5>
            <div className="my-auto flex items-center gap-3 py-2">
              <i className="ri-pulse-line text-3xl text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-bold">{leadConversion}%</h2>
                <p className="text-[11px] text-muted-foreground">
                  Enrollments Ratio
                </p>
              </div>
            </div>
          </div>

          {/* 5. Unpaid Applications */}
          <div className="flex flex-col justify-between">
            <div className="p-4">
              <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>UnPaid Applications</span>
                <i className="ri-arrow-up-circle-line text-lg text-[#0ab39c]" />
              </h5>
              <div className="mt-3 flex items-center gap-3">
                <i className="ri-exchange-dollar-line text-3xl text-muted-foreground" />
                <h2 className="text-2xl font-bold">{unpaidApplications}</h2>
              </div>
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>{processedUnpaid} Processed</span>
                <span>{unapprovedUnpaid} Unapproved</span>
              </div>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden bg-muted">
              <div style={{ width: "55%" }} className="bg-[#0ab39c]" />
              <div style={{ width: "45%" }} className="bg-[#299cdb]" />
            </div>
          </div>

          {/* 6. Pending Followups */}
          <div className="flex flex-col justify-between p-4">
            <h5 className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Pending Followups</span>
              <i className="ri-arrow-down-circle-line text-lg text-[#f06548]" />
            </h5>
            <div className="my-auto flex items-center gap-3 py-2">
              <i className="ri-service-line text-3xl text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-bold text-[#f06548]">
                  {pendingFollowups}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Due / Overdue Calls
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ==================== 4 TICKET STAT CARDS ==================== */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="gap-1 p-4 shadow-xs">
          <h6 className="text-xs font-semibold uppercase text-muted-foreground">
            Total Tickets
          </h6>
          <h3 className="text-2xl font-bold">{totalQueries}</h3>
        </Card>
        <Card className="gap-1 p-4 shadow-xs">
          <h6 className="text-xs font-semibold uppercase text-[#f06548]">
            Open
          </h6>
          <h3 className="text-2xl font-bold">{openQueries}</h3>
        </Card>
        <Card className="gap-1 p-4 shadow-xs">
          <h6 className="text-xs font-semibold uppercase text-[#f7b84b]">
            In Progress
          </h6>
          <h3 className="text-2xl font-bold">{inProgressQueries}</h3>
        </Card>
        <Card className="gap-1 p-4 shadow-xs">
          <h6 className="text-xs font-semibold uppercase text-[#0ab39c]">
            Closed
          </h6>
          <h3 className="text-2xl font-bold">{closedQueries}</h3>
        </Card>
      </div>

      {/* ==================== INTERTS CHARTS ==================== */}
      <DashboardCharts
        dealData={dealData}
        funnelData={funnelData}
        sourceData={sourceData}
        teamData={teamData}
        monthlyRevenue={monthRevenue}
      />

      {/* ==================== RECENT LEADS DATATABLE ==================== */}
      <DashboardRecentLeadsTable leads={recentLeads} />
    </div>
  )
}
