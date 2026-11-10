"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { FormSelect } from "@/components/ui/form-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
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

function toLocalInput(dt?: string | null): string {
  if (!dt) return ""
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default function CouponsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coupons, setCoupons] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    creation_mode: "single",
    bulk_count: "10",
    code: "",
    name: "",
    type: "flat",
    value: "5000",
    min_amount: "0",
    max_discount: "",
    usage_type: "multiple",
    usage_limit: "50",
    start_at: "",
    end_at: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/crm-resources?resource=coupons")
      const d = await r.json()
      setCoupons(d.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-[#405189]">
              {row.original.code}
            </span>
            {row.original.name && (
              <div className="text-[11px] text-muted-foreground">
                {row.original.name}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.type}</span>
        ),
      },
      {
        accessorFn: (c) => Number(c.value || 0),
        id: "value",
        header: "Discount",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {row.original.type === "percent"
              ? `${row.original.value}%`
              : `₹${Number(row.original.value || 0).toLocaleString("en-IN")}`}
          </span>
        ),
      },
      {
        accessorFn: (c) => Number(c.min_amount || 0),
        id: "min_amount",
        header: "Min Order",
        cell: ({ row }) => (
          <span>
            ₹{Number(row.original.min_amount || 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "usage_type",
        header: "Usage",
        cell: ({ row }) => (
          <span>
            {row.original.used_count || 0} / {row.original.usage_limit || "∞"} (
            {row.original.usage_type})
          </span>
        ),
      },
      {
        id: "valid_window",
        header: "Valid (Start → End)",
        cell: ({ row }) => {
          const s = row.original.start_at
            ? new Date(row.original.start_at).toLocaleDateString("en-IN")
            : "Immediate"
          const e = row.original.end_at
            ? new Date(row.original.end_at).toLocaleDateString("en-IN")
            : "No Expiry"
          return (
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {s} → {e}
            </span>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`text-[10px] font-semibold ${
              Number(row.original.status ?? 1) === 1
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {Number(row.original.status ?? 1) === 1 ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(c)
                  setForm({
                    creation_mode: "single",
                    bulk_count: "1",
                    code: c.code || "",
                    name: c.name || "",
                    type: c.type || "flat",
                    value: String(c.value ?? 0),
                    min_amount: String(c.min_amount ?? 0),
                    max_discount: c.max_discount ? String(c.max_discount) : "",
                    usage_type: c.usage_type || "multiple",
                    usage_limit: c.usage_limit ? String(c.usage_limit) : "",
                    start_at: toLocalInput(c.start_at),
                    end_at: toLocalInput(c.end_at),
                    status: String(c.status ?? 1),
                  })
                  setShowModal(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                asChild
                size="xs"
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2387be]"
              >
                <Link href={`/coupons/${c.id}/usage`}>Logs</Link>
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Coupon?",
                    description: `Are you sure you want to permanently delete coupon "${
                      c.code || c.name
                    }"? This action cannot be undone.`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "coupons",
                          action: "delete",
                          id: c.id,
                        }),
                      })
                      toast.success("Coupon deleted")
                      load()
                    },
                  })
                }
                className="text-[11px]"
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [load, confirmDelete]
  )

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "coupons",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
      }),
    })
    if (!res.ok) {
      toast.error("Failed to save coupon")
      return
    }
    toast.success(editing ? "Coupon updated" : "Coupon(s) created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  return (
    <div>
      <BreadcrumbBar parent="Marketing" title="Coupons" />

      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`Discount & Fee Waiver Coupons (${coupons.length})`}
          columns={columns}
          data={coupons}
          loading={loading}
          searchPlaceholder="Search coupon code or name..."
          emptyMessage="No coupons created yet."
          toolbarRight={
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 text-xs"
              >
                <Link href="/coupons/create">Full Page Form</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    creation_mode: "single",
                    bulk_count: "10",
                    code: "",
                    name: "",
                    type: "flat",
                    value: "5000",
                    min_amount: "0",
                    max_discount: "",
                    usage_type: "multiple",
                    usage_limit: "50",
                    start_at: "",
                    end_at: "",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Create Coupon
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
            <DialogDescription>
              Configure single or bulk scholarship / fee-waiver coupon codes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {!editing && (
                <div>
                  <Label className="mb-1 block text-xs">Creation Mode</Label>
                  <FormSelect
                    value={form.creation_mode}
                    onValueChange={(v) =>
                      setForm({ ...form, creation_mode: v })
                    }
                    options={[
                      { value: "single", label: "Single Coupon" },
                      { value: "bulk", label: "Bulk Coupons" },
                    ]}
                  />
                </div>
              )}

              {!editing && form.creation_mode === "bulk" ? (
                <div>
                  <Label className="mb-1 block text-xs">
                    Number of Coupons <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    required
                    value={form.bulk_count}
                    onChange={(e) =>
                      setForm({ ...form, bulk_count: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div>
                  <Label className="mb-1 block text-xs">
                    Coupon Code <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    placeholder="e.g. SCHOLAR50"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    className="font-mono uppercase"
                  />
                </div>
              )}

              <div className={editing ? "" : "sm:col-span-2"}>
                <Label className="mb-1 block text-xs">
                  Coupon Name (Optional)
                </Label>
                <Input
                  placeholder="e.g. Merit Scholarship 2026 / Early Bird Waiver"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Discount Type</Label>
                <FormSelect
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                  options={[
                    { value: "flat", label: "Flat Amount (₹)" },
                    { value: "percent", label: "Percentage (%)" },
                  ]}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Discount Value <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Minimum Order Amount (₹)
                </Label>
                <Input
                  type="number"
                  value={form.min_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Max Discount (₹, Optional)
                </Label>
                <Input
                  type="number"
                  placeholder="Optional cap"
                  value={form.max_discount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Usage Type</Label>
                <FormSelect
                  value={form.usage_type}
                  onValueChange={(v) => setForm({ ...form, usage_type: v })}
                  options={[
                    { value: "single", label: "Single Use" },
                    { value: "multiple", label: "Multiple Use" },
                  ]}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Usage Limit</Label>
                <Input
                  type="number"
                  disabled={form.usage_type === "single"}
                  value={form.usage_type === "single" ? "1" : form.usage_limit}
                  onChange={(e) =>
                    setForm({ ...form, usage_limit: e.target.value })
                  }
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Start Date & Time</Label>
                <DateTimePicker
                  value={form.start_at}
                  onChange={(v) => setForm({ ...form, start_at: v })}
                  placeholder="Immediate (optional)"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">End Date & Time</Label>
                <DateTimePicker
                  value={form.end_at}
                  onChange={(v) => setForm({ ...form, end_at: v })}
                  placeholder="No expiry (optional)"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <FormSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                {editing ? "Update Coupon" : "Save Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
