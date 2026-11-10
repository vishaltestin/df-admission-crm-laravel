"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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

const ROLE_PERMS = [
  "dashboard.view",
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.delete",
  "leads.export",
  "leads.reassign",
  "institutes.manage",
  "users.manage",
  "roles.manage",
  "templates.manage",
  "coupons.manage",
  "reports.view",
  "settings.manage",
]

export default function RolesPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roles, setRoles] = React.useState<any[]>([])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    id: "",
    name: "",
    slug: "",
    permissions: [] as string[],
  })

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/uac?entity=roles")
      if (res.ok) {
        const d = await res.json()
        setRoles(d.items || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = React.useCallback((r?: any) => {
    if (r) {
      let parsed: string[] = []
      try {
        const raw = r.permissions ? JSON.parse(r.permissions) : []
        if (Array.isArray(raw)) {
          parsed = raw
        } else if (raw && typeof raw === "object") {
          parsed = Object.keys(raw).filter((k) => Boolean(raw[k]))
        }
      } catch {
        parsed = []
      }
      if (r.permission_type === "all") {
        parsed = [...ROLE_PERMS]
      }
      setForm({
        id: String(r.id),
        name: r.name || "",
        slug: r.slug || "",
        permissions: parsed,
      })
    } else {
      setForm({ id: "", name: "", slug: "", permissions: [] })
    }
    setModalOpen(true)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span>#{row.original.id}</span>,
      },
      {
        accessorKey: "name",
        header: "Role Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.slug}
          </span>
        ),
      },
      {
        accessorKey: "permission_type",
        header: "Access Type",
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.permission_type || "custom"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          const isProtected = ["root", "sadmin", "admin"].includes(
            String(r.slug || "").toLowerCase()
          )
          return (
            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={() => openEdit(r)}
                className="bg-[#405189]/15 font-semibold text-[#405189] hover:bg-[#405189]/25"
              >
                Configure Permissions
              </Button>
              {!isProtected && (
                <Button
                  type="button"
                  size="xs"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: "Delete Role?",
                      description: `Are you sure you want to permanently delete role "${r.name}"?`,
                      onConfirm: async () => {
                        await fetch("/api/uac", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            entity: "roles",
                            action: "delete",
                            id: r.id,
                          }),
                        })
                        toast.success("Role deleted")
                        load()
                      },
                    })
                  }
                  className="text-[11px]"
                >
                  Delete
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [openEdit, confirmDelete, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Roles & RBAC Matrix" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`System Roles (${roles.length})`}
          columns={columns}
          data={roles}
          loading={loading}
          searchPlaceholder="Search roles..."
          toolbarRight={
            <Button
              type="button"
              size="sm"
              onClick={() => openEdit()}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Add Role
            </Button>
          }
        />
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {form.id ? `Edit Role: ${form.name}` : "Create New Role"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure role slug and RBAC permission flags.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  entity: "roles",
                  action: form.id ? "update" : "create",
                  id: form.id || undefined,
                  name: form.name,
                  slug: form.slug,
                  permission_type:
                    form.permissions.length === ROLE_PERMS.length
                      ? "all"
                      : "custom",
                  permissions: form.permissions,
                }),
              })
              if (res.ok) {
                toast.success("Role & permissions saved!")
                setModalOpen(false)
                load()
              } else {
                toast.error("Failed to save role")
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Role Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Slug *</Label>
                <Input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Module Permissions
                </Label>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setForm({ ...form, permissions: [...ROLE_PERMS] })
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => setForm({ ...form, permissions: [] })}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-3">
                {ROLE_PERMS.map((perm) => (
                  <label
                    key={perm}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={form.permissions.includes(perm)}
                      onCheckedChange={(checked) => {
                        setForm((prev) => ({
                          ...prev,
                          permissions: checked
                            ? [...prev.permissions, perm]
                            : prev.permissions.filter((p) => p !== perm),
                        }))
                      }}
                    />
                    <span className="font-mono text-[11px]">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
