"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { LeadCreateApiModal } from "@/components/crm/lead-create-api-modal"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

function RawLeadsQueueInner() {
  const searchParams = useSearchParams()
  const uploadId = searchParams.get("upload_id")
  const { confirmDelete, DeleteDialog } = useConfirmDelete()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [showModal, setShowModal] = React.useState(false)
  const [showApiModal, setShowApiModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    mobile: "",
    course: "",
    city: "",
    campaign: "",
    source: "Manual",
    status: "pending",
  })

  const load = React.useCallback(() => {
    const qs = uploadId ? `&upload_id=${encodeURIComponent(uploadId)}` : ""
    fetch(`/api/crm-resources?resource=raw_data&sub=raw_leads${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rawLeads || d.items || []))
      .finally(() => setLoading(false))
  }, [uploadId])

  React.useEffect(() => {
    load()
  }, [load])

  const allChecked = rows.length > 0 && selectedIds.length === rows.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? rows.map((r) => String(r.id)) : [])
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  async function handleBulkIvr() {
    if (selectedIds.length === 0) {
      toast.warning("Select at least one raw lead first")
      return
    }
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "raw_data",
        action: "bulk_send_ivr",
        ids: selectedIds,
      }),
    })
    const out = await res.json()
    if (res.ok) {
      toast.success(`Outbound IVR queued for ${out.count} selected leads!`)
      setSelectedIds([])
      load()
    }
  }

  function downloadSampleCsv() {
    const csv =
      "name,mobile,course,city,campaign,source\nRohan Verma,9811223344,MBA Finance,Delhi,Admission 2026,Facebook\nSneha Nair,9822334455,B.Tech CSE,Guwahati,Admission 2026,Google\n"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "raw_leads_sample.csv"
    a.click()
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    const parsed = lines.slice(1).map((line) => {
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
        rows: parsed,
      }),
    })
    const out = await res.json()
    if (res.ok) {
      toast.success(`Imported ${out.valid} raw leads into verification queue!`)
      load()
    }
    e.target.value = ""
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={(v) => toggleAll(Boolean(v))}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(v) => toggleOne(id, Boolean(v))}
              aria-label={`Select #${id}`}
            />
          )
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.id}</span>
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
      {
        accessorFn: (r) => r.course || "-",
        id: "course",
        header: "Course",
      },
      {
        accessorFn: (r) => r.city || "-",
        id: "city",
        header: "City",
      },
      {
        accessorFn: (r) => r.campaign || "-",
        id: "campaign",
        header: "Campaign",
      },
      {
        accessorFn: (r) => r.source || "-",
        id: "source",
        header: "Source",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`text-[10px] font-semibold uppercase ${
              row.original.status === "confirmed"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : row.original.status === "rejected" ||
                    row.original.status === "ivr_failed" ||
                    row.original.status === "failed"
                  ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                  : row.original.status === "ivr_sent" ||
                      row.original.status === "whatsapp_sent"
                    ? "bg-sky-100 text-sky-700 hover:bg-sky-200"
                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorFn: (r) => r.ivr_response || "-",
        id: "ivr_response",
        header: "IVR Response",
      },
      {
        id: "lead_created",
        header: "Lead Created",
        cell: ({ row }) =>
          row.original.lead_created_status ? (
            <Badge
              asChild
              className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200"
            >
              <Link href="/leads">Yes</Link>
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              No
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex justify-end gap-1 whitespace-nowrap">
              <Button
                size="xs"
                onClick={async () => {
                  await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "raw_data",
                      action: "send_ivr",
                      id: r.id,
                    }),
                  })
                  toast.success(`Outbound IVR triggered for ${r.mobile}`)
                  load()
                }}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Send IVR
              </Button>
              {!r.lead_created_status && (
                <Button
                  size="xs"
                  onClick={async () => {
                    const res = await fetch("/api/crm-resources", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource: "raw_data",
                        action: "convert_lead",
                        id: r.id,
                      }),
                    })
                    const out = await res.json()
                    if (res.ok) {
                      toast.success(`Converted to CRM Lead #${out.lead_id}!`)
                      load()
                    }
                  }}
                  className="bg-[#0ab39c] text-[11px] font-semibold text-white hover:bg-[#099885]"
                >
                  Convert
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                onClick={() => {
                  setEditing(r)
                  setForm({
                    name: r.name || "",
                    mobile: r.mobile || "",
                    course: r.course || "",
                    city: r.city || "",
                    campaign: r.campaign || "",
                    source: r.source || "",
                    status: r.status || "pending",
                  })
                  setShowModal(true)
                }}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Raw Lead?",
                    description: `Are you sure you want to permanently delete raw lead "${r.name || r.mobile}" (ID #${r.id})?`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "raw_data",
                          action: "delete_raw",
                          id: r.id,
                        }),
                      })
                      toast.success("Raw lead deleted")
                      load()
                    },
                  })
                }
                className="text-[11px]"
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChecked, selectedIds, load, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Raw Lead List" />

      {uploadId && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-[#299cdb]/30 bg-[#299cdb]/10 px-3 py-2 text-xs">
          <span>
            Showing raw leads filtered by{" "}
            <strong>Upload Batch #{uploadId}</strong> ({rows.length} rows)
          </span>
          <Button asChild size="xs" variant="outline">
            <Link href="/automation/raw-leads">Show All Raw Leads</Link>
          </Button>
        </div>
      )}

      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Raw Lead List (${rows.length})`}
          columns={columns}
          data={rows}
          loading={loading}
          searchPlaceholder="Search name, mobile, course, city..."
          emptyMessage="No raw leads found for this upload."
          toolbarRight={
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: `Delete ${selectedIds.length} Selected Raw Lead(s)?`,
                      description: `Are you sure you want to delete ${selectedIds.length} selected raw lead(s)? This action cannot be undone.`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "raw_data",
                            action: "bulk_delete_raw",
                            ids: selectedIds,
                          }),
                        })
                        toast.success(
                          `Deleted ${selectedIds.length} raw lead(s)`
                        )
                        setSelectedIds([])
                        load()
                      },
                    })
                  }
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-2-line mr-1" /> Delete (
                  {selectedIds.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleBulkIvr}
                className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                <i className="ri-phone-line mr-1" /> Send IVR for Selected
                {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 text-xs"
              >
                <Link href="/automation/raw-leads/uploads">Upload Batches</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={downloadSampleCsv}
                className="h-8 text-xs"
              >
                Sample CSV
              </Button>
              <Button
                asChild
                size="sm"
                className="h-8 cursor-pointer bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2389c2]"
              >
                <label>
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFile}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowApiModal(true)}
                className="h-8 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <i className="ri-code-line mr-1" /> Lead API Tester
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    mobile: "",
                    course: "",
                    city: "",
                    campaign: "",
                    source: "Manual",
                    status: "pending",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Raw Lead
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Raw Lead #${editing.id}` : "Add Raw Lead"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure raw prospect details for IVR / WhatsApp verification.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "raw_data",
                  action: editing ? "update_raw" : "create_raw",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Raw lead updated!" : "Raw lead added!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="mb-1 block text-xs">Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Mobile *</Label>
                <Input
                  required
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Course</Label>
                <Input
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Campaign</Label>
                <Input
                  value={form.campaign}
                  onChange={(e) =>
                    setForm({ ...form, campaign: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Source</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            {editing && (
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <FormSelect
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="pending">Pending</option>
                  <option value="whatsapp_sent">WhatsApp Sent</option>
                  <option value="ivr_sent">IVR Sent</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="ivr_failed">IVR Failed</option>
                </FormSelect>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LeadCreateApiModal
        open={showApiModal}
        onOpenChange={setShowApiModal}
        onLeadCreated={load}
      />

      {DeleteDialog}
    </div>
  )
}

export default function RawLeadsQueuePage() {
  return (
    <React.Suspense
      fallback={
        <Card className="space-y-3 p-4 shadow-xs">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      }
    >
      <RawLeadsQueueInner />
    </React.Suspense>
  )
}
