"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
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

export default function DesignationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = React.useState<any[]>([])
  const [selected, setSelected] = React.useState<number[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    organization_id: "1",
    status: "1",
  })

  const load = React.useCallback(() => {
    fetch("/api/uac?resource=designations")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.designations || d.items || [])
        setOrganizations(d.organizations || [])
        setSelected([])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <Checkbox
            checked={items.length > 0 && selected.length === items.length}
            onCheckedChange={(v) =>
              setSelected(v ? items.map((d) => Number(d.id)) : [])
            }
          />
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const id = Number(row.original.id)
          return (
            <Checkbox
              checked={selected.includes(id)}
              onCheckedChange={(v) =>
                setSelected((prev) =>
                  v ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
            />
          )
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Designation Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorFn: (d) => d.organization_name || `Org #${d.organization_id}`,
        id: "organization_name",
        header: "Organization",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.organization_name || `Org #${row.original.organization_id}`}
          </span>
        ),
      },
      {
        accessorFn: (d) => Number(d.status ?? 1),
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const active = Number(row.original.status ?? 1) === 1
          return (
            <Badge
              className={
                active
                  ? "bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200"
                  : "bg-slate-100 text-[10px] font-semibold text-slate-600 hover:bg-slate-200"
              }
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        accessorFn: (d) => d.created_at || "",
        id: "created_at",
        header: "Created At",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-IN")
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
                onClick={() => {
                  setEditing(d)
                  setForm({
                    name: d.name || "",
                    organization_id: String(d.organization_id || 1),
                    status: String(d.status ?? 1),
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
                  await fetch("/api/uac", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "designations",
                      action: "delete",
                      id: d.id,
                    }),
                  })
                  toast.success("Designation deleted")
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
    [items, selected, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="UAC" title="Designations" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Staff Designations (${items.length})`}
          columns={columns}
          data={items}
          searchPlaceholder="Search designations or organization..."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await fetch("/api/uac", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource: "designations",
                        action: "bulk_delete",
                        ids: selected,
                      }),
                    })
                    toast.success(`Deleted ${selected.length} designation(s)`)
                    load()
                  }}
                  className="h-8 text-xs"
                >
                  Delete Selected ({selected.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    organization_id: String(organizations[0]?.id || 1),
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Designation
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Designation" : "Add Designation"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure academic or admissions staff designation, organization, and active status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "designations",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Designation updated!" : "Designation created!"
                )
                setShowModal(false)
                load()
              } else {
                const err = await res.json().catch(() => ({}))
                toast.error(err.error || "Failed to save designation")
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Designation Title *</Label>
              <Input
                required
                placeholder="Senior Admission Counsellor"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Organization</Label>
                <select
                  value={form.organization_id}
                  onChange={(e) =>
                    setForm({ ...form, organization_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {organizations.map((o: any) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </select>
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
                {editing ? "Update Designation" : "Save Designation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
