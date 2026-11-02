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

const PERMISSION_KEYS = [
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

export default function UsersManagementPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>({
    items: [],
    roles: [],
    designations: [],
    organizations: [],
    institutes: [],
  })
  const [modalOpen, setModalOpen] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [permUser, setPermUser] = React.useState<any>(null)
  const [permMap, setPermMap] = React.useState<Record<string, boolean>>({})

  const [form, setForm] = React.useState({
    id: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
    role_id: "",
    designation: "1",
    organization: "1",
    institute_ids: [] as number[],
  })

  const load = React.useCallback(async () => {
    const res = await fetch("/api/uac?type=users")
    if (res.ok) setData(await res.json())
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

   
  const openEdit = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (u?: any) => {
      if (u) {
        setForm({
          id: String(u.id),
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          mobile: u.mobile || "",
          password: "",
          role_id: String(u.role_id || ""),
          designation: u.designation || "1",
          organization: u.organization_id || "1",
          institute_ids: u.institute_ids || [],
        })
      } else {
        setForm({
          id: "",
          first_name: "",
          last_name: "",
          email: "",
          mobile: "",
          password: "User@123",
          role_id: String(data.roles[0]?.id || "5"),
          designation: "1",
          organization: "1",
          institute_ids: [],
        })
      }
      setModalOpen(true)
    },
    [data.roles]
  )

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/uac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "users",
        action: form.id ? "update" : "create",
        ...form,
      }),
    })
    if (res.ok) {
      toast.success(form.id ? "User updated" : "User created")
      setModalOpen(false)
      load()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (u) => `${u.first_name || ""} ${u.last_name || ""}`.trim(),
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.original.first_name} {row.original.last_name}
          </span>
        ),
      },
      { accessorKey: "email", header: "Email" },
      {
        accessorFn: (u) => u.mobile || "-",
        id: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile || "-"}</span>
        ),
      },
      {
        accessorKey: "role_name",
        header: "Role",
        cell: ({ row }) => (
          <Badge className="bg-[#405189]/15 font-semibold text-[#405189] hover:bg-[#405189]/25">
            {row.original.role_name}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const u = row.original
          return (
            <Badge
              onClick={async () => {
                await fetch("/api/uac", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "users",
                    action: "toggle_status",
                    id: u.id,
                    status: u.status === 1 ? 0 : 1,
                  }),
                })
                toast.success("User status toggled")
                load()
              }}
              className={`cursor-pointer text-[11px] font-semibold ${
                u.status === 1
                  ? "bg-[#0ab39c]/15 text-[#0ab39c] hover:bg-[#0ab39c]/25"
                  : "bg-[#f06548]/15 text-[#f06548] hover:bg-[#f06548]/25"
              }`}
            >
              {u.status === 1 ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex justify-end gap-2 whitespace-nowrap">
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={() => {
                  setPermUser(u)
                  try {
                    setPermMap(u.permissions ? JSON.parse(u.permissions) : {})
                  } catch {
                    setPermMap({})
                  }
                }}
                className="bg-[#299cdb]/15 font-semibold text-[#299cdb] hover:bg-[#299cdb]/25"
              >
                Permissions
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => openEdit(u)}
              >
                Edit
              </Button>
            </div>
          )
        },
      },
    ],
    [load, openEdit]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Users" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`CRM Users & Counsellors (${data.items.length})`}
          columns={columns}
          data={data.items}
          searchPlaceholder="Search users..."
          toolbarRight={
            <Button
              type="button"
              size="sm"
              onClick={() => openEdit()}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <i className="ri-user-add-line mr-1" /> Add User
            </Button>
          }
        />
      </Card>

      {/* Create / Edit User shadcn Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {form.id ? "Edit User" : "Create New CRM User"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure counsellor profile, role assignment, and allowed institutes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">First Name *</Label>
                <Input
                  required
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Last Name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Email *</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Mobile</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Role *</Label>
                <select
                  value={form.role_id}
                  onChange={(e) =>
                    setForm({ ...form, role_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.roles.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  Password {form.id ? "(Optional)" : "*"}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Assigned Institutes</Label>
              <div className="flex flex-wrap gap-3 rounded-md border border-border p-2.5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.institutes.map((inst: any) => {
                  const idNum = Number(inst.id)
                  return (
                    <label
                      key={inst.id}
                      className="flex cursor-pointer items-center gap-1.5"
                    >
                      <Checkbox
                        checked={form.institute_ids.includes(idNum)}
                        onCheckedChange={(checked) =>
                          setForm({
                            ...form,
                            institute_ids: checked
                              ? [...form.institute_ids, idNum]
                              : form.institute_ids.filter((x) => x !== idNum),
                          })
                        }
                      />
                      <span>{inst.name}</span>
                    </label>
                  )
                })}
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
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Per-User Granular Permission Matrix shadcn Dialog */}
      <Dialog
        open={Boolean(permUser)}
        onOpenChange={(open) => !open && setPermUser(null)}
      >
        <DialogContent className="sm:max-w-lg text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Override Permissions — {permUser?.first_name}{" "}
              {permUser?.last_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Toggle per-user Sentinel permission overrides.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PERMISSION_KEYS.map((pk) => (
              <label
                key={pk}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2"
              >
                <Checkbox
                  checked={Boolean(permMap[pk])}
                  onCheckedChange={(v) =>
                    setPermMap({ ...permMap, [pk]: Boolean(v) })
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
              onClick={() => setPermUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await fetch("/api/uac", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "users",
                    action: "save_permissions",
                    id: permUser.id,
                    permissions: permMap,
                  }),
                })
                toast.success("User permissions saved!")
                setPermUser(null)
                load()
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
