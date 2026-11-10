"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { LeadCreateApiModal } from "@/components/crm/lead-create-api-modal"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

export default function RawLeadUploadsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploads, setUploads] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showApiModal, setShowApiModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [commBatch, setCommBatch] = React.useState<any>(null)
  const [commChannel, setCommChannel] = React.useState<
    "ivr" | "whatsapp" | "sms"
  >("ivr")
  const [commMessage, setCommMessage] = React.useState(
    "Hello {lead_name}, thank you for enquiring about admissions. Press 1 or reply YES to connect with a counsellor."
  )

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=uploads")
      .then((r) => r.json())
      .then((d) => setUploads(d.uploads || d.items || []))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    const rows = lines.slice(1).map((line) => {
      const [name, mobile, course, city, campaign, source] = line
        .split(",")
        .map((s) => s.trim())
      return { name, mobile, course, city, campaign, source }
    })
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "raw_data",
        action: "bulk_csv",
        file_name: file.name,
        rows,
      }),
    })
    const out = await res.json()
    if (res.ok) {
      toast.success(
        `Uploaded ${file.name}: ${out.valid} valid, ${out.duplicate || 0} duplicates!`
      )
      load()
    }
    e.target.value = ""
  }

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
        accessorKey: "file_name",
        header: "File",
        cell: ({ row }) => (
          <Link
            href={`/automation/raw-leads?upload_id=${row.original.id}`}
            className="font-semibold text-[#405189] hover:underline"
          >
            {row.original.file_name}
          </Link>
        ),
      },
      { accessorKey: "total_rows", header: "Total" },
      {
        accessorKey: "valid_rows",
        header: "Valid",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700">
            {row.original.valid_rows}
          </span>
        ),
      },
      { accessorKey: "duplicate_rows", header: "Duplicate" },
      {
        accessorKey: "failed_rows",
        header: "Failed",
        cell: ({ row }) => (
          <span className="text-rose-600">{row.original.failed_rows}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const st = String(row.original.status || "pending")
          return (
            <Badge
              className={`text-[10px] font-semibold uppercase ${
                st === "completed"
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : st === "processing"
                    ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
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
        accessorFn: (u) => u.created_at || "",
        id: "created_at",
        header: "Uploaded At",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="xs"
                    className="bg-[#405189] text-[11px] text-white hover:bg-[#364574]"
                  >
                    Action ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem asChild>
                    <Link href={`/automation/raw-leads?upload_id=${u.id}`}>
                      👁 View Data ({u.valid_rows})
                    </Link>
                  </DropdownMenuItem>
                  {u.status === "completed" && (
                    <DropdownMenuItem onClick={() => setCommBatch(u)}>
                      📩 Send Communication
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Raw Lead Uploads" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Raw Lead Uploads"
          columns={columns}
          data={uploads}
          loading={loading}
          searchPlaceholder="Search CSV batches..."
          emptyMessage="No uploads found."
          toolbarRight={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                size="sm"
                className="h-8 cursor-pointer bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                <label>
                  <i className="ri-upload-line mr-1" /> Upload File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const blob = new Blob(
                    [
                      "name,mobile,course,city,campaign,source\nRiya Sen,9871122334,MBA Marketing,Guwahati,Admission 2026,Facebook\nAditya Roy,9872233445,B.Tech CSE,Delhi,Admission 2026,Google\n",
                    ],
                    { type: "text/csv" }
                  )
                  const a = document.createElement("a")
                  a.href = URL.createObjectURL(blob)
                  a.download = "raw_leads_sample.csv"
                  a.click()
                }}
                className="h-8 bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2389c2]"
              >
                <i className="ri-download-line mr-1" /> Download Sample CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowApiModal(true)}
                className="h-8 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <i className="ri-code-line mr-1" /> Lead API Tester
              </Button>
            </div>
          }
        />
      </Card>

      {/* Send Communication Modal for Completed Batch */}
      <Dialog
        open={Boolean(commBatch)}
        onOpenChange={(o) => !o && setCommBatch(null)}
      >
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              📩 Send Batch Communication — #{commBatch?.id} (
              {commBatch?.file_name})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Trigger automated verification outreach for all{" "}
              {commBatch?.valid_rows} valid raw leads in this upload batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Channel</Label>
              <FormSelect
                value={commChannel}
                onChange={(e) =>
                  setCommChannel(e.target.value as "ivr" | "whatsapp" | "sms")
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="ivr">Outbound IVR Call Verification</option>
                <option value="whatsapp">WhatsApp Broadcast</option>
                <option value="sms">DLT SMS Broadcast</option>
              </FormSelect>
            </div>
            {commChannel !== "ivr" && (
              <div>
                <Label className="mb-1 block text-xs">Message Template</Label>
                <Textarea
                  rows={3}
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommBatch(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "raw_data",
                    action: "send_batch_comm",
                    upload_id: commBatch.id,
                    channel: commChannel,
                    message: commMessage,
                  }),
                })
                const out = await res.json()
                if (res.ok) {
                  toast.success(
                    `Dispatched ${commChannel.toUpperCase()} to ${out.count} raw leads!`
                  )
                  setCommBatch(null)
                }
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full 17-Field Lead Create API (Test & Documentation) Modal */}
      <LeadCreateApiModal
        open={showApiModal}
        onOpenChange={setShowApiModal}
        onLeadCreated={load}
      />
    </div>
  )
}
