"use client"

import * as React from "react"
import Link from "next/link"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function WhatsappLogsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=whatsapp")
      .then((r) => r.json())
      .then((d) => {
        const wa = d.whatsappLogs || []
        const commWa = (d.comms || []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => c.channel === "whatsapp"
        )
        setLogs(wa.length > 0 ? wa : commWa)
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
        accessorFn: (l) => l.mobile || l.to || l.recipient || "-",
        id: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.mobile || row.original.to || row.original.recipient || "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => l.template_id || "Custom",
        id: "template_id",
        header: "Template",
      },
      {
        accessorFn: (l) => l.message || l.content || "-",
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="max-w-xs line-clamp-2 block">
            {row.original.message || row.original.content}
          </span>
        ),
      },
      {
        accessorFn: (l) => (l.provider || "whatsapp-api").toUpperCase(),
        id: "provider",
        header: "Provider",
      },
      {
        accessorFn: (l) => l.status || "sent",
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className="bg-emerald-100 text-[10px] font-semibold uppercase text-emerald-700 hover:bg-emerald-200">
            {row.original.status || "sent"}
          </Badge>
        ),
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Sent At",
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
      <BreadcrumbBar parent="CRM" title="WhatsApp Logs" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`WhatsApp Message Logs (${logs.length})`}
          columns={columns}
          data={logs}
          searchPlaceholder="Search WhatsApp logs..."
          emptyMessage="No WhatsApp logs found."
        />
      </Card>
    </div>
  )
}
