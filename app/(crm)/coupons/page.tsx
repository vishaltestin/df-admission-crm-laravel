"use client"

import * as React from "react"
import { toast } from "sonner"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coupons, setCoupons] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    creation_mode: "single",
    bulk_count: "10",
    code: "",
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

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=coupons")
      .then((r) => r.json())
      .then((d) => setCoupons(d.items || []))
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
          <span className="font-mono font-bold text-[#405189]">
            {row.original.code}
          </span>
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
          <span className="font-semibold text-emerald-700">
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
                size="xs"
                variant="destructive"
                onClick={async () => {
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
                }}
                className="text-[11px]"
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [load]
  )

  return (
    <div>
      <BreadcrumbBar parent="Coupons" title="Manage Coupons" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Scholarship & Fee Discount Coupons"
          columns={columns}
          data={coupons}
          searchPlaceholder="Search coupon code..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  creation_mode: "single",
                  bulk_count: "10",
                  code: "",
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
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Create Coupon
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Coupon — ${editing.code}` : "Create Coupon"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure discount rules, minimum order, start/end validity dates, and single or bulk generation.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
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
              const out = await res.json()
              if (res.ok) {
                toast.success(
                  editing
                    ? "Coupon updated!"
                    : form.creation_mode === "bulk"
                      ? `Generated ${out.created} bulk coupons!`
                      : "Coupon created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            {!editing && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">Creation Mode</Label>
                  <select
                    value={form.creation_mode}
                    onChange={(e) =>
                      setForm({ ...form, creation_mode: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="single">Single Coupon</option>
                    <option value="bulk">Bulk Generate</option>
                  </select>
                </div>
                {form.creation_mode === "bulk" ? (
                  <div>
                    <Label className="mb-1 block text-xs">
                      Number of Coupons *
                    </Label>
                    <Input
                      type="number"
                      min={2}
                      max={100}
                      required
                      value={form.bulk_count}
                      onChange={(e) =>
                        setForm({ ...form, bulk_count: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="mb-1 block text-xs">Coupon Code *</Label>
                    <Input
                      required
                      placeholder="MERIT2026"
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value.toUpperCase() })
                      }
                      className="h-9 font-mono uppercase text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {(editing || form.creation_mode === "bulk") && (
              <div>
                <Label className="mb-1 block text-xs">
                  {editing ? "Coupon Code *" : "Code Prefix (Optional)"}
                </Label>
                <Input
                  required={Boolean(editing)}
                  placeholder="SCHOLAR"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="h-9 font-mono uppercase text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="mb-1 block text-xs">Discount Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="flat">Flat (₹)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Value *</Label>
                <Input
                  type="number"
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Min Order (₹)</Label>
                <Input
                  type="number"
                  value={form.min_amount}
                  onChange={(e) =>
                    setForm({ ...form, min_amount: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Max Discount</Label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={form.max_discount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Usage Type</Label>
                <select
                  value={form.usage_type}
                  onChange={(e) =>
                    setForm({ ...form, usage_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="single">Single Use</option>
                  <option value="multiple">Multiple Use</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Usage Limit</Label>
                <Input
                  type="number"
                  disabled={form.usage_type === "single"}
                  value={
                    form.usage_type === "single" ? "1" : form.usage_limit
                  }
                  onChange={(e) =>
                    setForm({ ...form, usage_limit: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) =>
                    setForm({ ...form, start_at: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

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
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                {editing ? "Update Coupon" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
