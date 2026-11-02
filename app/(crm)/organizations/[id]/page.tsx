"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function OrganizationShowPage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/uac?entity=organization_detail&id=${params.id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [params.id])

  const org = data?.organization
  if (loading) {
    return (
      <div className="p-6 text-xs text-muted-foreground">
        Loading Organization Details...
      </div>
    )
  }

  if (!org) {
    return (
      <div className="space-y-4 p-6 text-xs">
        <Card className="p-6 text-center shadow-xs">
          <h4 className="text-sm font-semibold">Organization Not Found</h4>
          <p className="mt-1 text-muted-foreground">
            Organization #{params.id} could not be found.
          </p>
          <div className="mt-3">
            <Button
              asChild
              size="sm"
              className="bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              <Link href="/organizations">Back to Organizations</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-xs">
      <BreadcrumbBar parent="Organization" title={`${org.name} Details`} />

      <Card className="border-amber-200 bg-amber-50/70 p-5 shadow-xs dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-white text-xl font-bold text-[#405189] shadow-xs">
                {(org.name || "O").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{org.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground">
                <span>
                  <i className="ri-building-line mr-1" />
                  {[org.address, org.city, org.state, org.country, org.zipcode]
                    .filter(Boolean)
                    .join(", ") || "Headquarters"}
                </span>
                <span>•</span>
                <span>Email: {org.email || "-"}</span>
                <span>•</span>
                <span>Mobile: {org.mobile || "-"}</span>
                <Badge
                  className={
                    Number(org.status) === 1
                      ? "bg-emerald-100 text-[10px] font-semibold text-emerald-700"
                      : "bg-rose-100 text-[10px] font-semibold text-rose-700"
                  }
                >
                  {Number(org.status) === 1 ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/organizations">← Back to Organizations</Link>
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 p-4 shadow-xs">
          <div className="text-muted-foreground">Total Student Leads</div>
          <div className="text-2xl font-bold text-[#405189]">
            {data.leadsCount ?? 0}
          </div>
        </Card>
        <Card className="gap-1 p-4 shadow-xs">
          <div className="text-muted-foreground">Active Institutes</div>
          <div className="text-2xl font-bold text-[#0ab39c]">
            {(data.institutes || []).length}
          </div>
        </Card>
        <Card className="gap-1 p-4 shadow-xs">
          <div className="text-muted-foreground">Registered Staff</div>
          <div className="text-2xl font-bold text-[#299cdb]">
            {(data.staff || []).length}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0 shadow-xs">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Institutes under {org.name}
          </div>
          <div className="divide-y divide-border">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.institutes || []).map((inst: any) => (
              <div
                key={inst.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="font-semibold">{inst.name}</span>
                <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-0 py-0 shadow-xs">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold">
            Assigned Staff & Counsellors
          </div>
          <div className="divide-y divide-border">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data.staff || []).map((st: any) => (
              <div
                key={st.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div>
                  <div className="font-semibold">
                    {st.first_name} {st.last_name}
                  </div>
                  <div className="text-muted-foreground">{st.email}</div>
                </div>
                <span className="font-mono text-muted-foreground">
                  {st.mobile || "-"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
