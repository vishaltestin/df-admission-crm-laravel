"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { FormSelect } from "@/components/ui/form-select"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export default function DesignationsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewDesig, setViewDesig] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    organization_id: "1",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/uac?entity=designations")
      const d = await r.json()
      setItems(d.items || [])
      setOrganizations(d.organizations || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openEdit = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      setEditing(d)
      setForm({
        name: d.name || "",
        organization_id: String(d.organization || 1),
        status: String(d.status ?? 1),
      })
      setShowModal(true)
    },
    []
  )

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/uac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "designations",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
      }),
    })
    if (!res.ok) {
      toast.error("Failed to save designation")
      return
    }
    toast.success(editing ? "Designation updated" : "Designation created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    confirmDelete({
      title: `Delete ${selectedIds.length} Selected Designation(s)?`,
      description: `Are you sure you want to permanently delete ${selectedIds.length} selected designation(s)? This cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch("/api/uac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "designations",
            action: "bulk_delete",
            ids: selectedIds,
          }),
        })
        if (res.ok) {
          toast.success(`${selectedIds.length} designation(s) deleted`)
          setSelectedIds([])
          load()
        } else {
          toast.error("Bulk delete failed")
        }
      },
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: () => (
          <Checkbox
            checked={items.length > 0 && selectedIds.length === items.length}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? items.map((d) => Number(d.id)) : [])
            }
            aria-label="Select all designations"
          />
        ),
        cell: ({ row }) => {
          const id = Number(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(checked) =>
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
              aria-label={`Select ${row.original.name}`}
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "Designation Name",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setViewDesig(row.original)}
            className="text-left font-semibold text-foreground hover:text-[#405189] hover:underline"
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: "organization_name",
        header: "Organization",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.organization_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "users_count",
        header: "Assigned Staff",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px]">
            {row.original.users_count ?? 0} Users
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              Number(row.original.status ?? 1) === 1
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-700"
            }
          >
            {Number(row.original.status ?? 1) === 1 ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const d = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setViewDesig(d)}
                className="border-[#299cdb]/40 text-[11px] text-[#299cdb] hover:bg-[#299cdb]/10"
              >
                View
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openEdit(d)}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Designation?",
                    description: `Are you sure you want to permanently delete designation "${d.name}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      const res = await fetch("/api/uac", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entity: "designations",
                          action: "delete",
                          id: d.id,
                        }),
                      })
                      if (res.ok) {
                        toast.success("Designation deleted")
                        load()
                      } else {
                        toast.error("Failed to delete designation")
                      }
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
    [items, selectedIds, load, openEdit, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Designations" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`Staff Designations (${items.length})`}
          columns={columns}
          data={items}
          loading={loading}
          searchPlaceholder="Search designations or organization..."
          emptyMessage="No designations added yet."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-line mr-1" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    organization_id: organizations[0]
                      ? String(organizations[0].id)
                      : "1",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add Designation
              </Button>
            </div>
          }
        />
      </Card>

      {/* View Designation Offcanvas Sheet */}
      <Sheet
        open={Boolean(viewDesig)}
        onOpenChange={(o) => {
          if (!o) setViewDesig(null)
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <i className="ri-shield-star-line text-[#405189]" />
              <span>Designation Details</span>
            </SheetTitle>
            <SheetDescription>
              Full designation record and assigned staff members.
            </SheetDescription>
          </SheetHeader>

          {viewDesig && (
            <div className="space-y-4 p-4 text-xs">
              <div className="divide-y divide-border rounded-lg border border-border">
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">ID</span>
                  <span className="col-span-2 font-mono">#{viewDesig.id}</span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Name</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {viewDesig.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Organization</span>
                  <span className="col-span-2 font-medium text-foreground">
                    {viewDesig.organization_name || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Status</span>
                  <span className="col-span-2">
                    <Badge
                      className={
                        Number(viewDesig.status ?? 1) === 1
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {Number(viewDesig.status ?? 1) === 1
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Created Date</span>
                  <span className="col-span-2 text-muted-foreground">
                    {viewDesig.created_at
                      ? new Date(viewDesig.created_at).toLocaleString("en-IN")
                      : "-"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  Assigned Staff ({(viewDesig.assigned_users || []).length})
                </h4>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {(viewDesig.assigned_users || []).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-[#405189]/12 text-[11px] font-bold text-[#405189]">
                            {(u.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/user/${u.id}`}
                              className="font-semibold text-foreground hover:text-[#405189] hover:underline"
                            >
                              {u.name}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {u.email}
                            </div>
                          </div>
                        </div>
                        <Button asChild size="xs" variant="ghost">
                          <Link href={`/user/${u.id}`}>View</Link>
                        </Button>
                      </div>
                    )
                  )}
                  {(viewDesig.assigned_users || []).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No staff members currently assigned to this designation.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const item = viewDesig
                    setViewDesig(null)
                    openEdit(item)
                  }}
                >
                  Edit Designation
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewDesig(null)}
                  className="bg-[#405189] text-white hover:bg-[#364574]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Designation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
            <DialogDescription>
              Define staff title and organization mapping.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            <div>
              <Label className="mb-1 block text-xs">
                Designation Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Senior Admissions Counselor"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">
                Organization <span className="text-rose-500">*</span>
              </Label>
              <FormSelect
                value={form.organization_id}
                onValueChange={(v) => setForm({ ...form, organization_id: v })}
                options={organizations.map((o) => ({
                  value: String(o.id),
                  label: o.name,
                }))}
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
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Designation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
