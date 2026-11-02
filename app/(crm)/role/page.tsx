"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roles, setRoles] = React.useState<any[]>([])
  const [modalOpen, setModalOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    id: "",
    name: "",
    slug: "",
    permissions: {} as Record<string, boolean>,
  })

  const load = React.useCallback(async () => {
    const res = await fetch("/api/uac?type=roles")
    if (res.ok) {
      const d = await res.json()
      setRoles(d.items || [])
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = React.useCallback((r?: any) => {
    if (r) {
      let parsed = {}
      try {
        parsed = r.permissions ? JSON.parse(r.permissions) : {}
      } catch {
        parsed = {}
      }
      setForm({
        id: String(r.id),
        name: r.name,
        slug: r.slug,
        permissions: parsed,
      })
    } else {
      setForm({ id: "", name: "", slug: "", permissions: {} })
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
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              type="button"
              size="xs"
              variant="secondary"
              onClick={() => openEdit(row.original)}
              className="bg-[#405189]/15 font-semibold text-[#405189] hover:bg-[#405189]/25"
            >
              Configure Permissions
            </Button>
          </div>
        ),
      },
    ],
    [openEdit]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Roles & RBAC Matrix" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title="System Roles"
          columns={columns}
          data={roles}
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
        <DialogContent className="sm:max-w-lg text-xs">
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
              await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "roles",
                  action: form.id ? "update" : "create",
                  ...form,
                }),
              })
              toast.success("Role & permissions saved!")
              setModalOpen(false)
              load()
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
                <Label className="mb-1 block text-xs">Slug</Label>
                <Input
                  value={form.slug}
                  disabled={Boolean(form.id)}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_PERMS.map((pk) => (
                <label
                  key={pk}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2"
                >
                  <Checkbox
                    checked={Boolean(form.permissions[pk])}
                    onCheckedChange={(v) =>
                      setForm({
                        ...form,
                        permissions: {
                          ...form.permissions,
                          [pk]: Boolean(v),
                        },
                      })
                    }
                  />
                  <span>{pk}</span>
                </label>
              ))}
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
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
