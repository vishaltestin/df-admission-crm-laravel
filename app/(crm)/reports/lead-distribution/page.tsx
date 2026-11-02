"use client"

import * as React from "react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function LeadDistributionReportPage() {
  const [byRule, setByRule] = React.useState<
    { rule_type: string; total: number }[]
  >([])
  const [byUser, setByUser] = React.useState<
    { name: string; total: number }[]
  >([])

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=reports")
      .then((r) => r.json())
      .then((d) => {
        const leads = d.leads || []
        const users = d.users || []
        const logs = d.assignmentLogs || []

        const ruleCounts: Record<string, number> = {}
        if (logs.length > 0) {
          for (const l of logs) {
            const k = l.rule_type || "round_robin"
            ruleCounts[k] = (ruleCounts[k] || 0) + 1
          }
        } else {
          for (const l of leads) {
            const k =
              Number(l.lead_assign_to) > 0
                ? "source_round_robin"
                : "unassigned_pool"
            ruleCounts[k] = (ruleCounts[k] || 0) + 1
          }
        }
        setByRule(
          Object.entries(ruleCounts).map(([rule_type, total]) => ({
            rule_type,
            total,
          }))
        )

        const userCounts: Record<string, number> = {}
        for (const l of leads) {
          const uid = Number(l.lead_assign_to || 0)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const u = users.find((x: any) => Number(x.id) === uid)
          const label =
            uid === 0
              ? "Unassigned Queue"
              : u
                ? `${u.first_name || ""} ${u.last_name || ""}`.trim()
                : `User #${uid}`
          userCounts[label] = (userCounts[label] || 0) + 1
        }
        setByUser(
          Object.entries(userCounts).map(([name, total]) => ({ name, total }))
        )
      })
  }, [])

  const ruleCols = React.useMemo<ColumnDef<{ rule_type: string; total: number }>[]>(
    () => [
      {
        accessorKey: "rule_type",
        header: "Rule Type",
        cell: ({ row }) => (
          <span className="font-medium capitalize">
            {row.original.rule_type.replace(/_/g, " ")}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total Leads",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.total}</span>
        ),
      },
    ],
    []
  )

  const userCols = React.useMemo<ColumnDef<{ name: string; total: number }>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total Assigned",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.total}</span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="Reports" title="Lead Distribution Report" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 text-xs">
        <Card className="gap-0 py-0 shadow-xs">
          <DataTable
            title="By Rule Type"
            columns={ruleCols}
            data={byRule}
            showColumnToggle={false}
            searchPlaceholder="Filter rule types..."
          />
        </Card>

        <Card className="gap-0 py-0 shadow-xs">
          <DataTable
            title="By User (Counsellor Allocation)"
            columns={userCols}
            data={byUser}
            showColumnToggle={false}
            searchPlaceholder="Filter counsellors..."
          />
        </Card>
      </div>
    </div>
  )
}
