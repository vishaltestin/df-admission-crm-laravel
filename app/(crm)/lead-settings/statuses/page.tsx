"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Plus, Search } from "lucide-react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { FormSelect } from "@/components/ui/form-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PRESET_COLORS = [
  "#405189",
  "#299cdb",
  "#0ab39c",
  "#f7b84b",
  "#f06548",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
]

export default function LeadStatusesPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subStatuses, setSubStatuses] = React.useState<any[]>([])
  const [search, setSearch] = React.useState("")
  const [collapsedIds, setCollapsedIds] = React.useState<Record<string, boolean>>({})

  // Dependent dropdown tester (bottom of card — 1:1 with statuses.blade.php)
  const [testMainId, setTestMainId] = React.useState<string>("")
  const [testSubId, setTestSubId] = React.useState<string>("")

  // Main Status Modal (Create + Edit)
  const [showMainModal, setShowMainModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingMain, setEditingMain] = React.useState<any>(null)
  const [mainForm, setMainForm] = React.useState({
    name: "",
    color: "#405189",
    sort_order: "0",
    is_active: true,
  })

  // Sub-Status Modal (Create + Edit directly under Main Status)
  const [showSubModal, setShowSubModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSub, setEditingSub] = React.useState<any>(null)
  const [subForm, setSubForm] = React.useState({
    status_id: "",
    parent_name: "",
    name: "",
    sort_order: "0",
    is_active: true,
  })

  const load = React.useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/crm-resources?resource=statuses").then((r) => r.json()),
        fetch("/api/crm-resources?resource=sub_statuses").then((r) => r.json()),
      ])
      setItems(r1.items || [])
      setSubStatuses(r2.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const subsByParent = React.useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: Record<string, any[]> = {}
    for (const s of subStatuses) {
      const k = String(s.status_id ?? s.lead_status_id ?? "")
      if (!map[k]) map[k] = []
      map[k].push(s)
    }
    for (const k of Object.keys(map)) {
      map[k].sort(
        (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      )
    }
    return map
  }, [subStatuses])

  const filteredStatuses = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((st) => {
      const subs = subsByParent[String(st.id)] || []
      return (
        String(st.name || "")
          .toLowerCase()
          .includes(q) ||
        subs.some((sub) =>
          String(sub.name || "")
            .toLowerCase()
            .includes(q)
        )
      )
    })
  }, [items, subsByParent, search])

  const dependentSubOptions = React.useMemo(() => {
    if (!testMainId) return []
    return (subsByParent[testMainId] || [])
      .filter(
        (s) => s.is_active !== false && Number(s.is_active ?? 1) !== 0
      )
      .map((s) => ({
        value: String(s.id),
        label: s.name,
      }))
  }, [subsByParent, testMainId])

  function openAddMain() {
    setEditingMain(null)
    setMainForm({
      name: "",
      color: "#405189",
      sort_order: String(items.length),
      is_active: true,
    })
    setShowMainModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEditMain(st: any) {
    setEditingMain(st)
    setMainForm({
      name: st.name || "",
      color: st.color || "#405189",
      sort_order: String(st.sort_order ?? 0),
      is_active: st.is_active !== false && Number(st.is_active ?? 1) !== 0,
    })
    setShowMainModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openAddSubFor(st: any) {
    const existingSubs = subsByParent[String(st.id)] || []
    setEditingSub(null)
    setSubForm({
      status_id: String(st.id),
      parent_name: st.name || "",
      name: "",
      sort_order: String(existingSubs.length),
      is_active: true,
    })
    setShowSubModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEditSub(sub: any, parentName: string) {
    setEditingSub(sub)
    setSubForm({
      status_id: String(sub.status_id ?? sub.lead_status_id ?? ""),
      parent_name: parentName,
      name: sub.name || "",
      sort_order: String(sub.sort_order ?? 0),
      is_active: sub.is_active !== false && Number(sub.is_active ?? 1) !== 0,
    })
    setShowSubModal(true)
  }

  async function saveMain(e: React.FormEvent) {
    e.preventDefault()
    if (!mainForm.name.trim()) return
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "statuses",
        action: editingMain ? "update" : "create",
        id: editingMain?.id,
        name: mainForm.name.trim(),
        color: mainForm.color,
        sort_order: Number(mainForm.sort_order || 0),
        is_active: mainForm.is_active,
      }),
    })
    if (res.ok) {
      toast.success(editingMain ? "Lead status updated!" : "Lead status created!")
      setShowMainModal(false)
      load()
    } else {
      toast.error("Failed to save lead status")
    }
  }

  async function saveSub(e: React.FormEvent) {
    e.preventDefault()
    if (!subForm.name.trim() || !subForm.status_id) return
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "sub_statuses",
        action: editingSub ? "update" : "create",
        id: editingSub?.id,
        status_id: Number(subForm.status_id),
        name: subForm.name.trim(),
        sort_order: Number(subForm.sort_order || 0),
        is_active: subForm.is_active,
      }),
    })
    if (res.ok) {
      toast.success(editingSub ? "Sub-status updated!" : "Sub-status added!")
      setShowSubModal(false)
      load()
    } else {
      toast.error("Failed to save sub-status")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-[520px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Lead Status Settings" />

      <Card className="p-5 shadow-xs">
        {/* Card Header — 1:1 with statuses.blade.php */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div>
            <h5 className="text-sm font-bold">Lead Status (Main)</h5>
            <p className="text-xs text-muted-foreground">
              Manage main lead stages and their nested dependent sub-statuses
              inline ({items.length} main statuses · {subStatuses.length}{" "}
              sub-statuses).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search status or sub-status..."
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/lead-settings/sub-statuses">
                Sub-Statuses Table ({subStatuses.length})
              </Link>
            </Button>

            <Button
              size="sm"
              onClick={openAddMain}
              className="bg-[#405189] text-xs text-white hover:bg-[#364574]"
            >
              <Plus className="mr-1 size-3.5" /> Add Lead Status
            </Button>
          </div>
        </div>

        {/* Main Table + Nested Sub-Status Rows (1:1 with statuses.blade.php lines 41-116) */}
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Status Name</th>
                <th className="w-28 px-4 py-2.5">Sort Order</th>
                <th className="w-24 px-4 py-2.5">Active</th>
                <th className="w-36 px-4 py-2.5">Sub Status Count</th>
                <th className="w-64 px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStatuses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No Lead Status found.
                  </td>
                </tr>
              ) : (
                filteredStatuses.map((st) => {
                  const sid = String(st.id)
                  const subs = subsByParent[sid] || []
                  const isActive =
                    st.is_active !== false && Number(st.is_active ?? 1) !== 0
                  const isCollapsed = Boolean(collapsedIds[sid])

                  return (
                    <React.Fragment key={sid}>
                      {/* Parent Main Status Row */}
                      <tr className="bg-background transition hover:bg-muted/25">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {subs.length > 0 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setCollapsedIds((prev) => ({
                                    ...prev,
                                    [sid]: !prev[sid],
                                  }))
                                }
                                title={
                                  isCollapsed
                                    ? "Expand sub-statuses"
                                    : "Collapse sub-statuses"
                                }
                                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="size-3.5" />
                                ) : (
                                  <ChevronDown className="size-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="inline-block w-4" />
                            )}
                            <span
                              className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                              style={{
                                backgroundColor: st.color || "#405189",
                              }}
                            />
                            <span className="font-semibold text-foreground">
                              {st.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono">
                          {st.sort_order ?? 0}
                        </td>

                        <td className="px-4 py-3">
                          {isActive ? (
                            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              No
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="font-mono text-[11px]"
                          >
                            {subs.length}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5 whitespace-nowrap">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => openEditMain(st)}
                              className="border-sky-200 bg-sky-50 text-[11px] text-sky-700 hover:bg-sky-100"
                            >
                              Edit
                            </Button>

                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                confirmDelete({
                                  title: `Delete "${st.name}"?`,
                                  description:
                                    subs.length > 0
                                      ? `Deleting "${st.name}" will also remove its ${subs.length} dependent sub-status(es). This action cannot be undone.`
                                      : `Are you sure you want to delete lead status "${st.name}"?`,
                                  onConfirm: async () => {
                                    await fetch("/api/crm-resources", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        resource: "statuses",
                                        action: "delete",
                                        id: st.id,
                                      }),
                                    })
                                    toast.success("Lead status deleted")
                                    load()
                                  },
                                })
                              }
                              className="border-rose-200 bg-rose-50 text-[11px] text-rose-700 hover:bg-rose-100"
                            >
                              Delete
                            </Button>

                            <Button
                              size="xs"
                              onClick={() => openAddSubFor(st)}
                              className="bg-[#0ab39c] text-[11px] text-white hover:bg-[#099885]"
                            >
                              + Sub Status
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Grouped Nested Sub-Status Row — 1:1 with statuses.blade.php lines 82-110 */}
                      {subs.length > 0 && !isCollapsed && (
                        <tr className="bg-muted/20">
                          <td colSpan={5} className="px-6 py-3">
                            <div className="rounded-md border border-border bg-background p-3 shadow-2xs">
                              <div className="mb-2 flex items-center justify-between">
                                <strong className="text-xs text-foreground">
                                  Sub Statuses for &ldquo;{st.name}&rdquo;:
                                </strong>
                                <span className="text-[11px] text-muted-foreground">
                                  {subs.length} item{subs.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              <ul className="divide-y divide-border">
                                {subs.map((sub) => {
                                  const subActive =
                                    sub.is_active !== false &&
                                    Number(sub.is_active ?? 1) !== 0
                                  return (
                                    <li
                                      key={String(sub.id)}
                                      className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-1 last:pb-0.5"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor:
                                              st.color || "#405189",
                                          }}
                                        />
                                        <span className="font-medium text-foreground">
                                          {sub.name}
                                        </span>
                                        <span className="font-mono text-[10.5px] text-muted-foreground">
                                          (Sort: {sub.sort_order ?? 0})
                                        </span>
                                        {!subActive && (
                                          <Badge
                                            variant="secondary"
                                            className="text-[10px]"
                                          >
                                            Inactive
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          onClick={() =>
                                            openEditSub(sub, st.name)
                                          }
                                          className="h-6 text-[11px]"
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          onClick={() =>
                                            confirmDelete({
                                              title: "Delete this Sub Status?",
                                              description: `Remove sub-status "${sub.name}" under "${st.name}"?`,
                                              onConfirm: async () => {
                                                await fetch(
                                                  "/api/crm-resources",
                                                  {
                                                    method: "POST",
                                                    headers: {
                                                      "Content-Type":
                                                        "application/json",
                                                    },
                                                    body: JSON.stringify({
                                                      resource: "sub_statuses",
                                                      action: "delete",
                                                      id: sub.id,
                                                    }),
                                                  }
                                                )
                                                toast.success(
                                                  "Sub-status deleted"
                                                )
                                                load()
                                              },
                                            })
                                          }
                                          className="h-6 border-rose-200 text-[11px] text-rose-600 hover:bg-rose-50"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Test Dependent Dropdown (Status -> Sub Status) — 1:1 with statuses.blade.php lines 120-140 */}
        <div className="mt-6 border-t border-border pt-5">
          <h6 className="mb-3 text-xs font-bold">
            Test Dependent Dropdown (Status → Sub Status)
          </h6>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Lead Stage</Label>
              <FormSelect
                value={testMainId || "__none__"}
                onValueChange={(v) => {
                  const next = v === "__none__" ? "" : v
                  setTestMainId(next)
                  setTestSubId("")
                }}
                options={[
                  { value: "__none__", label: "Select Lead Status" },
                  ...items
                    .filter(
                      (s) =>
                        s.is_active !== false && Number(s.is_active ?? 1) !== 0
                    )
                    .map((s) => ({
                      value: String(s.id),
                      label: s.name,
                    })),
                ]}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Lead Sub Stage</Label>
              <FormSelect
                value={testSubId || "__none__"}
                onValueChange={(v) => setTestSubId(v === "__none__" ? "" : v)}
                disabled={!testMainId}
                options={[
                  {
                    value: "__none__",
                    label: !testMainId
                      ? "Select Lead Status first"
                      : dependentSubOptions.length === 0
                        ? "No Sub Status configured"
                        : "Select Sub Status",
                  },
                  ...dependentSubOptions,
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Create / Edit Main Lead Status Modal */}
      <Dialog open={showMainModal} onOpenChange={setShowMainModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMain ? "Edit Lead Status" : "Add Lead Status"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure main lead stage name, badge color, sort order, and
              active state.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMain} className="space-y-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Status Name *</Label>
              <Input
                required
                value={mainForm.name}
                onChange={(e) =>
                  setMainForm({ ...mainForm, name: e.target.value })
                }
                placeholder="e.g., Application Submitted"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Badge Color</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={mainForm.color}
                  onChange={(e) =>
                    setMainForm({ ...mainForm, color: e.target.value })
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-border p-0.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMainForm({ ...mainForm, color: c })}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        mainForm.color === c
                          ? "scale-110 border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={mainForm.sort_order}
                  onChange={(e) =>
                    setMainForm({ ...mainForm, sort_order: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={mainForm.is_active}
                  onCheckedChange={(v) =>
                    setMainForm({ ...mainForm, is_active: v })
                  }
                />
                <Label className="text-xs">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMainModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                {editingMain ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Sub-Status Modal */}
      <Dialog open={showSubModal} onOpenChange={setShowSubModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSub
                ? "Edit Sub Status"
                : `Add Sub Status (${subForm.parent_name})`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sub-statuses appear dynamically when counsellors select &ldquo;
              {subForm.parent_name}&rdquo; on a lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSub} className="space-y-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Main Lead Status *</Label>
              <FormSelect
                value={subForm.status_id}
                onValueChange={(v) => {
                  const found = items.find((x) => String(x.id) === v)
                  setSubForm({
                    ...subForm,
                    status_id: v,
                    parent_name: found?.name || subForm.parent_name,
                  })
                }}
                options={items.map((st) => ({
                  value: String(st.id),
                  label: st.name,
                }))}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Sub Status Name *</Label>
              <Input
                required
                value={subForm.name}
                onChange={(e) =>
                  setSubForm({ ...subForm, name: e.target.value })
                }
                placeholder="e.g., RNR / Call Back Tomorrow / Docs Pending"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 items-center gap-4">
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={subForm.sort_order}
                  onChange={(e) =>
                    setSubForm({ ...subForm, sort_order: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch
                  checked={subForm.is_active}
                  onCheckedChange={(v) =>
                    setSubForm({ ...subForm, is_active: v })
                  }
                />
                <Label className="text-xs">Active</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                {editingSub ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
