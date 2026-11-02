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

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=ivr")
      .then((r) => r.json())
      .then((d) => {
        const combined = [...(d.ivrLogs || []), ...(d.callLogs || [])]
        setLogs(combined)
      })
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
        accessorFn: (l) => l.lead_id || "",
        id: "lead_id",
        header: "Lead ID",
        cell: ({ row }) =>
          row.original.lead_id ? (
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              Lead #{row.original.lead_id}
            </Link>
          ) : (
            "-"
          ),
      },
      {
        accessorFn: (l) => l.mobile || l.customer_number || "-",
        id: "mobile",
        header: "Mobile / Caller",
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.mobile || row.original.customer_number || "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => (l.provider || "telephony").toUpperCase(),
        id: "provider",
        header: "Provider",
      },
      {
        accessorFn: (l) => l.status || l.call_status || "completed",
        id: "status",
        header: "Call Status",
        cell: ({ row }) => (
          <Badge className="bg-[#299cdb]/15 text-[10px] font-semibold uppercase text-[#299cdb] hover:bg-[#299cdb]/25">
            {row.original.status || row.original.call_status || "completed"}
          </Badge>
        ),
      },
      {
        accessorFn: (l) => l.dtmf || l.notes || "-",
        id: "dtmf",
        header: "DTMF / Response",
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Triggered At",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
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
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`IVR Call Logs (${logs.length})`}
          columns={columns}
          data={logs}
          searchPlaceholder="Search IVR logs..."
          emptyMessage="No IVR call logs found. Trigger an IVR call from Raw Leads or Lead Detail!"
        />
      </Card>
    </div>
  )
}
