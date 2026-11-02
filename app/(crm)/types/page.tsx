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

export default function LeadMediumTypesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [selected, setSelected] = React.useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [showModal, setShowModal] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", status: "1" })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=types")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={items.length > 0 && selected.length === items.length}
            onCheckedChange={(checked) =>
              setSelected(checked ? items.map((x) => String(x.id)) : [])
            }
          />
        ),
        cell: ({ row }) => {
          const idStr = String(row.original.id)
          return (
            <Checkbox
              checked={selected.includes(idStr)}
              onCheckedChange={(checked) =>
                setSelected((prev) =>
                  checked ? [...prev, idStr] : prev.filter((x) => x !== idStr)
                )
              }
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "Medium Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorFn: (t) => (Number(t.status) === 1 ? "Active" : "Inactive"),
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          Number(row.original.status) === 1 ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
              Active
            </Badge>
          ) : (
            <Badge className="bg-rose-100 text-[10px] font-semibold text-rose-700 hover:bg-rose-200">
              Inactive
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  setEditing(t)
                  setForm({
                    name: t.name || "",
                    status: String(t.status ?? 1),
                  })
                  setShowModal(true)
                }}
                className="bg-[#405189]/10 text-[11px] font-medium text-[#405189] hover:bg-[#405189] hover:text-white"
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
                      resource: "types",
                      action: "delete",
                      id: t.id,
                    }),
                  })
                  toast.success("Medium deleted")
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
      <BreadcrumbBar parent="CRM" title="Lead Medium" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search lead mediums..."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    for (const id of selected) {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "types",
                          action: "delete",
                          id,
                        }),
                      })
                    }
                    setSelected([])
                    toast.success("Selected mediums deleted")
                    load()
                  }}
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-2-line mr-1" /> Delete (
                  {selected.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({ name: "", status: "1" })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Lead Medium
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Lead Medium" : "Add Lead Medium"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure lead acquisition medium (Organic, Paid, Walk-in, etc.).
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "types",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(editing ? "Medium updated!" : "Medium created!")
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Medium Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
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
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
