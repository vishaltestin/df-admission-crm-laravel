"use client"

import * as React from "react"
import Link from "next/link"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { formatDateTime } from "@/lib/serialize"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function LeadUploadLogsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch("/api/leads/upload")
      .then((r) => r.json())
      .then((d) => setLogs(d.items || []))
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-semibold">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "file_name",
        header: "File Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.file_name}</span>
        ),
      },
      { accessorKey: "total_rows", header: "Total Rows" },
      {
        accessorKey: "success_rows",
        header: "Success",
        cell: ({ row }) => (
          <span className="font-semibold text-[#0ab39c]">
            {row.original.success_rows}
          </span>
        ),
      },
      {
        accessorKey: "duplicate_rows",
        header: "Duplicate",
        cell: ({ row }) => (
          <span className="font-semibold text-[#f7b84b]">
            {row.original.duplicate_rows}
          </span>
        ),
      },
      {
        accessorKey: "failed_rows",
        header: "Failed",
        cell: ({ row }) => (
          <span className="font-semibold text-[#f06548]">
            {row.original.failed_rows}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className="bg-[#0ab39c]/15 text-[11px] font-semibold uppercase text-[#0ab39c] hover:bg-[#0ab39c]/25">
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Uploaded At",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDateTime(row.original.created_at)}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="Leads" title="Upload Logs" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title="CSV Upload Batch History"
          columns={columns}
          data={logs}
          searchPlaceholder="Search CSV batches..."
          toolbarRight={
            <Button
              asChild
              size="sm"
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <Link href="/leads/upload">
                <i className="ri-upload-2-line mr-1" /> New CSV Upload
              </Link>
            </Button>
          }
        />
      </Card>
    </div>
  )
}
