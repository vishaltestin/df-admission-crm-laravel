"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function timeSince(dt?: string | null): string {
  if (!dt) return "Recently"
  const created = new Date(dt)
  if (isNaN(created.getTime())) return "Recently"
  const diffDays = Math.max(
    0,
    Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
  )
  if (diffDays === 0) return "Today"
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  const months = Math.floor(diffDays / 30)
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? "" : "s"} ago`
}

export default function OrganizationDetailViewPage() {
  const params = useParams<{ id: string }>()
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null)
  const [activeTab, setActiveTab] = React.useState<
    "overview" | "team" | "activities" | "designations"
  >("overview")

  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/uac?entity=organization_detail&id=${params.id}`)
      const d = await r.json()
      setData(d)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  React.useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <BreadcrumbBar parent="Organizations" title="Organization View" />
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <Skeleton className="mt-5 h-9 w-80" />
        </Card>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <Card className="p-6 xl:col-span-8">
            <Skeleton className="mb-3 h-5 w-36" />
            <Skeleton className="h-44 w-full" />
          </Card>
          <Card className="p-6 xl:col-span-4">
            <Skeleton className="h-44 w-full" />
          </Card>
        </div>
      </div>
    )
  }

  const org = data?.organization
  if (!org) {
    return (
      <div>
        <BreadcrumbBar parent="Organizations" title="Organization Not Found" />
        <Card className="p-8 text-center text-xs">
          <p className="mb-3 text-muted-foreground">
            Organization record could not be found.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/organizations">← Back to Organizations</Link>
          </Button>
        </Card>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamData: any[] = data.teamData || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const designationData: any[] = data.designationData || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const designationWiseUsers: Record<string, any[]> =
    data.designationWiseUsers || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: any[] = data.users || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const institutes: any[] = data.institutes || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities: any[] = data.activities || []
  const leadsCount: number = Number(data.leadsCount ?? 0)

  const fullAddress = [org.address, org.city, org.state, org.country]
    .filter(Boolean)
    .join(", ")
    .concat(org.zipcode ? ` - ${org.zipcode}` : "")

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="Organizations" title={org.name} />

      {/* 1. Velzon Amber-Subtle Hero Card + 4 Tabs (1:1 with organization/show.blade.php) */}
      <Card className="overflow-hidden border-amber-200/70 py-0 shadow-xs dark:border-amber-900/40">
        <div className="bg-amber-50/85 px-5 pt-5 pb-0 dark:bg-amber-950/20">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white text-xl font-bold text-[#405189] shadow-xs dark:border-slate-800 dark:bg-slate-900">
                {(org.name || "O").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {org.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  {fullAddress && (
                    <span>
                      <i className="ri-building-line mr-1 align-middle" />
                      {fullAddress}
                    </span>
                  )}
                  {fullAddress && <span>•</span>}
                  <span>
                    Create Date :{" "}
                    <strong className="font-medium text-foreground">
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </strong>
                  </span>
                  <Badge className="rounded-full bg-[#299cdb] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                    Since {timeSince(org.created_at)}
                  </Badge>
                  <Badge
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white ${
                      Number(org.status ?? 1) === 1
                        ? "bg-[#0ab39c]"
                        : "bg-[#f06548]"
                    }`}
                  >
                    {Number(org.status ?? 1) === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Contact Buttons + Back Link */}
            <div className="flex flex-wrap items-center gap-2">
              {org.mobile && (
                <a
                  href={`tel:${org.mobile}`}
                  title={`Call ${org.mobile}`}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-emerald-600 shadow-2xs transition hover:bg-emerald-50"
                >
                  <i className="ri-phone-line text-sm" />
                </a>
              )}
              {org.email && (
                <a
                  href={`mailto:${org.email}`}
                  title={`Email ${org.email}`}
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-[#405189] shadow-2xs transition hover:bg-indigo-50"
                >
                  <i className="ri-mail-line text-sm" />
                </a>
              )}
              {org.mobile && (
                <a
                  href={`https://wa.me/${String(org.mobile).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp Organization"
                  className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-emerald-600 shadow-2xs transition hover:bg-emerald-50"
                >
                  <i className="ri-whatsapp-line text-sm" />
                </a>
              )}
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 bg-background text-xs"
              >
                <Link href="/organizations">← Back to Organizations</Link>
              </Button>
            </div>
          </div>

          {/* 4 Navigation Tabs */}
          <div className="flex flex-wrap gap-1 border-t border-amber-200/60 pt-1 dark:border-amber-900/40">
            {[
              {
                id: "overview" as const,
                label: "Overview",
                icon: "ri-dashboard-2-line",
              },
              {
                id: "team" as const,
                label: `Team (${teamData.length})`,
                icon: "ri-team-line",
              },
              {
                id: "activities" as const,
                label: `Activities (${activities.length})`,
                icon: "ri-history-line",
              },
              {
                id: "designations" as const,
                label: `Designations & Staff (${users.length})`,
                icon: "ri-shield-star-line",
              },
            ].map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                    active
                      ? "border-[#405189] text-[#405189]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <i className={tab.icon} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* =========================================================
          TAB 1: DIVIDED OVERVIEW (Left 8 cols Summary + Details | Right 4 cols Teams + Users + Designations)
         ========================================================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* LEFT COLUMN (8/12) */}
          <div className="space-y-4 xl:col-span-8">
            <Card className="shadow-xs">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-foreground">
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5 text-xs">
                <div className="space-y-2 leading-relaxed text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">
                    Welcome to {org.name}!
                  </p>
                  <p>
                    This workspace manages your organization&apos;s teams,
                    designations, counselors, academic institutes, and student
                    enquiries in one unified multi-tenant hub.
                  </p>
                  <p className="font-semibold text-foreground">
                    Organization Snapshot:
                  </p>
                  <ul className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-5">
                    <li className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        Teams
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-[#405189]">
                        {teamData.length}
                      </div>
                    </li>
                    <li className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        Designations
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-[#0ab39c]">
                        {designationData.length}
                      </div>
                    </li>
                    <li className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        Staff Users
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-amber-600">
                        {users.length}
                      </div>
                    </li>
                    <li className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        Institutes
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-[#299cdb]">
                        {institutes.length}
                      </div>
                    </li>
                    <li className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="text-[11px] text-muted-foreground">
                        Total Leads
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {leadsCount}
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Dashed Metadata Strip matching organization/show.blade.php */}
                <div className="grid grid-cols-2 gap-3 border-t border-dashed border-border pt-4 sm:grid-cols-4">
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                      Create Date
                    </p>
                    <p className="font-semibold text-foreground">
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                      Last Login
                    </p>
                    <p className="font-semibold text-foreground">
                      {org.last_login
                        ? new Date(org.last_login).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "No recent login"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                      Priority
                    </p>
                    <Badge className="bg-[#f06548] text-[10px] text-white">
                      High
                    </Badge>
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      className={
                        Number(org.status ?? 1) === 1
                          ? "bg-[#0ab39c] text-[10px] text-white"
                          : "bg-slate-400 text-[10px] text-white"
                      }
                    >
                      {Number(org.status ?? 1) === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Details & Linked Academic Institutes */}
            <Card className="shadow-xs">
              <CardHeader className="border-b border-border px-5 py-3.5">
                <CardTitle className="text-xs font-bold uppercase tracking-wide text-foreground">
                  Organization Information & Campuses
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0 text-xs">
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">
                    Organization Name
                  </span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {org.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">Official Email</span>
                  <span className="col-span-2">{org.email || "-"}</span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">Contact Number</span>
                  <span className="col-span-2 font-mono">
                    {org.mobile || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">GSTIN</span>
                  <span className="col-span-2 font-mono">{org.gst || "-"}</span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">Full Address</span>
                  <span className="col-span-2">{fullAddress || "-"}</span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">Created By</span>
                  <span className="col-span-2">{org.creator_name || "-"}</span>
                </div>
                <div className="grid grid-cols-3 px-5 py-3">
                  <span className="text-muted-foreground">
                    Academic Institutes ({institutes.length})
                  </span>
                  <div className="col-span-2 flex flex-wrap gap-1.5">
                    {institutes.length > 0 ? (
                      institutes.map((inst) => (
                        <Badge
                          key={inst.id}
                          variant="secondary"
                          className="bg-[#405189]/10 text-[11px] text-[#405189]"
                        >
                          {inst.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">
                        No institutes configured yet
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN (4/12): 3 Stacked Sidebar Cards — Teams, Users, Designations */}
          <div className="space-y-4 xl:col-span-4">
            {/* Sidebar Card 1: Teams */}
            <Card className="gap-0 py-0 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                <CardTitle className="text-xs font-bold uppercase text-foreground">
                  Teams ({teamData.length})
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setActiveTab("team")}
                  className="text-[11px] font-semibold text-[#405189] hover:underline"
                >
                  View All →
                </button>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0 text-xs">
                {teamData.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {team.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Head: {team.head_name || "-"}
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {(team.users || []).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (u: any) => (
                          <Link
                            key={u.id}
                            href={`/user/${u.id}`}
                            title={u.full_name}
                            className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-[#405189]/15 text-[10px] font-bold text-[#405189]"
                          >
                            {(u.full_name || "U").slice(0, 2).toUpperCase()}
                          </Link>
                        )
                      )}
                      {team.extra_count > 0 && (
                        <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-foreground">
                          +{team.extra_count}
                        </div>
                      )}
                      {(team.users || []).length === 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          0 users
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {teamData.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No teams created for this organization.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Card 2: Users (Scrollable) */}
            <Card className="gap-0 py-0 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                <CardTitle className="text-xs font-bold uppercase text-foreground">
                  Users ({users.length})
                </CardTitle>
                <Button
                  asChild
                  size="xs"
                  variant="ghost"
                  className="h-6 bg-[#0ab39c]/10 px-2 text-[11px] text-[#0ab39c] hover:bg-[#0ab39c]/20"
                >
                  <Link href="/user">
                    <i className="ri-user-add-line mr-1" />
                    Manage
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="max-h-64 divide-y divide-border overflow-y-auto p-0 text-xs">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#405189]/12 text-[11px] font-bold text-[#405189]">
                        {(u.full_name || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/user/${u.id}`}
                          className="font-semibold text-foreground hover:text-[#405189] hover:underline"
                        >
                          {u.full_name}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">
                          {u.designation_name}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${
                        Number(u.status ?? 1) === 1
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {Number(u.status ?? 1) === 1 ? "Active" : "Deactive"}
                    </Badge>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No users found in this organization.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar Card 3: Designations (Scrollable) */}
            <Card className="gap-0 py-0 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
                <CardTitle className="text-xs font-bold uppercase text-foreground">
                  Designations ({designationData.length})
                </CardTitle>
                <Link
                  href="/designations"
                  className="text-[11px] font-semibold text-[#405189] hover:underline"
                >
                  Manage →
                </Link>
              </CardHeader>
              <CardContent className="max-h-64 divide-y divide-border overflow-y-auto p-0 text-xs">
                {designationData.map((desig) => (
                  <div
                    key={desig.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {desig.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {desig.total_users} staff assigned
                      </div>
                    </div>
                    <div className="flex -space-x-2">
                      {(desig.users || []).map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (u: any) => (
                          <Link
                            key={u.id}
                            href={`/user/${u.id}`}
                            title={u.full_name}
                            className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-[#0ab39c]/15 text-[10px] font-bold text-[#0ab39c]"
                          >
                            {(u.full_name || "U").slice(0, 2).toUpperCase()}
                          </Link>
                        )
                      )}
                      {desig.extra_count > 0 && (
                        <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-foreground">
                          +{desig.extra_count}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {designationData.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    No designations found.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: TEAM & USERS BY DESIGNATION (1:1 with #project-team)
         ========================================================= */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Users by Designation
            </h3>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link href="/teams">Manage All Teams →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(designationWiseUsers).map(([desigName, list]) => (
              <Card
                key={desigName}
                className="flex flex-col justify-between gap-0 py-0 shadow-xs"
              >
                <div>
                  <CardHeader className="border-b border-border bg-muted/30 px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <i className="ri-shield-star-line text-sm text-[#405189]" />
                      <span>{desigName}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border p-0 text-xs">
                    {list.length > 0 ? (
                      list.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <Link
                            href={`/user/${u.id}`}
                            className="flex items-center gap-2 font-medium text-foreground hover:text-[#405189] hover:underline"
                          >
                            <i className="ri-user-star-line text-[#0ab39c]" />
                            <span>{u.full_name}</span>
                          </Link>
                          <span className="text-[11px] text-muted-foreground">
                            {u.team_name !== "-" ? u.team_name : u.role_name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No users assigned
                      </div>
                    )}
                  </CardContent>
                </div>
                <div className="border-t border-border bg-muted/20 px-4 py-2 text-right text-[11px] text-muted-foreground">
                  Total: <strong className="text-foreground">{list.length}</strong>{" "}
                  Users
                </div>
              </Card>
            ))}
          </div>

          {teamData.length > 0 && (
            <div className="pt-2">
              <h3 className="mb-3 text-sm font-bold text-foreground">
                Organization Teams ({teamData.length})
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamData.map((t) => (
                  <Card key={t.id} className="p-4 text-xs shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-foreground">{t.name}</h4>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Team Head: {t.head_name || "-"}
                        </p>
                      </div>
                      <Badge
                        className={
                          Number(t.status ?? 1) === 1
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {t.total_users} Members
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 3: ACTIVITIES TIMELINE (org_activity_logs)
         ========================================================= */}
      {activeTab === "activities" && (
        <Card className="gap-0 py-0 shadow-xs">
          <CardHeader className="border-b border-border px-5 py-3.5">
            <CardTitle className="text-xs font-bold uppercase text-foreground">
              Organization Activity Logs ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0 text-xs">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3.5 px-5 py-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#405189]/12 text-xs font-bold text-[#405189]">
                  {(act.actor_name || "S").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {act.actor_name}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {act.action}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {act.created_at
                        ? new Date(act.created_at).toLocaleString("en-IN")
                        : "-"}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {act.description || act.action}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No organization activity logs recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* =========================================================
          TAB 4: DESIGNATIONS & HORIZONTAL STAFF PROFILE CARDS (#project-Designations)
         ========================================================= */}
      {activeTab === "designations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Organization Staff & Designations ({users.length})
            </h3>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/designations">Manage Designations</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 bg-[#0ab39c] text-xs text-white hover:bg-[#099885]"
              >
                <Link href="/user">+ Add / Manage Staff</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {users.map((u) => (
              <Card
                key={u.id}
                className="p-4 text-xs shadow-xs transition hover:border-[#405189]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#405189]/12 text-sm font-bold text-[#405189]">
                      {(u.full_name || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/user/${u.id}`}
                        className="text-sm font-bold text-foreground hover:text-[#405189] hover:underline"
                      >
                        {u.full_name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>{u.designation_name}</span>
                        <span>•</span>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Leads & Activities Counters + View Profile + ⋮ Dropdown */}
                  <div className="flex items-center gap-4">
                    <div className="border-r border-dashed border-border pr-3 text-center">
                      <div className="text-sm font-bold text-foreground">
                        {u.leads_count ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Leads
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-foreground">
                        {u.activities_count ?? 0}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Activities
                      </div>
                    </div>

                    <Button asChild size="xs" variant="outline">
                      <Link href={`/user/${u.id}`}>View Profile</Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost">
                          <i className="ri-more-fill text-base" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs">
                        <DropdownMenuItem asChild className="text-xs">
                          <Link href={`/user/${u.id}`}>
                            <i className="ri-eye-line mr-2 text-muted-foreground" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs text-rose-600 focus:text-rose-600"
                          onClick={() =>
                            confirmDelete({
                              title: "Delete User?",
                              description: `Are you sure you want to permanently delete "${u.full_name}" (${u.email})?`,
                              onConfirm: async () => {
                                const res = await fetch("/api/uac", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    entity: "users",
                                    action: "delete",
                                    id: u.id,
                                  }),
                                })
                                if (res.ok) {
                                  toast.success("User deleted")
                                  load()
                                } else {
                                  const d = await res.json().catch(() => ({}))
                                  toast.error(d.error || "Cannot delete user")
                                }
                              },
                            })
                          }
                        >
                          <i className="ri-delete-bin-5-line mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}

            {users.length === 0 && (
              <Card className="p-8 text-center text-xs text-muted-foreground lg:col-span-2">
                No staff members assigned to this organization yet.
              </Card>
            )}
          </div>
        </div>
      )}

      {DeleteDialog}
    </div>
  )
}
