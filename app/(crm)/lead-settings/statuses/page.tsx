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

export default function LeadStatusesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statuses, setStatuses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subStatuses, setSubStatuses] = React.useState<any[]>([])

  const [testParent, setTestParent] = React.useState<string>("")
  const [testSub, setTestSub] = React.useState<string>("")

  const [showStatusModal, setShowStatusModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingStatus, setEditingStatus] = React.useState<any>(null)
  const [statusForm, setStatusForm] = React.useState({
    name: "",
    color: "#405189",
    sort_order: "1",
    is_active: true,
  })

  const [showSubModal, setShowSubModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSub, setEditingSub] = React.useState<any>(null)
  const [subForm, setSubForm] = React.useState({
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
    const st = r1.items || []
    setStatuses(st)
    setSubStatuses(r2.items || [])
    if (!testParent && st[0]) setTestParent(String(st[0].id))
  }, [testParent])

  React.useEffect(() => {
    load()
  }, [load])

  const subsByParent = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: Record<string, any[]> = {}
    for (const sub of subStatuses) {
      const k = String(sub.status_id)
      if (!m[k]) m[k] = []
      m[k].push(sub)
    }
    return m
  }, [subStatuses])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (s) => Number(s.sort_order ?? 1),
        id: "sort_order",
        header: "Order",
        cell: ({ row }) => (
          <span className="font-mono font-bold">
            #{row.original.sort_order ?? 1}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "1. Main Lead Status (Stage)",
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: s.color || "#405189" }}
              />
              <span className="font-semibold text-foreground">{s.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ({s.slug})
              </span>
            </div>
          )
        },
      },
      {
        id: "sub_statuses",
        header: "2. Dependent Sub-Statuses (Call Dispositions)",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          const children = subsByParent[String(s.id)] || []
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {children.map((ch) => (
                <span
                  key={ch.id}
                  onClick={() => {
                    setEditingSub(ch)
                    setSubForm({
                      status_id: String(ch.status_id),
                      name: ch.name || "",
                      sort_order: String(ch.sort_order ?? 1),
                      is_active: Boolean(ch.is_active ?? true),
                    })
                    setShowSubModal(true)
                  }}
                  title="Click to edit sub-status"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium hover:border-[#405189] hover:bg-[#405189]/10"
                >
                  <span>{ch.name}</span>
                  <i className="ri-pencil-line text-[10px] text-muted-foreground" />
                </span>
              ))}
              <button
                type="button"
                onClick={() => {
                  setEditingSub(null)
                  setSubForm({
                    status_id: String(s.id),
                    name: "",
                    sort_order: String(children.length + 1),
                    is_active: true,
                  })
                  setShowSubModal(true)
                }}
                className="rounded-full border border-dashed border-[#0ab39c] px-2.5 py-0.5 text-[11px] font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/10"
              >
                + Sub-Status
              </button>
            </div>
          )
        },
      },
      {
        id: "status",
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
                  setEditingStatus(s)
                  setStatusForm({
                    name: s.name || "",
                    color: s.color || "#405189",
                    sort_order: String(s.sort_order ?? 1),
                    is_active: Boolean(s.is_active ?? true),
                  })
                  setShowStatusModal(true)
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
                      resource: "statuses",
                      action: "delete",
                      id: s.id,
                    }),
                  })
                  toast.success("Lead status deleted")
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
    [subsByParent, load]
  )

  const previewSubs = subsByParent[testParent] || []

  return (
    <div>
      <BreadcrumbBar
        parent="Lead Settings"
        title="Lead Status & Dependent Dispositions"
      />

      {/* Interactive Counselor Preview Banner so hierarchy is 100% clear */}
      <Card className="mb-4 p-4 text-xs shadow-xs">
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h4 className="text-sm font-bold text-[#405189]">
              How Lead Status → Sub-Status Works
            </h4>
            <p className="mt-0.5 leading-relaxed text-muted-foreground">
              When a counsellor updates a student lead, they first pick a{" "}
              <strong>1. Main Lead Status</strong> (e.g., <em>Connected</em> or{" "}
              <em>Not Connected</em>) and then choose one of its{" "}
              <strong>2. Dependent Sub-Statuses</strong> (e.g.,{" "}
              <em>Callback Requested</em>, <em>Ringing</em>, <em>Busy</em>).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/30 p-3 sm:grid-cols-2 lg:col-span-6">
            <div>
              <Label className="mb-1 block text-[11px] font-semibold">
                Test: 1. Main Status
              </Label>
              <select
                value={testParent}
                onChange={(e) => {
                  setTestParent(e.target.value)
                  setTestSub("")
                }}
                className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
              >
                {statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-[11px] font-semibold">
                Test: 2. Dependent Sub-Status ({previewSubs.length})
              </Label>
              <select
                value={testSub}
                onChange={(e) => setTestSub(e.target.value)}
                className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
              >
                <option value="">-- Select Disposition --</option>
                {previewSubs.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Lead Status Hierarchy (${statuses.length} Main Stages • ${subStatuses.length} Sub-Statuses)`}
          columns={columns}
          data={statuses}
          searchPlaceholder="Search lead status..."
          toolbarRight={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/lead-settings/sub-statuses">
                  All Sub-Statuses Table
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingStatus(null)
                  setStatusForm({
                    name: "",
                    color: "#0ab39c",
                    sort_order: String(statuses.length + 1),
                    is_active: true,
                  })
                  setShowStatusModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Main Status
              </Button>
            </div>
          }
        />
      </Card>

      {/* Main Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingStatus ? "Edit Main Lead Status" : "Add Main Lead Status"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure stage name, badge color swatch, sort order, and active state.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "statuses",
                  action: editingStatus ? "update" : "create",
                  id: editingStatus?.id,
                  ...statusForm,
                }),
              })
              if (res.ok) {
                toast.success(
                  editingStatus ? "Lead status updated!" : "Lead status created!"
                )
                setShowStatusModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Main Status Name *</Label>
              <Input
                required
                placeholder="e.g. Counselling Scheduled"
                value={statusForm.name}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, name: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Badge Color</Label>
                <input
                  type="color"
                  value={statusForm.color}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, color: e.target.value })
                  }
                  className="h-9 w-full cursor-pointer rounded border border-input p-0.5"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={statusForm.sort_order}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      sort_order: e.target.value,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">State</Label>
                <select
                  value={statusForm.is_active ? "1" : "0"}
                  onChange={(e) =>
                    setStatusForm({
                      ...statusForm,
                      is_active: e.target.value === "1",
                    })
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
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub-Status Inline Modal */}
      <Dialog open={showSubModal} onOpenChange={setShowSubModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingSub ? "Edit Dependent Sub-Status" : "Add Dependent Sub-Status"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach or update a disposition option under a Main Lead Status.
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
                  action: editingSub ? "update" : "create",
                  id: editingSub?.id,
                  ...subForm,
                }),
              })
              if (res.ok) {
                toast.success(
                  editingSub ? "Sub-status updated!" : "Sub-status added!"
                )
                setShowSubModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Parent Main Status *</Label>
              <select
                required
                value={subForm.status_id}
                onChange={(e) =>
                  setSubForm({ ...subForm, status_id: e.target.value })
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
                placeholder="e.g. Callback Requested / Brochure Sent"
                value={subForm.name}
                onChange={(e) =>
                  setSubForm({ ...subForm, name: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={subForm.sort_order}
                  onChange={(e) =>
                    setSubForm({ ...subForm, sort_order: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">State</Label>
                <select
                  value={subForm.is_active ? "1" : "0"}
                  onChange={(e) =>
                    setSubForm({
                      ...subForm,
                      is_active: e.target.value === "1",
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {editingSub ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    await fetch("/api/crm-resources", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource: "sub_statuses",
                        action: "delete",
                        id: editingSub.id,
                      }),
                    })
                    toast.success("Sub-status deleted")
                    setShowSubModal(false)
                    load()
                  }}
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSubModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                >
                  Save Sub-Status
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
