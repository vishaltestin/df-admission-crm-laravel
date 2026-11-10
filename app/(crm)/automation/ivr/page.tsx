"use client"

import * as React from "react"
import Link from "next/link"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function IvrLogsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=ivr")
      .then((r) => r.json())
      .then((d) => setLogs(d.ivrLogs || d.items || []))
      .finally(() => setLoading(false))
  }, [])

  // Exact 9 columns from df-laravel-crm resources/views/FrontEnd/automation/ivr.blade.php:
  // ID | Lead ID | Name | Mobile | Campaign | Provider | Call Status | Response | Triggered At
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.id}</span>
        ),
      },
      {
        accessorFn: (l) => l.lead_id || "-",
        id: "lead_id",
        header: "Lead ID",
        cell: ({ row }) =>
          row.original.lead_id ? (
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              {row.original.lead_id}
            </Link>
          ) : (
            "-"
          ),
      },
      {
        accessorFn: (l) => l.lead_name || "-",
        id: "lead_name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.lead_name || "-"}</span>
        ),
      },
      {
        accessorFn: (l) => l.mobile || "-",
        id: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile || "-"}</span>
        ),
      },
      {
        accessorFn: (l) => l.campaign || "-",
        id: "campaign",
        header: "Campaign",
      },
      {
        accessorFn: (l) => l.provider || "-",
        id: "provider",
        header: "Provider",
      },
      {
        accessorFn: (l) => l.call_status || l.status || "completed",
        id: "call_status",
        header: "Call Status",
        cell: ({ row }) => {
          const st = String(
            row.original.call_status || row.original.status || "completed"
          )
          return (
            <Badge
              className={`text-[10px] font-semibold uppercase ${
                st === "completed" || st === "answered" || st === "confirmed"
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : st === "failed" || st === "rejected"
                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    : "bg-[#299cdb]/15 text-[#299cdb]"
              }`}
            >
              {st}
            </Badge>
          )
        },
      },
      {
        accessorFn: (l) => l.ivr_response || l.dtmf || "-",
        id: "ivr_response",
        header: "Response",
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">
            {row.original.ivr_response || row.original.dtmf || "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Triggered At",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="IVR Logs" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="IVR Call Logs"
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder="Search IVR logs..."
          emptyMessage="No logs found"
        />
      </Card>
    </div>
  )
}
