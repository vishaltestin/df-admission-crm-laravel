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

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Australia",
  "Canada",
  "Nepal",
  "Bangladesh",
]

export default function OrganizationsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
    gst: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/uac?entity=organizations")
      const d = await r.json()
      setItems(d.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openEditModal = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => {
      setEditing(o)
      setForm({
        name: o.name || "",
        email: o.email || "",
        mobile: o.mobile || "",
        address: o.address || "",
        city: o.city || "",
        state: o.state || "",
        zipcode: o.zipcode || "",
        country: o.country || "India",
        gst: o.gst || "",
        status: String(o.status ?? 1),
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
        entity: "organizations",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
      }),
    })
    if (!res.ok) {
      toast.error("Failed to save organization")
      return
    }
    toast.success(editing ? "Organization updated" : "Organization created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    confirmDelete({
      title: `Delete ${selectedIds.length} Selected Organization(s)?`,
      description: `Are you sure you want to permanently delete ${selectedIds.length} selected organization(s)? This action cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch("/api/uac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "organizations",
            action: "bulk_delete",
            ids: selectedIds,
          }),
        })
        if (res.ok) {
          toast.success(`${selectedIds.length} organization(s) deleted`)
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
              setSelectedIds(checked ? items.map((o) => Number(o.id)) : [])
            }
            aria-label="Select all organizations"
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
        header: "Organization",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#405189]/12 text-xs font-bold text-[#405189]">
              {(row.original.name || "O").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <Link
                href={`/organizations/${row.original.id}`}
                className="font-semibold text-[#405189] hover:underline"
              >
                {row.original.name}
              </Link>
              {row.original.address && (
                <div className="max-w-xs truncate text-[11px] text-muted-foreground">
                  {row.original.address}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
          <div>
            <div>{row.original.email || "-"}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {row.original.mobile || ""}
            </div>
          </div>
        ),
      },
      {
        accessorFn: (o) => `${o.city || ""} ${o.state || ""}`.trim(),
        id: "location",
        header: "City / State",
        cell: ({ row }) => (
          <span>
            {[row.original.city, row.original.state]
              .filter(Boolean)
              .join(", ") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "gst",
        header: "GST",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.gst || "-"}</span>
        ),
      },
      {
        accessorKey: "users_count",
        header: "Staff",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px]">
            {row.original.users_count || 0} Users
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
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                asChild
                size="xs"
                variant="outline"
                className="border-[#299cdb]/40 text-[11px] text-[#299cdb] hover:bg-[#299cdb]/10"
              >
                <Link href={`/organizations/${o.id}`}>View</Link>
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openEditModal(o)}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Organization?",
                    description: `Are you sure you want to permanently delete organization "${o.name}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      const res = await fetch("/api/uac", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entity: "organizations",
                          action: "delete",
                          id: o.id,
                        }),
                      })
                      if (res.ok) {
                        toast.success("Organization deleted")
                        load()
                      } else {
                        toast.error("Failed to delete organization")
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
    [items, selectedIds, load, openEditModal, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Organizations" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`Multi-Tenant Organizations (${items.length})`}
          columns={columns}
          data={items}
          loading={loading}
          searchPlaceholder="Search organizations, email, city, GST..."
          emptyMessage="No organizations found."
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
                    email: "",
                    mobile: "",
                    address: "",
                    city: "",
                    state: "",
                    zipcode: "",
                    country: "India",
                    gst: "",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add Organization
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Organization" : "Add Organization"}
            </DialogTitle>
            <DialogDescription>
              Configure tenant organization details, contact info, and tax ID.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">
                  Organization Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Digital Fueled Education Group"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="info@organization.com"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Mobile</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Street / Campus address"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Zip / PIN Code</Label>
                <Input
                  value={form.zipcode}
                  onChange={(e) =>
                    setForm({ ...form, zipcode: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Country</Label>
                <FormSelect
                  value={form.country}
                  onValueChange={(v) => setForm({ ...form, country: v })}
                  options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">GSTIN</Label>
                <Input
                  value={form.gst}
                  onChange={(e) => setForm({ ...form, gst: e.target.value })}
                  placeholder="Optional GST number"
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
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Organization
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
