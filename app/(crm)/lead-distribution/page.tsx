"use client"

import * as React from "react"
import { toast } from "sonner"
import { FlaskConical, Plus, Trash2, Users } from "lucide-react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { FormSelect } from "@/components/ui/form-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SourceMappingRow {
  rowKey: string
  source_id: string
  assign_type: "user" | "team" | "designation"
  assign_id: string
  percentage: string
}

interface SimBreakdownRow {
  user_id: number
  name: string
  email: string
  count: number
  percentage: number
}

export default function LeadDistributionPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rules, setRules] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [designations, setDesignations] = React.useState<any[]>([])

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Add / Edit Rule Modal State (1:1 with lead_distribution/modal.blade.php)
  const [showRuleModal, setShowRuleModal] = React.useState(false)
  const [savingRule, setSavingRule] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingRule, setEditingRule] = React.useState<any>(null)
  const [ruleName, setRuleName] = React.useState("")
  const [distributionType, setDistributionType] = React.useState<
    "random" | "source"
  >("random")
  const [isActive, setIsActive] = React.useState(true)
  const [selectedUsers, setSelectedUsers] = React.useState<number[]>([])
  const [userSearch, setUserSearch] = React.useState("")
  const [sourceRows, setSourceRows] = React.useState<SourceMappingRow[]>([])

  // Simulation Modal State (1:1 with lead_distribution/test_modal.blade.php)
  const [showSimModal, setShowSimModal] = React.useState(false)
  const [simSourceId, setSimSourceId] = React.useState("")
  const [simCount, setSimCount] = React.useState("100")
  const [simRunning, setSimRunning] = React.useState(false)
  const [simResult, setSimResult] = React.useState<{
    ruleType: string
    note: string
    totalLeads: number
    breakdown: SimBreakdownRow[]
  } | null>(null)

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/crm-resources?resource=lead_distribution")
      const d = await r.json()
      setRules(d.items || [])
      setSources(d.sources || [])
      setUsers(d.users || [])
      setTeams(d.teams || [])
      setDesignations(d.designations || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const makeDefaultSourceRow = React.useCallback((): SourceMappingRow => {
    return {
      rowKey: `sr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      source_id: sources[0] ? String(sources[0].id) : "",
      assign_type: "user",
      assign_id: users[0] ? String(users[0].id) : "",
      percentage: "",
    }
  }, [sources, users])

  function openCreateModal() {
    setEditingRule(null)
    setRuleName("")
    setDistributionType("random")
    setIsActive(true)
    setSelectedUsers([])
    setUserSearch("")
    setSourceRows([makeDefaultSourceRow()])
    setShowRuleModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEditModal(rule: any) {
    setEditingRule(rule)
    setRuleName(rule.rule_name || rule.name || "")
    const dType: "random" | "source" =
      rule.distribution_type === "source" ? "source" : "random"
    setDistributionType(dType)
    setIsActive(Boolean(rule.is_active))
    setUserSearch("")

    const rItems = Array.isArray(rule.items) ? rule.items : []
    if (dType === "random") {
      setSelectedUsers(
        rItems.map((i: { user_id?: number }) => Number(i.user_id || 0)).filter(Boolean)
      )
      setSourceRows([makeDefaultSourceRow()])
    } else {
      setSelectedUsers([])
      setSourceRows(
        rItems.length > 0
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rItems.map((i: any, idx: number) => {
              const aType: "user" | "team" | "designation" =
                i.assign_type === "team"
                  ? "team"
                  : i.assign_type === "designation"
                    ? "designation"
                    : "user"
              const aId =
                i.assign_id ||
                (aType === "team"
                  ? i.team_id
                  : aType === "designation"
                    ? i.designation_id
                    : i.user_id)
              return {
                rowKey: `sr_edit_${idx}_${i.id || idx}`,
                source_id: i.source_id ? String(i.source_id) : "",
                assign_type: aType,
                assign_id: aId ? String(aId) : "",
                percentage:
                  i.percentage !== null && i.percentage !== undefined
                    ? String(i.percentage)
                    : "",
              }
            })
          : [makeDefaultSourceRow()]
      )
    }

    setShowRuleModal(true)
  }

  function getAssignOptions(assignType: "user" | "team" | "designation") {
    if (assignType === "team") {
      return teams.map((t) => ({
        value: String(t.id),
        label: t.name || `Team #${t.id}`,
      }))
    }
    if (assignType === "designation") {
      return designations.map((d) => ({
        value: String(d.id),
        label: d.name || `Designation #${d.id}`,
      }))
    }
    return users.map((u) => ({
      value: String(u.id),
      label:
        u.name ||
        `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
        u.email ||
        `User #${u.id}`,
    }))
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault()
    if (!ruleName.trim()) {
      toast.error("Rule Name is required")
      return
    }
    if (distributionType === "random" && selectedUsers.length === 0) {
      toast.error("Please select at least one user for Random distribution")
      return
    }
    if (distributionType === "source") {
      const validRows = sourceRows.filter((r) => r.source_id && r.assign_id)
      if (validRows.length === 0) {
        toast.error(
          "Please configure at least one Source → Assign To mapping row"
        )
        return
      }
    }

    setSavingRule(true)
    try {
      const res = await fetch("/api/crm-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "lead_distribution",
          action: editingRule ? "update" : "create",
          id: editingRule?.id,
          rule_name: ruleName.trim(),
          distribution_type: distributionType,
          is_active: isActive,
          selected_users: selectedUsers,
          items: sourceRows.map((r) => ({
            source_id: Number(r.source_id),
            assign_type: r.assign_type,
            assign_id: Number(r.assign_id),
            percentage: r.percentage === "" ? null : Number(r.percentage),
          })),
        }),
      })
      const out = await res.json()
      if (res.ok) {
        toast.success(
          editingRule
            ? "Lead distribution rule updated!"
            : "Lead distribution rule created!"
        )
        setShowRuleModal(false)
        load()
      } else {
        toast.error(out.error || "Failed to save rule")
      }
    } finally {
      setSavingRule(false)
    }
  }

  async function runSimulation() {
    setSimRunning(true)
    try {
      const res = await fetch("/api/crm-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "lead_distribution",
          action: "simulate",
          source_id: simSourceId ? Number(simSourceId) : 0,
          count: Math.max(1, Math.min(1000, Number(simCount || 100))),
        }),
      })
      const out = await res.json()
      if (res.ok) {
        setSimResult({
          ruleType: out.ruleType || out.matchedRule || "Distribution Engine",
          note: out.note || "",
          totalLeads: Number(out.totalLeads || simCount || 100),
          breakdown: Array.isArray(out.breakdown) ? out.breakdown : [],
        })
      } else {
        toast.error(out.error || "Simulation failed")
      }
    } finally {
      setSimRunning(false)
    }
  }

  const filteredModalUsers = React.useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => {
      const nm = `${u.name || ""} ${u.first_name || ""} ${u.last_name || ""} ${u.email || ""}`.toLowerCase()
      return nm.includes(q)
    })
  }, [users, userSearch])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={
              rules.length > 0 && selectedIds.length === rules.length
            }
            onCheckedChange={(checked) =>
              setSelectedIds(
                checked ? rules.map((r) => String(r.id)) : []
              )
            }
            aria-label="Select all rules"
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(checked) =>
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
              aria-label={`Select ${row.original.rule_name}`}
            />
          )
        },
      },
      {
        accessorFn: (r) => r.rule_name || r.name || "",
        id: "rule_name",
        header: "Rule Name",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.rule_name || row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "distribution_type",
        header: "Type",
        cell: ({ row }) => {
          const isSource = row.original.distribution_type === "source"
          return (
            <Badge
              className={
                isSource
                  ? "bg-purple-100 text-[10px] font-semibold text-purple-700"
                  : "bg-sky-100 text-[10px] font-semibold text-sky-700"
              }
            >
              {isSource ? "Source Based" : "Random (User-wise)"}
            </Badge>
          )
        },
      },
      {
        accessorKey: "assign_to",
        header: "Assignment Mapping",
        cell: ({ row }) => (
          <div className="max-w-md truncate text-[11px] text-muted-foreground">
            {row.original.assign_to || "—"}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(r.is_active)}
                onCheckedChange={async () => {
                  await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "lead_distribution",
                      action: "toggle",
                      id: r.id,
                    }),
                  })
                  toast.success("Rule status updated")
                  load()
                }}
              />
              {r.is_active ? (
                <Badge className="bg-emerald-100 text-[10px] text-emerald-700">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  Inactive
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => openEditModal(r)}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Distribution Rule?",
                    description: `Are you sure you want to delete "${r.rule_name || r.name}"? All its user/source mapping items will also be removed.`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "lead_distribution",
                          action: "delete",
                          id: r.id,
                        }),
                      })
                      toast.success("Rule deleted successfully!")
                      setSelectedIds((prev) =>
                        prev.filter((x) => x !== String(r.id))
                      )
                      load()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules, selectedIds, load, confirmDelete, sources, users, teams, designations]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[460px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Lead Distribution" />

      <Card className="p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div>
            <h4 className="text-sm font-bold">Lead Distribution Rules</h4>
            <p className="text-xs text-muted-foreground">
              Configure Random (User-wise round-robin) or Source-Based (User /
              Team / Designation + Percentage weight) lead routing rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: `Delete ${selectedIds.length} Selected Rule(s)?`,
                    description: `This will permanently delete ${selectedIds.length} distribution rule(s) and their mappings.`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "lead_distribution",
                          action: "bulk_delete",
                          ids: selectedIds.map(Number),
                        }),
                      })
                      toast.success("Selected rules deleted")
                      setSelectedIds([])
                      load()
                    },
                  })
                }
                className="text-xs"
              >
                <Trash2 className="mr-1 size-3.5" /> Delete ({selectedIds.length})
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => {
                if (!simSourceId && sources[0]) {
                  setSimSourceId(String(sources[0].id))
                }
                setSimResult(null)
                setShowSimModal(true)
              }}
              className="bg-[#299cdb] text-xs text-white hover:bg-[#2389c2]"
            >
              <FlaskConical className="mr-1.5 size-3.5" />
              Test Lead Assignment
            </Button>

            <Button
              size="sm"
              onClick={openCreateModal}
              className="bg-[#405189] text-xs text-white hover:bg-[#364574]"
            >
              <Plus className="mr-1 size-3.5" /> Add Rule
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={rules}
          searchPlaceholder="Search rules by name, type, or assignee..."
          emptyMessage="No rules configured."
        />
      </Card>

      {/* XL Add / Edit Rule Modal — 1:1 with lead_distribution/modal.blade.php */}
      <Dialog open={showRuleModal} onOpenChange={setShowRuleModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Distribution Rule" : "Add Rule"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose between <strong>Random (User-wise)</strong> round-robin
              distribution or <strong>Source Based</strong> weighted assignment
              across Users, Teams, or Designations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveRule} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 border-b border-border pb-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Label className="mb-1 block text-xs">
                  Rule Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Facebook & Google Weighted Admissions Routing"
                  className="h-9 text-xs"
                />
              </div>

              <div className="md:col-span-4">
                <Label className="mb-1 block text-xs">
                  Distribution Type <span className="text-destructive">*</span>
                </Label>
                <FormSelect
                  value={distributionType}
                  onValueChange={(v) =>
                    setDistributionType(v === "source" ? "source" : "random")
                  }
                  options={[
                    { value: "random", label: "Random (User-wise)" },
                    { value: "source", label: "Source Based" },
                  ]}
                />
              </div>

              <div className="flex items-end pb-1.5 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label className="text-xs font-semibold">Active</Label>
                </div>
              </div>
            </div>

            {/* RANDOM SECTION */}
            {distributionType === "random" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="flex items-center gap-1.5 text-sm font-bold">
                      <Users className="size-4 text-[#405189]" />
                      Random Distribution (Users)
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Select one or more users. New leads will be distributed
                      randomly / round-robin among them.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Filter users..."
                      className="h-8 w-44 text-xs"
                    />
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        setSelectedUsers(users.map((u) => Number(u.id)))
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => setSelectedUsers([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto rounded-md border border-border p-3 sm:grid-cols-2">
                  {filteredModalUsers.map((u) => {
                    const uid = Number(u.id)
                    const checked = selectedUsers.includes(uid)
                    const label =
                      u.name ||
                      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                      u.email
                    return (
                      <label
                        key={uid}
                        className={`flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2 transition ${
                          checked
                            ? "border-[#405189] bg-[#405189]/5"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setSelectedUsers((prev) =>
                              v
                                ? [...prev, uid]
                                : prev.filter((x) => x !== uid)
                            )
                          }
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{label}</div>
                          {u.email && (
                            <div className="truncate text-[10.5px] text-muted-foreground">
                              {u.email}
                            </div>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Selected: <strong>{selectedUsers.length}</strong> user(s)
                </p>
              </div>
            ) : (
              /* SOURCE SECTION — 1:1 with lead_distribution/modal.blade.php */
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-bold">
                    Source Based Distribution
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Define for each Lead Source whom to assign leads to (
                    <strong>User / Team / Designation</strong>) and at what
                    percentage weight.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold">
                      <tr>
                        <th className="w-[26%] px-3 py-2">Source</th>
                        <th className="w-[20%] px-3 py-2">Assign Type</th>
                        <th className="w-[30%] px-3 py-2">Assign To</th>
                        <th className="w-[14%] px-3 py-2">%</th>
                        <th className="w-[10%] px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sourceRows.map((row, idx) => {
                        const targetOpts = getAssignOptions(row.assign_type)
                        return (
                          <tr key={row.rowKey}>
                            <td className="p-2">
                              <FormSelect
                                value={row.source_id || "__none__"}
                                onValueChange={(v) => {
                                  const val = v === "__none__" ? "" : v
                                  setSourceRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, source_id: val } : r
                                    )
                                  )
                                }}
                                options={[
                                  { value: "__none__", label: "Select Source" },
                                  ...sources.map((s) => ({
                                    value: String(s.id),
                                    label: s.name,
                                  })),
                                ]}
                              />
                            </td>

                            <td className="p-2">
                              <FormSelect
                                value={row.assign_type}
                                onValueChange={(v) => {
                                  const nextType =
                                    v === "team"
                                      ? "team"
                                      : v === "designation"
                                        ? "designation"
                                        : "user"
                                  const nextOpts = getAssignOptions(nextType)
                                  setSourceRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? {
                                            ...r,
                                            assign_type: nextType,
                                            assign_id: nextOpts[0]?.value || "",
                                          }
                                        : r
                                    )
                                  )
                                }}
                                options={[
                                  { value: "user", label: "User" },
                                  { value: "team", label: "Team" },
                                  {
                                    value: "designation",
                                    label: "Designation",
                                  },
                                ]}
                              />
                            </td>

                            <td className="p-2">
                              <FormSelect
                                value={row.assign_id || "__none__"}
                                onValueChange={(v) => {
                                  const val = v === "__none__" ? "" : v
                                  setSourceRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx ? { ...r, assign_id: val } : r
                                    )
                                  )
                                }}
                                options={[
                                  { value: "__none__", label: "Select" },
                                  ...targetOpts,
                                ]}
                              />
                            </td>

                            <td className="p-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={row.percentage}
                                onChange={(e) =>
                                  setSourceRows((prev) =>
                                    prev.map((r, i) =>
                                      i === idx
                                        ? { ...r, percentage: e.target.value }
                                        : r
                                    )
                                  )
                                }
                                placeholder="Equal"
                                className="h-9 text-xs"
                              />
                            </td>

                            <td className="p-2 text-right">
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  setSourceRows((prev) =>
                                    prev.length > 1
                                      ? prev.filter((_, i) => i !== idx)
                                      : prev
                                  )
                                }
                                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSourceRows((prev) => [...prev, makeDefaultSourceRow()])
                    }
                    className="text-xs"
                  >
                    <Plus className="mr-1 size-3.5" /> Add Source Mapping
                  </Button>
                  <span className="text-[11px] text-muted-foreground">
                    Note: If percentage (%) is left blank, leads are distributed
                    equally across matching rows.
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRuleModal(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={savingRule}
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                {savingRule ? "Saving..." : editingRule ? "Update Rule" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Distribution Simulation Modal — 1:1 with lead_distribution/test_modal.blade.php */}
      <Dialog open={showSimModal} onOpenChange={setShowSimModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="size-4 text-[#299cdb]" />
              Lead Distribution Simulation
            </DialogTitle>
            <DialogDescription className="text-xs">
              Simulate how incoming leads from a specific Lead Source will be
              routed across counsellors under your active rules.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <Label className="mb-1 block text-xs">Select Lead Source</Label>
                <FormSelect
                  value={simSourceId || "__any__"}
                  onValueChange={(v) =>
                    setSimSourceId(v === "__any__" ? "" : v)
                  }
                  options={[
                    { value: "__any__", label: "Any / Unspecified Source" },
                    ...sources.map((s) => ({
                      value: String(s.id),
                      label: s.name,
                    })),
                  ]}
                />
              </div>

              <div className="sm:col-span-3">
                <Label className="mb-1 block text-xs">No. of Leads</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={simCount}
                  onChange={(e) => setSimCount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex items-end sm:col-span-3">
                <Button
                  type="button"
                  disabled={simRunning}
                  onClick={runSimulation}
                  className="h-9 w-full bg-[#405189] text-xs text-white hover:bg-[#364574]"
                >
                  {simRunning ? "Running..." : "Run Simulation"}
                </Button>
              </div>
            </div>

            {simResult && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="space-y-1 rounded-md border border-[#0ab39c]/30 bg-[#0ab39c]/5 p-3">
                  <div className="font-bold text-foreground">
                    Rule Used:{" "}
                    <span className="text-[#0ab39c]">{simResult.ruleType}</span>
                  </div>
                  {simResult.note && (
                    <div className="text-[11px] text-muted-foreground">
                      <strong>Note:</strong> {simResult.note}
                    </div>
                  )}
                  <div className="text-[11px]">
                    <strong>Total Leads Simulated:</strong>{" "}
                    <span className="font-mono font-semibold">
                      {simResult.totalLeads}
                    </span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold">
                      <tr>
                        <th className="px-3 py-2">User</th>
                        <th className="w-28 px-3 py-2">Leads</th>
                        <th className="w-28 px-3 py-2">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {simResult.breakdown.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-4 text-center text-muted-foreground"
                          >
                            No active counsellors matched.
                          </td>
                        </tr>
                      ) : (
                        simResult.breakdown.map((b) => (
                          <tr key={b.user_id}>
                            <td className="px-3 py-2">
                              <div className="font-semibold">{b.name}</div>
                              {b.email && (
                                <div className="text-[10.5px] text-muted-foreground">
                                  {b.email}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold">
                              {b.count}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-[#405189]">
                              {b.percentage}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
