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
import { Switch } from "@/components/ui/switch"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LeadSourcesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [selected, setSelected] = React.useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [showModal, setShowModal] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    billing_setup_amount: "0",
    status: true,
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=sources")
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
        header: "Source Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorFn: (s) => Number(s.lead_count || 0),
        id: "lead_count",
        header: "Lead Count",
        cell: ({ getValue }) => (
          <span className="font-mono">{String(getValue())}</span>
        ),
      },
      {
        accessorFn: (s) => Number(s.billing_setup_amount || 0),
        id: "billing_setup_amount",
        header: "Billing Amount (CPL)",
        cell: ({ getValue }) => `₹${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorFn: (s) =>
          Number(
            s.computed_total ??
              Number(s.lead_count || 0) * Number(s.billing_setup_amount || 0)
          ),
        id: "total",
        header: "Total",
        cell: ({ getValue }) => (
          <span className="font-semibold text-[#405189]">
            ₹{Number(getValue()).toFixed(2)}
          </span>
        ),
      },
      {
        accessorFn: (s) =>
          s.status !== false && Number(s.status) !== 0 ? "Active" : "Inactive",
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.status !== false && Number(row.original.status) !== 0 ? (
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
          const s = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                variant="secondary"
                onClick={() => {
                  setEditing(s)
                  setForm({
                    name: s.name || "",
                    billing_setup_amount: String(s.billing_setup_amount ?? 0),
                    status: s.status !== false && Number(s.status) !== 0,
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
                      resource: "sources",
                      action: "delete",
                      id: s.id,
                    }),
                  })
                  toast.success("Source deleted")
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
      <BreadcrumbBar parent="CRM" title="Sources" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search sources..."
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
                          resource: "sources",
                          action: "delete",
                          id,
                        }),
                      })
                    }
                    setSelected([])
                    toast.success("Selected sources deleted")
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
                  setForm({ name: "", billing_setup_amount: "0", status: true })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Source
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Source" : "Add Source"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure lead source attribution and CPL billing rate.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "sources",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(editing ? "Source updated!" : "Source created!")
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Source Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">
                Billing Amount per Lead (₹)
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.billing_setup_amount}
                onChange={(e) =>
                  setForm({ ...form, billing_setup_amount: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="src-status"
                checked={form.status}
                onCheckedChange={(v) => setForm({ ...form, status: v })}
              />
              <Label htmlFor="src-status" className="cursor-pointer text-xs">
                Active Source
              </Label>
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
