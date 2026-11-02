"use client"

import * as React from "react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CommunicationReportPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = React.useState<any[]>([])
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [channel, setChannel] = React.useState("")
  const [status, setStatus] = React.useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewLog, setViewLog] = React.useState<any>(null)

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=reports")
      .then((r) => r.json())
      .then((d) => setLogs(d.comms || d.commLogs || []))
  }, [])

  const filtered = React.useMemo(
    () =>
      logs.filter((l) => {
        if (channel && l.channel !== channel) return false
        if (status && l.status !== status) return false
        if (from && l.created_at && new Date(l.created_at) < new Date(from))
          return false
        if (
          to &&
          l.created_at &&
          new Date(l.created_at) > new Date(`${to}T23:59:59`)
        )
          return false
        return true
      }),
    [logs, channel, status, from, to]
  )

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
      {
        accessorKey: "channel",
        header: "Channel",
        cell: ({ row }) => (
          <Badge className="bg-[#299cdb]/15 text-[10px] font-bold uppercase text-[#299cdb] hover:bg-[#299cdb]/25">
            {row.original.channel}
          </Badge>
        ),
      },
      {
        accessorFn: (l) => l.to || l.recipient || l.mobile || "-",
        id: "recipient",
        header: "Recipient",
        cell: ({ row }) => (
          <span className="font-mono">
            {row.original.to ||
              row.original.recipient ||
              row.original.mobile ||
              "-"}
          </span>
        ),
      },
      {
        accessorFn: (l) => l.content || l.message || l.subject || "",
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <Button
            size="xs"
            variant="outline"
            onClick={() => setViewLog(row.original)}
            className="border-[#405189] text-[11px] font-medium text-[#405189] hover:bg-[#405189] hover:text-white"
          >
            View
          </Button>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`text-[10px] font-semibold uppercase ${
              row.original.status === "sent"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : row.original.status === "failed"
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {row.original.status}
          </Badge>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="Reports" title="Communication Report" />
      <Card className="mb-4 p-4 shadow-xs text-xs">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="mb-1 block text-xs">From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Channel</Label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
            >
              <option value="">All</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="call">IVR / Call</option>
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFrom("")
                setTo("")
                setChannel("")
                setStatus("")
              }}
              className="h-9 flex-1 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`Communications (${filtered.length})`}
          columns={columns}
          data={filtered}
          searchPlaceholder="Search recipient or message..."
          emptyMessage="No communication logs found for the selected filter criteria."
        />
      </Card>

      <Dialog
        open={Boolean(viewLog)}
        onOpenChange={(open) => !open && setViewLog(null)}
      >
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase">
              {viewLog?.channel} Message Payload
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recipient:{" "}
              <strong>{viewLog?.to || viewLog?.recipient || "-"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted/60 p-3 whitespace-pre-wrap">
            {viewLog?.content ||
              viewLog?.message ||
              viewLog?.subject ||
              "(No message body)"}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setViewLog(null)}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
