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

export default function TeamsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    head: "",
    members: [] as string[],
    status: "1",
  })

  const load = React.useCallback(() => {
    fetch("/api/uac?resource=teams")
      .then((r) => r.json())
      .then((d) => {
        setTeams(d.teams || [])
        setUsers(d.users || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const userMap = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m: Record<string, any> = {}
    for (const u of users) m[String(u.id)] = u
    return m
  }, [users])

  function parseMembers(raw?: string | null): string[] {
    if (!raw) return []
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorFn: (t) => t.name || t.team_name || "",
        id: "name",
        header: "Team Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189]">
            {row.original.name || row.original.team_name}
          </span>
        ),
      },
      {
        accessorFn: (t) => userMap[String(t.head)]?.name || "",
        id: "head",
        header: "Team Head",
        cell: ({ row }) => {
          const u = userMap[String(row.original.head)]
          return u ? (
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#405189] text-[10px] font-bold text-white">
                {(u.name || "U")[0]}
              </span>
              <span className="font-medium">{u.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">User #{row.original.head}</span>
          )
        },
      },
      {
        id: "members",
        header: "Team Members",
        cell: ({ row }) => {
          const ids = parseMembers(
            row.original.team_member || row.original.team_members
          )
          if (ids.length === 0)
            return <span className="text-muted-foreground">No members</span>
          const visible = ids.slice(0, 4)
          const extra = ids.length - visible.length
          return (
            <div className="flex flex-wrap items-center gap-1">
              {visible.map((uid) => {
                const u = userMap[uid]
                return (
                  <Badge
                    key={uid}
                    variant="secondary"
                    className="text-[10px] font-medium"
                  >
                    {u ? u.name : `#${uid}`}
                  </Badge>
                )
              })}
              {extra > 0 && (
                <Badge className="bg-[#405189] text-[10px] text-white">
                  +{extra} more
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          Number(row.original.status ?? 1) === 1 ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
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
                onClick={() => {
                  setEditing(t)
                  setForm({
                    name: t.name || t.team_name || "",
                    head: t.head ? String(t.head) : "",
                    members: parseMembers(t.team_member || t.team_members),
                    status: String(t.status ?? 1),
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
                      resource: "teams",
                      action: "delete",
                      id: t.id,
                    }),
                  })
                  toast.success("Team deleted")
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
    [userMap, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="UAC" title="Teams" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Counselling & Sales Teams (${teams.length})`}
          columns={columns}
          data={teams}
          searchPlaceholder="Search team name or head..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  name: "",
                  head: users[0] ? String(users[0].id) : "",
                  members: [],
                  status: "1",
                })
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Create Team
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Team — ${editing.name}` : "Create Team"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign a Team Head and select counselling / sales members.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "teams",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  name: form.name,
                  head: form.head,
                  team_member: form.members.join(","),
                  status: form.status,
                }),
              })
              if (res.ok) {
                toast.success(editing ? "Team updated!" : "Team created!")
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Team Name *</Label>
              <Input
                required
                placeholder="Admission Counseling Team"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Team Head *</Label>
                <select
                  required
                  value={form.head}
                  onChange={(e) => setForm({ ...form, head: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select Team Head</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
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

            <div>
              <Label className="mb-1 block text-xs">
                Team Members ({form.members.length} selected)
              </Label>
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-md border border-input p-2.5">
                {users.map((u) => {
                  const uid = String(u.id)
                  const checked = form.members.includes(uid)
                  return (
                    <label
                      key={uid}
                      className="flex cursor-pointer items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setForm({
                              ...form,
                              members: Boolean(v)
                                ? [...form.members, uid]
                                : form.members.filter((x) => x !== uid),
                            })
                          }
                        />
                        <span>{u.name}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {u.email}
                      </span>
                    </label>
                  )
                })}
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
                {editing ? "Update Team" : "Save Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
