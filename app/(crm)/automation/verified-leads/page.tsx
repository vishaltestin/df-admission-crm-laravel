"use client"

import * as React from "react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function VerifiedLeadsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=verified")
      .then((r) => r.json())
      .then((d) => setRows(d.items || []))
      .finally(() => setLoading(false))
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
        accessorFn: (r) => r.ivr_response || "1 (Confirmed)",
        id: "ivr_response",
        header: "IVR Response",
      },
      {
        accessorFn: (r) => r.confirm_time || r.updated_at || "",
        id: "verified_on",
        header: "Verified On",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.confirm_time || row.original.updated_at
              ? new Date(
                  row.original.confirm_time || row.original.updated_at
                ).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Verified Leads" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title="Verified Leads"
          columns={columns}
          data={rows}
          loading={loading}
          searchPlaceholder="Search verified leads..."
          emptyMessage="No verified raw leads yet. Convert raw leads from the Raw Leads Queue!"
        />
      </Card>
    </div>
  )
}
