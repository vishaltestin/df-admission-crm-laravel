"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function RawLeadUploadsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [uploads, setUploads] = React.useState<any[]>([])
  const [showApiModal, setShowApiModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [commBatch, setCommBatch] = React.useState<any>(null)
  const [commChannel, setCommChannel] = React.useState<"ivr" | "whatsapp" | "sms">("ivr")
  const [commMessage, setCommMessage] = React.useState(
    "Hello {lead_name}, thank you for enquiring about admissions. Press 1 or reply YES to connect with a counsellor."
  )
  const [apiPayload, setApiPayload] = React.useState({
    name: "Karan Malhotra",
    mobile: "9811998877",
    email: "karan.m@student.in",
    city: "Delhi",
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=raw_data&sub=uploads")
      .then((r) => r.json())
      .then((d) => setUploads(d.uploads || d.items || []))
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
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "file_name",
        header: "File Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.file_name}</span>
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
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-slate-100 text-slate-700"
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
        header: "Created At",
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
              <Button
                asChild
                size="xs"
                variant="outline"
                className="text-[11px]"
              >
                <Link href={`/automation/raw-leads?upload_id=${u.id}`}>
                  👁 View Data
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="xs"
                    className="bg-[#405189] text-[11px] text-white hover:bg-[#364574]"
                  >
                    Actions ▾
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs">
                  <DropdownMenuItem asChild>
                    <Link href={`/automation/raw-leads?upload_id=${u.id}`}>
                      👁 View Raw Leads ({u.valid_rows})
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
          title="Raw Lead Upload Batches"
          columns={columns}
          data={uploads}
          searchPlaceholder="Search CSV batches..."
          emptyMessage="No CSV upload batches yet. Download the sample CSV above and upload!"
          toolbarRight={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                asChild
                size="sm"
                className="h-8 cursor-pointer bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                <label>
                  <i className="ri-upload-line mr-1" /> Upload CSV
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
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                <i className="ri-download-line mr-1" /> Download Sample CSV
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowApiModal(true)}
                className="h-8 bg-slate-800 text-xs font-semibold text-white hover:bg-slate-900"
              >
                <i className="ri-code-line mr-1" /> Lead API
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
              📩 Send Batch Communication — #{commBatch?.id} ({commBatch?.file_name})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Trigger automated verification outreach for all {commBatch?.valid_rows} valid raw leads in this upload batch.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Channel</Label>
              <select
                value={commChannel}
                onChange={(e) =>
                  setCommChannel(e.target.value as "ivr" | "whatsapp" | "sms")
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="ivr">Outbound IVR Call Verification</option>
                <option value="whatsapp">WhatsApp Broadcast</option>
                <option value="sms">DLT SMS Broadcast</option>
              </select>
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

      {/* Lead Create API Documentation & Tester Modal */}
      <Dialog open={showApiModal} onOpenChange={setShowApiModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Lead Create API (Live Documentation & Tester)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send a live test payload to POST /api/leads/add.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 rounded-md bg-muted/60 p-3">
            <div>
              <strong>Method:</strong>{" "}
              <Badge className="bg-slate-800 font-mono text-[10px] text-white">
                POST
              </Badge>
            </div>
            <div>
              <strong>Endpoint:</strong> <code>/api/leads/add</code>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              value={apiPayload.name}
              onChange={(e) =>
                setApiPayload({ ...apiPayload, name: e.target.value })
              }
              placeholder="name"
              className="h-8 text-xs"
            />
            <Input
              value={apiPayload.mobile}
              onChange={(e) =>
                setApiPayload({ ...apiPayload, mobile: e.target.value })
              }
              placeholder="mobile *"
              className="h-8 text-xs"
            />
            <Input
              value={apiPayload.email}
              onChange={(e) =>
                setApiPayload({ ...apiPayload, email: e.target.value })
              }
              placeholder="email"
              className="h-8 text-xs"
            />
            <Input
              value={apiPayload.city}
              onChange={(e) =>
                setApiPayload({ ...apiPayload, city: e.target.value })
              }
              placeholder="city"
              className="h-8 text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiModal(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                const r = await fetch("/api/leads/add", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(apiPayload),
                })
                if (r.ok) {
                  toast.success("Lead created via /api/leads/add!")
                  setShowApiModal(false)
                }
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Send Test API Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
