"use client"

import * as React from "react"
import Link from "next/link"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function SmsLogsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=sms")
      .then((r) => r.json())
      .then((d) => setLogs(d.smsLogs || d.items || []))
      .finally(() => setLoading(false))
  }, [])

  // Exact 8 columns from df-laravel-crm resources/views/FrontEnd/automation/sms.blade.php:
  // ID | Lead ID | Mobile | Template | Message | Provider | Status | Delivered At
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
        accessorFn: (l) => l.mobile || "-",
        id: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile || "-"}</span>
        ),
      },
      {
        accessorFn: (l) => l.template_name || "-",
        id: "template_name",
        header: "Template",
      },
      {
        accessorFn: (l) => l.message || "-",
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="block max-w-sm line-clamp-2">
            {row.original.message || "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => l.provider || "sms-gateway",
        id: "provider",
        header: "Provider",
      },
      {
        accessorFn: (l) => l.status || "sent",
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const st = String(row.original.status || "sent")
          return (
            <Badge
              className={`text-[10px] font-semibold uppercase ${
                st === "sent" || st === "delivered"
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : st === "failed"
                    ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {st}
            </Badge>
          )
        },
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Delivered At",
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
      <BreadcrumbBar parent="CRM" title="SMS Logs" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="SMS Delivery Logs"
          columns={columns}
          data={logs}
          loading={loading}
          searchPlaceholder="Search SMS logs..."
          emptyMessage="No SMS logs found"
        />
      </Card>
    </div>
  )
}
