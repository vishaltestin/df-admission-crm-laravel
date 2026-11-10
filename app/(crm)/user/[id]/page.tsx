"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function UserProfileDetailPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/uac?entity=user_detail&id=${params.id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div>
        <BreadcrumbBar parent="Manage Users" title="User Profile" />
        <Card className="mb-4 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <Skeleton className="mb-4 h-9 w-96" />
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    )
  }

  const user = data?.user
  if (!user) {
    return (
      <div>
        <BreadcrumbBar parent="Manage Users" title="User Not Found" />
        <Card className="p-8 text-center text-xs">
          <p className="mb-3 text-muted-foreground">
            The requested user profile could not be found.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/user">← Back to Manage Users</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const stats = data.stats || {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userLogs: any[] = data.userLogs || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgLogs: any[] = data.orgLogs || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadLogs: any[] = data.leadLogs || []

  const initials = `${(user.name || "U")[0]}${
    user.lname ? user.lname[0] : ""
  }`.toUpperCase()

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="Manage Users" title="User Profile" />

      {/* Velzon Profile Cover Banner */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="bg-gradient-to-r from-[#405189] via-[#364574] to-[#0ab39c] px-6 py-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/15 text-xl font-bold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">
                    {user.name} {user.lname}
                  </h2>
                  <Badge
                    className={
                      Number(user.status ?? 1) === 1
                        ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40"
                        : "bg-rose-400/20 text-rose-100 ring-1 ring-rose-300/40"
                    }
                  >
                    {Number(user.status ?? 1) === 1 ? "Active" : "Deactive"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-white/85">
                  {user.designation_name !== "-"
                    ? user.designation_name
                    : user.role_name}{" "}
                  • {user.organization_name}
                  {user.team_name && user.team_name !== "-"
                    ? ` • Team: ${user.team_name}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-white/80">
                  <span>
                    <i className="ri-mail-line mr-1" />
                    {user.email}
                  </span>
                  {user.mobile && (
                    <span>
                      <i className="ri-phone-line mr-1" />
                      {user.mobile}
                    </span>
                  )}
                  <span>
                    <i className="ri-shield-user-line mr-1" />
                    Role: {user.role_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="h-8 bg-white/15 text-xs text-white hover:bg-white/25"
              >
                <Link href="/user">← Back to Users</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Tabs matching user/profile.blade.php */}
        <div className="p-4 sm:p-5">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
              <TabsTrigger value="overview" className="px-3 py-1.5 text-xs">
                <i className="ri-user-3-line mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="user_logs" className="px-3 py-1.5 text-xs">
                <i className="ri-history-line mr-1.5" />
                Activities (User Logs) ({userLogs.length})
              </TabsTrigger>
              <TabsTrigger value="org_logs" className="px-3 py-1.5 text-xs">
                <i className="ri-building-2-line mr-1.5" />
                Organization Logs ({orgLogs.length})
              </TabsTrigger>
              <TabsTrigger value="lead_logs" className="px-3 py-1.5 text-xs">
                <i className="ri-user-follow-line mr-1.5" />
                Lead Logs ({leadLogs.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="p-4 shadow-none">
                  <div className="text-[11px] text-muted-foreground">
                    Assigned Leads
                  </div>
                  <div className="mt-1 text-xl font-bold text-[#405189]">
                    {stats.assignedLeads ?? 0}
                  </div>
                </Card>
                <Card className="p-4 shadow-none">
                  <div className="text-[11px] text-muted-foreground">
                    User Activity Logs
                  </div>
                  <div className="mt-1 text-xl font-bold text-[#0ab39c]">
                    {stats.userLogsCount ?? userLogs.length}
                  </div>
                </Card>
                <Card className="p-4 shadow-none">
                  <div className="text-[11px] text-muted-foreground">
                    Organization Logs
                  </div>
                  <div className="mt-1 text-xl font-bold text-amber-600">
                    {stats.orgLogsCount ?? orgLogs.length}
                  </div>
                </Card>
                <Card className="p-4 shadow-none">
                  <div className="text-[11px] text-muted-foreground">
                    Lead Activity Logs
                  </div>
                  <div className="mt-1 text-xl font-bold text-[#299cdb]">
                    {stats.leadLogsCount ?? leadLogs.length}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <Card className="shadow-none lg:col-span-5">
                  <CardHeader className="border-b border-border px-4 py-3">
                    <CardTitle className="text-xs font-bold uppercase">
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border p-0 text-xs">
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Full Name</span>
                      <span className="col-span-2 font-semibold">
                        {user.name} {user.lname}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Email</span>
                      <span className="col-span-2">{user.email}</span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Mobile</span>
                      <span className="col-span-2 font-mono">
                        {user.mobile || "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Organization</span>
                      <span className="col-span-2 font-medium">
                        <Link
                          href={`/organizations/${user.organization_id}`}
                          className="text-[#405189] hover:underline"
                        >
                          {user.organization_name}
                        </Link>
                      </span>
                    </div>
                    {Array.isArray(user.other_organizations) &&
                      user.other_organizations.length > 0 && (
                        <div className="grid grid-cols-3 px-4 py-2.5">
                          <span className="text-muted-foreground">
                            Other Orgs
                          </span>
                          <div className="col-span-2 flex flex-wrap gap-1">
                            {user.other_organizations.map(
                              (o: { id: number; name: string }) => (
                                <Badge
                                  key={o.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {o.name}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Designation</span>
                      <span className="col-span-2">
                        {user.designation_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Team</span>
                      <span className="col-span-2">{user.team_name}</span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Role</span>
                      <span className="col-span-2">
                        <Badge className="bg-[#405189]/10 text-[#405189]">
                          {user.role_name}
                        </Badge>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Last Login</span>
                      <span className="col-span-2 text-muted-foreground">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleString("en-IN")
                          : "Never logged in"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 px-4 py-2.5">
                      <span className="text-muted-foreground">Joining Date</span>
                      <span className="col-span-2 text-muted-foreground">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString("en-IN")
                          : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none lg:col-span-7">
                  <CardHeader className="border-b border-border px-4 py-3">
                    <CardTitle className="text-xs font-bold uppercase">
                      Recent Activity Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border p-0 text-xs">
                    {userLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 px-4 py-3"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#405189]/12 text-[11px] font-bold text-[#405189]">
                          U
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              {log.description || log.action}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString(
                                    "en-IN"
                                  )
                                : "-"}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">
                              {log.action}
                            </Badge>
                            {log.ip_address && <span>IP: {log.ip_address}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {userLogs.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No recent user logs recorded yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: ACTIVITIES (USER LOGS) */}
            <TabsContent value="user_logs">
              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="text-xs font-bold uppercase">
                    User Activity Logs ({userLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border p-0 text-xs">
                  {userLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#405189] text-xs font-bold text-white">
                        U
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            {log.description || log.action}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString("en-IN")
                              : "-"}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">
                            {log.action}
                          </Badge>
                          {log.entity_type && (
                            <span>
                              Entity: {log.entity_type}
                              {log.entity_id ? ` #${log.entity_id}` : ""}
                            </span>
                          )}
                          {log.ip_address && (
                            <span className="font-mono">
                              IP: {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userLogs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No user activity logs found for this user.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: ORGANIZATION LOGS */}
            <TabsContent value="org_logs">
              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="text-xs font-bold uppercase">
                    Organization Activity Logs ({orgLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border p-0 text-xs">
                  {orgLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0ab39c] text-xs font-bold text-white">
                        O
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-foreground">
                            {log.description || log.action}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString("en-IN")
                              : "-"}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge
                            variant="secondary"
                            className="bg-emerald-50 text-[10px] text-emerald-700"
                          >
                            {log.action}
                          </Badge>
                          {log.entity_type && (
                            <span>
                              {log.entity_type}
                              {log.entity_id ? ` #${log.entity_id}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {orgLogs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No organization logs found.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: LEAD LOGS */}
            <TabsContent value="lead_logs">
              <Card className="shadow-none">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="text-xs font-bold uppercase">
                    Lead Activity Logs ({leadLogs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border p-0 text-xs">
                  {leadLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#299cdb] text-xs font-bold text-white">
                        L
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {log.description || log.action}
                            </span>
                            {log.lead_id && (
                              <Link
                                href={`/leads/${log.lead_id}`}
                                className="rounded bg-[#299cdb]/10 px-2 py-0.5 text-[11px] font-semibold text-[#299cdb] hover:underline"
                              >
                                {log.lead_name || `Lead #${log.lead_id}`}
                              </Link>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {log.created_at
                              ? new Date(log.created_at).toLocaleString("en-IN")
                              : "-"}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {log.action}
                          </Badge>
                          {log.lead_phone && (
                            <span className="font-mono">
                              Mobile: {log.lead_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {leadLogs.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No lead activity logs found for this user.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
