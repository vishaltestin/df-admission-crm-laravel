"use client"

import * as React from "react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function WebhookAndAuditLogsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [webhookLogs, setWebhookLogs] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activityLogs, setActivityLogs] = React.useState<any[]>([])

  const load = React.useCallback(() => {
    fetch("/api/settings-integrations?section=webhook_logs")
      .then((r) => r.json())
      .then((d) => {
        setWebhookLogs(d.webhookLogs || [])
        setActivityLogs(d.activityLogs || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webhookCols = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => (
          <span className="font-semibold uppercase">
            {row.original.provider}
          </span>
        ),
      },
      {
        accessorFn: (l) => (l.is_processed ? "Processed" : "Pending"),
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_processed ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
              Processed
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-[10px] font-semibold text-amber-700 hover:bg-amber-200">
              Pending
            </Badge>
          ),
      },
      {
        accessorFn: (l) => l.payload || "",
        id: "payload",
        header: "Payload",
        cell: ({ row }) => {
          let pretty = row.original.payload
          try {
            pretty = JSON.stringify(JSON.parse(row.original.payload), null, 2)
          } catch {}
          return (
            <pre className="max-h-24 max-w-md overflow-auto rounded bg-muted/60 p-2 font-mono text-[10px]">
              {pretty}
            </pre>
          )
        },
      },
      {
        accessorFn: (l) => l.error_message || "-",
        id: "error",
        header: "Error",
        cell: ({ row }) => (
          <span className="text-rose-600">
            {row.original.error_message || "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Date",
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activityCols = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "lead_id",
        header: "Lead ID",
        cell: ({ row }) => `Lead #${row.original.lead_id}`,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.action}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        accessorFn: (l) => l.created_at || "",
        id: "created_at",
        header: "Timestamp",
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
      <BreadcrumbBar parent="Logs" title="Webhook & Audit Logs" />

      <Tabs defaultValue="webhooks" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="webhooks" className="text-xs">
              Webhook Logs ({webhookLogs.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              Lead Activity Audit ({activityLogs.length})
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            onClick={load}
            className="text-xs font-medium"
          >
            <i className="ri-refresh-line mr-1" /> Refresh
          </Button>
        </div>

        <TabsContent value="webhooks">
          <Card className="gap-0 py-0 shadow-xs">
            <DataTable
              columns={webhookCols}
              data={webhookLogs}
              searchPlaceholder="Search webhook payloads..."
              emptyMessage="No webhook payloads logged yet. Trigger one from Facebook / Instagram / Google integration pages!"
            />
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="gap-0 py-0 shadow-xs">
            <DataTable
              columns={activityCols}
              data={activityLogs}
              searchPlaceholder="Search audit logs..."
              emptyMessage="No lead activity audit records found."
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
