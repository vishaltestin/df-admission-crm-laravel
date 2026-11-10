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

const PERMISSION_MODULES = [
  "dashboard.view",
  "leads.view",
  "leads.create",
  "leads.edit",
  "leads.delete",
  "leads.assign",
  "leads.export",
  "automation.view",
  "webforms.manage",
  "coupons.manage",
  "templates.manage",
  "uac.manage",
  "settings.manage",
  "reports.view",
]

export default function UsersManagementPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roles, setRoles] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [designations, setDesignations] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = React.useState<any[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<number>(0)
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [changePassword, setChangePassword] = React.useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [permModalUser, setPermModalUser] = React.useState<any>(null)
  const [selectedPerms, setSelectedPerms] = React.useState<string[]>([])

  const [form, setForm] = React.useState({
    name: "",
    lname: "",
    email: "",
    mobile: "",
    password: "",
    password_confirmation: "",
    role_id: "5",
    designation_id: "",
    organization_id: "1",
    other_org: [] as string[],
    team_id: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/uac?entity=users")
      const d = await r.json()
      setUsers(d.items || [])
      setRoles(d.roles || [])
      setDesignations(d.designations || [])
      setOrganizations(d.organizations || [])
      setTeams(d.teams || [])
      if (d.currentUserId) setCurrentUserId(Number(d.currentUserId))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const filteredDesignations = React.useMemo(() => {
    if (!form.organization_id) return designations
    const orgMatched = designations.filter(
      (d) =>
        !d.organization ||
        String(d.organization) === String(form.organization_id)
    )
    return orgMatched.length > 0 ? orgMatched : designations
  }, [designations, form.organization_id])

  const filteredTeams = React.useMemo(() => {
    if (!form.organization_id) return teams
    const orgMatched = teams.filter(
      (t) =>
        !t.organization ||
        String(t.organization) === String(form.organization_id)
    )
    return orgMatched.length > 0 ? orgMatched : teams
  }, [teams, form.organization_id])

  const openEditModal = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (u: any) => {
      setEditing(u)
      setChangePassword(false)
      const extraOrgs = String(u.other_org || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)
      setForm({
        name: u.name || "",
        lname: u.lname || "",
        email: u.email || "",
        mobile: u.mobile || "",
        password: "",
        password_confirmation: "",
        role_id: String(u.role_id || 5),
        designation_id: String(u.designation_id || ""),
        organization_id: String(u.organization_id || 1),
        other_org: extraOrgs,
        team_id: String(u.team_id || ""),
        status: String(u.status ?? 1),
      })
      setShowModal(true)
    },
    []
  )

  const openPermissionsModal = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (u: any) => {
      setPermModalUser(u)
      const userRole = roles.find((r) => r.id === u.role_id)
      let currentPerms: string[] = []
      try {
        currentPerms = userRole?.permissions
          ? JSON.parse(userRole.permissions)
          : []
      } catch {
        currentPerms = []
      }
      if (userRole?.permission_type === "all") {
        currentPerms = [...PERMISSION_MODULES]
      }
      setSelectedPerms(Array.isArray(currentPerms) ? currentPerms : [])
    },
    [roles]
  )

  async function save(e: React.FormEvent) {
    e.preventDefault()

    if (!editing || changePassword) {
      if (!editing && form.password.trim().length < 6) {
        toast.error("Password must be at least 6 characters")
        return
      }
      if (
        form.password &&
        form.password_confirmation &&
        form.password !== form.password_confirmation
      ) {
        toast.error("Password and Confirm Password do not match")
        return
      }
    }

    const res = await fetch("/api/uac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "users",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
        password: !editing || changePassword ? form.password : "",
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(data.error || "Failed to save user")
      return
    }
    toast.success(editing ? "User updated" : "User created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  async function savePermissions() {
    if (!permModalUser?.role_id) return
    await fetch("/api/uac", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "roles",
        action: "update",
        id: permModalUser.role_id,
        permission_type:
          selectedPerms.length === PERMISSION_MODULES.length ? "all" : "custom",
        permissions: selectedPerms,
      }),
    })
    toast.success(`Updated permissions for ${permModalUser.role_name}`)
    setPermModalUser(null)
    load()
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    confirmDelete({
      title: `Delete ${selectedIds.length} Selected User(s)?`,
      description: `Are you sure you want to permanently delete ${selectedIds.length} selected user account(s)?`,
      onConfirm: async () => {
        const res = await fetch("/api/uac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "users",
            action: "bulk_delete",
            ids: selectedIds,
          }),
        })
        if (res.ok) {
          toast.success("Selected users deleted")
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
        header: () => {
          const deletable = users
            .filter((u) => Number(u.id) !== currentUserId)
            .map((u) => Number(u.id))
          return (
            <Checkbox
              checked={
                deletable.length > 0 && selectedIds.length === deletable.length
              }
              onCheckedChange={(checked) =>
                setSelectedIds(checked ? deletable : [])
              }
              aria-label="Select all users"
            />
          )
        },
        cell: ({ row }) => {
          const id = Number(row.original.id)
          const isSelf = id === currentUserId
          return (
            <Checkbox
              disabled={isSelf}
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
        accessorFn: (u) => `${u.name || ""} ${u.lname || ""}`.trim(),
        id: "name",
        header: "Name",
        cell: ({ row }) => {
          const u = row.original
          const initials = `${(u.name || "U")[0]}${
            u.lname ? u.lname[0] : ""
          }`.toUpperCase()
          return (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#405189]/12 text-[11px] font-bold text-[#405189]">
                {initials}
              </div>
              <div>
                <Link
                  href={`/user/${u.id}`}
                  className="font-semibold text-foreground hover:text-[#405189] hover:underline"
                >
                  {u.name} {u.lname}
                </Link>
                {u.team_name && u.team_name !== "-" && (
                  <div className="text-[11px] text-muted-foreground">
                    Team: {u.team_name}
                  </div>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div>
            <div>{row.original.email}</div>
            {row.original.designation_name &&
              row.original.designation_name !== "-" && (
                <Badge
                  variant="secondary"
                  className="mt-0.5 bg-slate-100 px-1.5 py-0 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {row.original.designation_name}
                </Badge>
              )}
          </div>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile || "-"}</span>
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
        accessorKey: "role_name",
        header: "Role",
        cell: ({ row }) => (
          <Badge className="bg-[#405189]/10 text-[#405189] hover:bg-[#405189]/20">
            {row.original.role_name}
          </Badge>
        ),
      },
      {
        accessorKey: "last_login",
        header: "Last Login",
        cell: ({ row }) => {
          const ll = row.original.last_login
          return ll ? (
            <span className="whitespace-nowrap text-[11px] text-foreground">
              {new Date(ll).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="text-[11px] italic text-muted-foreground">
              Never
            </span>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Create Date",
        cell: ({ row }) => {
          const dt = row.original.created_at
          return dt ? (
            <span className="whitespace-nowrap text-[11px] text-muted-foreground">
              {new Date(dt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : (
            "-"
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              Number(row.original.status ?? 1) === 1
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-rose-100 text-rose-700"
            }
          >
            {Number(row.original.status ?? 1) === 1 ? "Active" : "Deactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const u = row.original
          const isSelf = Number(u.id) === currentUserId
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                asChild
                size="xs"
                variant="outline"
                className="border-[#299cdb]/40 text-[11px] text-[#299cdb] hover:bg-[#299cdb]/10"
              >
                <Link href={`/user/${u.id}`}>View</Link>
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openEditModal(u)}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openPermissionsModal(u)}
                className="border-[#405189]/30 text-[11px] text-[#405189]"
              >
                Permissions
              </Button>
              {!isSelf && (
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: "Delete User?",
                      description: `Are you sure you want to permanently delete user "${u.name} ${
                        u.lname || ""
                      }" (${u.email})? This action cannot be undone.`,
                      onConfirm: async () => {
                        const res = await fetch("/api/uac", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            entity: "users",
                            action: "delete",
                            id: u.id,
                          }),
                        })
                        if (res.ok) {
                          toast.success("User deleted")
                          load()
                        } else {
                          const d = await res.json().catch(() => ({}))
                          toast.error(d.error || "Failed to delete user")
                        }
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
    [
      users,
      selectedIds,
      currentUserId,
      load,
      openEditModal,
      openPermissionsModal,
      confirmDelete,
    ]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Manage Users" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`Staff & Counselor Accounts (${users.length})`}
          columns={columns}
          data={users}
          loading={loading}
          searchPlaceholder="Search name, email, mobile, role, org..."
          emptyMessage="No users found."
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
                  setChangePassword(true)
                  const defaultOrg = organizations[0]
                    ? String(organizations[0].id)
                    : "1"
                  setForm({
                    name: "",
                    lname: "",
                    email: "",
                    mobile: "",
                    password: "User@123",
                    password_confirmation: "User@123",
                    role_id: "5",
                    designation_id: designations[0]
                      ? String(designations[0].id)
                      : "",
                    organization_id: defaultOrg,
                    other_org: [],
                    team_id: "",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add User
              </Button>
            </div>
          }
        />
      </Card>

      {/* Add / Edit User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>
              Configure user profile, organization, designation, role, team, and
              account status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  First Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Last Name</Label>
                <Input
                  value={form.lname}
                  onChange={(e) => setForm({ ...form, lname: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="staff@institute.edu"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  Mobile <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Organization <span className="text-rose-500">*</span>
                </Label>
                <FormSelect
                  value={form.organization_id}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      organization_id: v,
                      designation_id: "",
                      team_id: "",
                    })
                  }
                  placeholder="Select Organization"
                  options={organizations.map((o) => ({
                    value: String(o.id),
                    label: o.name,
                  }))}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Designation <span className="text-rose-500">*</span>
                </Label>
                <FormSelect
                  value={form.designation_id}
                  onValueChange={(v) => setForm({ ...form, designation_id: v })}
                  placeholder="Select Designation"
                  options={[
                    { value: "", label: "-- Select Designation --" },
                    ...filteredDesignations.map((d) => ({
                      value: String(d.id),
                      label: d.name,
                    })),
                  ]}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Role <span className="text-rose-500">*</span>
                </Label>
                <FormSelect
                  value={form.role_id}
                  onValueChange={(v) => setForm({ ...form, role_id: v })}
                  placeholder="Select Role"
                  options={roles.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  }))}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Team</Label>
                <FormSelect
                  value={form.team_id}
                  onValueChange={(v) => setForm({ ...form, team_id: v })}
                  placeholder="Select Team"
                  options={[
                    { value: "", label: "-- No Team / Unassigned --" },
                    ...filteredTeams.map((t) => ({
                      value: String(t.id),
                      label: t.name,
                    })),
                  ]}
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <FormSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Deactive" },
                  ]}
                />
              </div>
            </div>

            {/* Additional Organization Access (Multi-Org Checkboxes) */}
            {organizations.length > 1 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <Label className="mb-2 block text-xs font-medium">
                  Additional Organization Access (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {organizations
                    .filter((o) => String(o.id) !== String(form.organization_id))
                    .map((o) => {
                      const oid = String(o.id)
                      const checked = form.other_org.includes(oid)
                      return (
                        <label
                          key={o.id}
                          className="flex cursor-pointer items-center gap-2 text-xs"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setForm((prev) => ({
                                ...prev,
                                other_org: c
                                  ? [...prev.other_org, oid]
                                  : prev.other_org.filter((x) => x !== oid),
                              }))
                            }}
                          />
                          <span className="truncate">{o.name}</span>
                        </label>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Password Section (Always shown on Create; toggleable on Edit) */}
            {editing && (
              <div className="pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#405189]">
                  <Checkbox
                    checked={changePassword}
                    onCheckedChange={(c) => setChangePassword(Boolean(c))}
                  />
                  <span>Change Password</span>
                </label>
              </div>
            )}

            {(!editing || changePassword) && (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs">
                    Password <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    required={!editing || changePassword}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">
                    Confirm Password <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    type="password"
                    required={!editing || changePassword}
                    value={form.password_confirmation}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password_confirmation: e.target.value,
                      })
                    }
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            )}

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
                {editing ? "Update User" : "Save User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Modal */}
      <Dialog
        open={Boolean(permModalUser)}
        onOpenChange={(o) => {
          if (!o) setPermModalUser(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Role Permissions — {permModalUser?.role_name}
            </DialogTitle>
            <DialogDescription>
              Configuring module access for{" "}
              <strong>{permModalUser?.name}</strong> ({permModalUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-medium text-muted-foreground">
                {selectedPerms.length} of {PERMISSION_MODULES.length}{" "}
                permissions enabled
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setSelectedPerms([...PERMISSION_MODULES])}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setSelectedPerms([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {PERMISSION_MODULES.map((perm) => (
                <label
                  key={perm}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 hover:bg-muted/40"
                >
                  <Checkbox
                    checked={selectedPerms.includes(perm)}
                    onCheckedChange={(checked) => {
                      setSelectedPerms((prev) =>
                        checked
                          ? [...prev, perm]
                          : prev.filter((p) => p !== perm)
                      )
                    }}
                  />
                  <span className="font-mono text-[11px]">{perm}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermModalUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={savePermissions}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
