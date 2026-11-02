"use client"

import * as React from "react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function RejectedLeadsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=rejected")
      .then((r) => r.json())
      .then((d) => setRows(d.items || []))
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorFn: (r) => r.name || "-",
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name || "-"}</span>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile}</span>
        ),
      },
      { accessorFn: (r) => r.course || "-", id: "course", header: "Course" },
      { accessorFn: (r) => r.city || "-", id: "city", header: "City" },
      {
        accessorFn: (r) => r.campaign || "-",
        id: "campaign",
        header: "Campaign",
      },
      { accessorFn: (r) => r.source || "-", id: "source", header: "Source" },
      {
        accessorFn: (r) => r.ivr_response || "2 (Declined)",
        id: "ivr_response",
        header: "IVR Response",
        cell: ({ row }) => (
          <span className="text-rose-600">
            {row.original.ivr_response || "2 (Declined)"}
          </span>
        ),
      },
      {
        accessorFn: (r) => r.updated_at || "",
        id: "updated_at",
        header: "Rejected On",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.updated_at
              ? new Date(row.original.updated_at).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Rejected Leads" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`Rejected Leads (${rows.length})`}
          columns={columns}
          data={rows}
          searchPlaceholder="Search rejected leads..."
          emptyMessage="No rejected raw leads found."
        />
      </Card>
    </div>
  )
}
