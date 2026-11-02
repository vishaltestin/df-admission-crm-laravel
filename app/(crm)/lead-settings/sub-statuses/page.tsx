"use client"

import * as React from "react"
import Link from "next/link"
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

export default function LeadSubStatusesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statuses, setStatuses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [parentFilter, setParentFilter] = React.useState<string>("all")

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    status_id: "",
    name: "",
    sort_order: "1",
    is_active: true,
  })

  const load = React.useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/crm-resources?resource=statuses").then((r) => r.json()),
      fetch("/api/crm-resources?resource=sub_statuses").then((r) => r.json()),
    ])
    setStatuses(r1.items || [])
    setItems(r2.items || [])
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const statusMap = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: Record<string, any> = {}
    for (const st of statuses) m[String(st.id)] = st
    return m
  }, [statuses])

  const filteredItems = items.filter(
    (s) => parentFilter === "all" || String(s.status_id) === parentFilter
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
        accessorFn: (s) => statusMap[String(s.status_id)]?.name || "",
        id: "parent_status",
        header: "Parent Main Status",
        cell: ({ row }) => {
          const st = statusMap[String(row.original.status_id)]
          return st ? (
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: st.color || "#405189" }}
              />
              {st.name}
            </span>
          ) : (
            <span>Status #{row.original.status_id}</span>
          )
        },
      },
      {
        accessorKey: "name",
        header: "Dependent Sub-Status",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorFn: (s) => Number(s.sort_order ?? 1),
        id: "sort_order",
        header: "Sort Order",
      },
      {
        id: "state",
        header: "State",
        cell: ({ row }) =>
          row.original.is_active !== false &&
          Number(row.original.is_active ?? 1) !== 0 ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Inactive
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(s)
                  setForm({
                    status_id: String(s.status_id),
                    name: s.name || "",
                    sort_order: String(s.sort_order ?? 1),
                    is_active: Boolean(s.is_active ?? true),
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
                      resource: "sub_statuses",
                      action: "delete",
                      id: s.id,
                    }),
                  })
                  toast.success("Sub-status deleted")
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
    [statusMap, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="Lead Settings" title="Lead Sub-Statuses" />

      {/* Parent Status Filter Pills */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setParentFilter("all")}
          className={`rounded-full px-3 py-1 font-semibold transition ${
            parentFilter === "all"
              ? "bg-[#405189] text-white"
              : "border border-border bg-background hover:bg-muted"
          }`}
        >
          All Parent Statuses ({items.length})
        </button>
        {statuses.map((st) => {
          const sid = String(st.id)
          const count = items.filter((i) => String(i.status_id) === sid).length
          return (
            <button
              key={sid}
              type="button"
              onClick={() => setParentFilter(sid)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                parentFilter === sid
                  ? "bg-[#405189] text-white"
                  : "border border-border bg-background hover:bg-muted"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: st.color || "#405189" }}
              />
              <span>
                {st.name} ({count})
              </span>
            </button>
          )
        })}
      </div>

      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Dependent Sub-Statuses (${filteredItems.length})`}
          columns={columns}
          data={filteredItems}
          searchPlaceholder="Search sub-status or parent status..."
          toolbarRight={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/lead-settings/statuses">
                  ← Hierarchy View
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    status_id:
                      parentFilter !== "all"
                        ? parentFilter
                        : statuses[0]
                          ? String(statuses[0].id)
                          : "",
                    name: "",
                    sort_order: "1",
                    is_active: true,
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Sub-Status
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Sub-Status" : "Add Dependent Sub-Status"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select the Parent Main Status and configure the disposition label.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "sub_statuses",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Sub-status updated!" : "Sub-status created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Parent Main Status *</Label>
              <select
                required
                value={form.status_id}
                onChange={(e) =>
                  setForm({ ...form, status_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Sub-Status Name *</Label>
              <Input
                required
                placeholder="e.g. Callback Requested"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">State</Label>
                <select
                  value={form.is_active ? "1" : "0"}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.value === "1" })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
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
                Save Sub-Status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
