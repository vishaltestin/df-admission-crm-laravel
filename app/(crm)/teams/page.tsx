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

export default function TeamsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organizations, setOrganizations] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewTeam, setViewTeam] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    organization_id: "1",
    team_head: "",
    member_ids: [] as number[],
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/uac?entity=teams")
      const d = await r.json()
      setTeams(d.items || [])
      setUsers(d.users || [])
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
    (t: any) => {
      setEditing(t)
      setForm({
        name: t.name || "",
        organization_id: String(t.organization_id || t.organization || 1),
        team_head: t.team_head ? String(t.team_head) : "",
        member_ids: Array.isArray(t.member_ids) ? t.member_ids : [],
        status: String(t.status ?? 1),
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
        entity: "teams",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
      }),
    })
    if (!res.ok) {
      toast.error("Failed to save team")
      return
    }
    toast.success(editing ? "Team updated" : "Team created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  function toggleMember(id: number) {
    setForm((prev) => ({
      ...prev,
      member_ids: prev.member_ids.includes(id)
        ? prev.member_ids.filter((m) => m !== id)
        : [...prev.member_ids, id],
    }))
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    confirmDelete({
      title: `Delete ${selectedIds.length} Selected Team(s)?`,
      description: `Are you sure you want to permanently delete ${selectedIds.length} selected team(s)? This action cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch("/api/uac", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "teams",
            action: "bulk_delete",
            ids: selectedIds,
          }),
        })
        if (res.ok) {
          toast.success(`${selectedIds.length} team(s) deleted`)
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
            checked={teams.length > 0 && selectedIds.length === teams.length}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? teams.map((t) => Number(t.id)) : [])
            }
            aria-label="Select all teams"
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
        header: "Name",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setViewTeam(row.original)}
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
          <span className="font-medium text-foreground">
            {row.original.organization_name || "-"}
          </span>
        ),
      },
      {
        accessorKey: "head_name",
        header: "Head",
        cell: ({ row }) => (
          <span>{row.original.head_name || "-"}</span>
        ),
      },
      {
        id: "members",
        header: "Members",
        accessorFn: (t) => Number(t.member_count ?? 0),
        cell: ({ row }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const members: any[] = row.original.member_details || []
          if (members.length === 0) {
            return (
              <span className="text-[11px] text-muted-foreground">
                0 Counselors
              </span>
            )
          }
          const visible = members.slice(0, 4)
          const extra = Math.max(0, members.length - 4)
          return (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {visible.map((m) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-[#405189]/15 text-[10px] font-bold text-[#405189]"
                  >
                    {(m.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {extra > 0 && (
                  <div className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-bold text-foreground">
                    +{extra}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                ({members.length})
              </span>
            </div>
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
                : "bg-slate-100 text-slate-700"
            }
          >
            {Number(row.original.status ?? 1) === 1 ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Create Date",
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
          const t = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setViewTeam(t)}
                className="border-[#299cdb]/40 text-[11px] text-[#299cdb] hover:bg-[#299cdb]/10"
              >
                View
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openEdit(t)}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Team?",
                    description: `Are you sure you want to permanently delete team "${t.name}"? This action cannot be undone.`,
                    onConfirm: async () => {
                      const res = await fetch("/api/uac", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entity: "teams",
                          action: "delete",
                          id: t.id,
                        }),
                      })
                      if (res.ok) {
                        toast.success("Team deleted")
                        load()
                      } else {
                        toast.error("Failed to delete team")
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
    [teams, selectedIds, load, openEdit, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="User Access Control" title="Counselor Teams" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`All Teams (${teams.length})`}
          columns={columns}
          data={teams}
          loading={loading}
          searchPlaceholder="Search teams, organization, or team head..."
          emptyMessage="No teams created yet."
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
                    team_head: "",
                    member_ids: [],
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add Team
              </Button>
            </div>
          }
        />
      </Card>

      {/* View Team Offcanvas Sheet (1:1 with #viewTeamCanvas in teams/index.blade.php) */}
      <Sheet
        open={Boolean(viewTeam)}
        onOpenChange={(o) => {
          if (!o) setViewTeam(null)
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle className="flex items-center gap-2 text-base">
              <i className="ri-team-line text-[#405189]" />
              <span>Team Details</span>
            </SheetTitle>
            <SheetDescription>
              Overview of team assignment, head, organization, and members.
            </SheetDescription>
          </SheetHeader>

          {viewTeam && (
            <div className="space-y-4 p-4 text-xs">
              <div className="divide-y divide-border rounded-lg border border-border">
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Team Name</span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {viewTeam.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Organization</span>
                  <span className="col-span-2 font-medium text-foreground">
                    {viewTeam.organization_name || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Team Head</span>
                  <span className="col-span-2 font-medium text-foreground">
                    {viewTeam.head_name || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Status</span>
                  <span className="col-span-2">
                    <Badge
                      className={
                        Number(viewTeam.status ?? 1) === 1
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {Number(viewTeam.status ?? 1) === 1
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="col-span-2 text-muted-foreground">
                    {viewTeam.created_at
                      ? new Date(viewTeam.created_at).toLocaleString("en-IN")
                      : "-"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase text-muted-foreground">
                  Team Members ({(viewTeam.member_details || []).length})
                </h4>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {(viewTeam.member_details || []).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-full bg-[#405189]/12 text-[11px] font-bold text-[#405189]">
                            {(m.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link
                              href={`/user/${m.id}`}
                              className="font-semibold text-foreground hover:text-[#405189] hover:underline"
                            >
                              {m.name}
                            </Link>
                            <div className="text-[11px] text-muted-foreground">
                              {m.email}
                              {m.designation_name && m.designation_name !== "-"
                                ? ` • ${m.designation_name}`
                                : ""}
                            </div>
                          </div>
                        </div>
                        <Button asChild size="xs" variant="ghost">
                          <Link href={`/user/${m.id}`}>Profile</Link>
                        </Button>
                      </div>
                    )
                  )}
                  {(viewTeam.member_details || []).length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No members assigned to this team yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const item = viewTeam
                    setViewTeam(null)
                    openEdit(item)
                  }}
                >
                  Edit Team
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewTeam(null)}
                  className="bg-[#405189] text-white hover:bg-[#364574]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add / Edit Team Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Team" : "Create Team"}</DialogTitle>
            <DialogDescription>
              Configure team name, organization, team head, and counselor
              members.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  Team Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. North Zone Admissions"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  Organization <span className="text-rose-500">*</span>
                </Label>
                <FormSelect
                  value={form.organization_id}
                  onValueChange={(v) =>
                    setForm({ ...form, organization_id: v })
                  }
                  options={organizations.map((o) => ({
                    value: String(o.id),
                    label: o.name,
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Team Head</Label>
                <FormSelect
                  value={form.team_head}
                  onValueChange={(v) => setForm({ ...form, team_head: v })}
                  placeholder="-- Select Team Head --"
                  options={[
                    { value: "", label: "-- Select Team Head --" },
                    ...users.map((u) => ({
                      value: String(u.id),
                      label:
                        `${u.name || ""} ${u.lname || ""}`.trim() || u.email,
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
                    { value: "0", label: "Inactive" },
                  ]}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">
                Team Members ({form.member_ids.length} selected)
              </Label>
              <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border p-2.5">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <Checkbox
                      checked={form.member_ids.includes(u.id)}
                      onCheckedChange={() => toggleMember(u.id)}
                    />
                    <span className="truncate">
                      {u.name} {u.lname}
                    </span>
                  </label>
                ))}
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
                Save Team
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
