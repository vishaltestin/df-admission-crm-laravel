"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Trash2, Workflow, X } from "lucide-react"
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

interface ConditionRow {
  rowKey: string
  field: string
  operator: string
  value: string
}

const TRIGGER_OPTIONS = [
  { value: "lead.created", label: "Lead Created" },
  { value: "lead.assigned", label: "Lead Assigned" },
  { value: "lead.status.changed", label: "Lead Status Changed" },
  { value: "lead.followup.missed", label: "Follow-up Missed" },
  { value: "lead.inactive", label: "Lead Inactive" },
  { value: "lead.converted", label: "Lead Converted" },
]

const CONDITION_FIELD_OPTIONS = [
  { value: "institute", label: "Institute" },
  { value: "program", label: "Program (requires Institute)" },
  { value: "course", label: "Course (requires Institute + Program)" },
  { value: "status", label: "Lead Status" },
  { value: "substatus", label: "Sub-Status (requires Status)" },
  { value: "source", label: "Lead Source" },
  { value: "state", label: "State" },
  { value: "city", label: "City (requires State)" },
]

const ACTION_TYPE_OPTIONS = [
  { value: "send_email", label: "Communication — Send Email" },
  { value: "send_whatsapp", label: "Communication — Send WhatsApp" },
  { value: "send_sms", label: "Communication — Send SMS" },
  { value: "assign_team", label: "Assignment — Assign Team" },
  { value: "assign_user", label: "Assignment — Assign User" },
  { value: "change_status", label: "Pipeline — Update Lead Status" },
]

function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback
  if (typeof raw === "object") return raw as T
  try {
    return JSON.parse(String(raw)) as T
  } catch {
    return fallback
  }
}

export default function AutomationSettingsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])

  // Organization Master Data for Cascading Dropdowns & Action Pickers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statuses, setStatuses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subStatuses, setSubStatuses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sources, setSources] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [states, setStates] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [citiesByState, setCitiesByState] = React.useState<Record<string, any[]>>({})
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailTemplates, setEmailTemplates] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [whatsappTemplates, setWhatsappTemplates] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [smsTemplates, setSmsTemplates] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = React.useState<any[]>([])

  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Create / Edit Modal State (1:1 with settings/automation/create.blade.php)
  const [showModal, setShowModal] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [name, setName] = React.useState("")
  const [triggerEvent, setTriggerEvent] = React.useState("lead.created")
  const [isActive, setIsActive] = React.useState(true)
  const [conditions, setConditions] = React.useState<ConditionRow[]>([])
  const [actionType, setActionType] = React.useState("send_whatsapp")
  const [actionData, setActionData] = React.useState<{
    template_id: string
    team_id: string
    user_id: string
    status_id: string
    delay_minutes: string
  }>({
    template_id: "",
    team_id: "",
    user_id: "",
    status_id: "",
    delay_minutes: "0",
  })

  const loadCitiesForState = React.useCallback(async (stateId: string) => {
    if (!stateId) return
    const res = await fetch(
      `/api/crm-resources?resource=automation_cities&state_id=${encodeURIComponent(stateId)}`
    )
    const d = await res.json()
    setCitiesByState((prev) => ({ ...prev, [stateId]: d.items || [] }))
  }, [])

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/crm-resources?resource=automation_rules")
      const d = await r.json()
      setItems(d.items || [])
      setInstitutes(d.institutes || [])
      setPrograms(d.programs || [])
      setCourses(d.courses || [])
      setStatuses(d.statuses || [])
      setSubStatuses(d.subStatuses || [])
      setSources(d.sources || [])
      setStates(d.states || [])
      setEmailTemplates(d.emailTemplates || [])
      setWhatsappTemplates(d.whatsappTemplates || [])
      setSmsTemplates(d.smsTemplates || [])
      setTeams(d.teams || [])
      setUsers(d.users || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const makeConditionRow = (
    field = "",
    operator = "=",
    value = ""
  ): ConditionRow => ({
    rowKey: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    field,
    operator,
    value,
  })

  // Find latest selected condition value for parent cascading (matches getSelectedValue() in create.blade.php)
  const getSelectedConditionValue = React.useCallback(
    (fieldName: string, rows: ConditionRow[] = conditions) => {
      for (let i = rows.length - 1; i >= 0; i--) {
        if (rows[i].field === fieldName && rows[i].value) {
          return rows[i].value
        }
      }
      return ""
    },
    [conditions]
  )

  // Ensure cities are loaded whenever a state condition value is selected
  React.useEffect(() => {
    const stateVal = getSelectedConditionValue("state")
    if (stateVal && !citiesByState[stateVal]) {
      loadCitiesForState(stateVal)
    }
  }, [conditions, citiesByState, getSelectedConditionValue, loadCitiesForState])

  function openCreate() {
    setEditing(null)
    setName("")
    setTriggerEvent("lead.created")
    setIsActive(true)
    setConditions([makeConditionRow("status", "=", "")])
    setActionType("send_whatsapp")
    setActionData({
      template_id: whatsappTemplates[0] ? String(whatsappTemplates[0].id) : "",
      team_id: teams[0] ? String(teams[0].id) : "",
      user_id: users[0] ? String(users[0].id) : "",
      status_id: statuses[0] ? String(statuses[0].id) : "",
      delay_minutes: "0",
    })
    setShowModal(true)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEdit(rule: any) {
    setEditing(rule)
    setName(rule.name || "")
    setTriggerEvent(rule.trigger_event || "lead.created")
    setIsActive(Boolean(rule.is_active ?? true))

    const rawConds = parseJsonSafe<
      { field?: string; operator?: string; value?: string }[]
    >(rule.conditions, [])
    const mappedConds =
      Array.isArray(rawConds) && rawConds.length > 0
        ? rawConds.map((c) =>
            makeConditionRow(
              String(c.field || ""),
              String(c.operator || "="),
              String(c.value ?? "")
            )
          )
        : [makeConditionRow("", "=", "")]
    setConditions(mappedConds)

    // Preload cities if a state condition exists
    const stRow = mappedConds.find((c) => c.field === "state" && c.value)
    if (stRow?.value) {
      loadCitiesForState(stRow.value)
    }

    // Parse both Laravel `{ type, data: { template_id / team_id / user_id } }` and legacy `[{ type, value }]`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawActions = parseJsonSafe<any>(rule.actions, {})
    let resolvedType = "send_whatsapp"
    let tplId = ""
    let tmId = ""
    let usrId = ""
    let stId = ""
    let delayMin = "0"

    if (Array.isArray(rawActions) && rawActions.length > 0) {
      const first = rawActions[0] || {}
      resolvedType = String(first.type || "send_whatsapp")
      const val = String(first.value || "")
      if (
        resolvedType === "send_email" ||
        resolvedType === "send_whatsapp" ||
        resolvedType === "send_sms"
      ) {
        tplId = val
      } else if (resolvedType === "assign_team") {
        tmId = val
      } else if (resolvedType === "assign_user") {
        usrId = val
      } else if (resolvedType === "change_status") {
        stId = val
      }
    } else if (rawActions && typeof rawActions === "object") {
      resolvedType = String(rawActions.type || "send_whatsapp")
      const d = rawActions.data || rawActions
      tplId = d.template_id ? String(d.template_id) : ""
      tmId = d.team_id ? String(d.team_id) : ""
      usrId = d.user_id ? String(d.user_id) : ""
      stId = d.status_id ? String(d.status_id) : ""
      delayMin = d.delay_minutes ? String(d.delay_minutes) : "0"
    }

    setActionType(resolvedType)
    setActionData({
      template_id: tplId,
      team_id: tmId,
      user_id: usrId,
      status_id: stId,
      delay_minutes: delayMin,
    })
    setShowModal(true)
  }

  function getConditionValueOptions(field: string): {
    options: { value: string; label: string }[]
    placeholder: string
    disabled?: boolean
  } {
    if (field === "institute") {
      return {
        placeholder: "Select Institute",
        options: institutes.map((i) => ({
          value: String(i.id),
          label: i.name || `Institute #${i.id}`,
        })),
      }
    }

    if (field === "program") {
      const instId = getSelectedConditionValue("institute")
      if (!instId) {
        return {
          placeholder: "Select Institute First",
          options: [],
          disabled: true,
        }
      }
      const filtered = programs.filter(
        (p) => String(p.institute_id) === String(instId)
      )
      return {
        placeholder:
          filtered.length > 0 ? "Select Program" : "No programs for institute",
        options: filtered.map((p) => ({
          value: String(p.id),
          label: p.name,
        })),
      }
    }

    if (field === "course") {
      const instId = getSelectedConditionValue("institute")
      const progId = getSelectedConditionValue("program")
      if (!instId) {
        return {
          placeholder: "Select Institute First",
          options: [],
          disabled: true,
        }
      }
      if (!progId) {
        return {
          placeholder: "Select Program First",
          options: [],
          disabled: true,
        }
      }
      const filtered = courses.filter(
        (c) => String(c.program_id || "") === String(progId)
      )
      return {
        placeholder:
          filtered.length > 0 ? "Select Course" : "No courses for program",
        options: filtered.map((c) => ({
          value: String(c.id),
          label: c.name || c.sku || `Course #${c.id}`,
        })),
      }
    }

    if (field === "status") {
      return {
        placeholder: "Select Lead Status",
        options: statuses.map((s) => ({
          value: String(s.id),
          label: s.name,
        })),
      }
    }

    if (field === "substatus") {
      const statusId = getSelectedConditionValue("status")
      if (!statusId) {
        return {
          placeholder: "Select Lead Status First",
          options: [],
          disabled: true,
        }
      }
      const filtered = subStatuses.filter(
        (sub) => String(sub.lead_status_id) === String(statusId)
      )
      return {
        placeholder:
          filtered.length > 0 ? "Select Sub-Status" : "No sub-statuses found",
        options: filtered.map((sub) => ({
          value: String(sub.id),
          label: sub.name,
        })),
      }
    }

    if (field === "source") {
      return {
        placeholder: "Select Lead Source",
        options: sources.map((s) => ({
          value: String(s.id),
          label: s.name,
        })),
      }
    }

    if (field === "state") {
      return {
        placeholder: "Select State",
        options: states.map((s) => ({
          value: String(s.id),
          label: s.name || `State #${s.id}`,
        })),
      }
    }

    if (field === "city") {
      const stateId = getSelectedConditionValue("state")
      if (!stateId) {
        return {
          placeholder: "Select State First",
          options: [],
          disabled: true,
        }
      }
      const list = citiesByState[stateId] || []
      return {
        placeholder: list.length > 0 ? "Select City" : "Loading cities...",
        options: list.map((c) => ({
          value: String(c.id),
          label: c.name,
        })),
      }
    }

    return { placeholder: "Select Condition Field First", options: [] }
  }

  function updateConditionValue(idx: number, newVal: string) {
    setConditions((prev) => {
      const changedField = prev[idx]?.field
      return prev.map((row, i) => {
        if (i === idx) return { ...row, value: newVal }
        // Cascade resets matching create.blade.php resetField()
        if (
          changedField === "institute" &&
          (row.field === "program" || row.field === "course")
        ) {
          return { ...row, value: "" }
        }
        if (changedField === "program" && row.field === "course") {
          return { ...row, value: "" }
        }
        if (changedField === "status" && row.field === "substatus") {
          return { ...row, value: "" }
        }
        if (changedField === "state" && row.field === "city") {
          return { ...row, value: "" }
        }
        return row
      })
    })
  }

  // Resolve human-readable labels for table display
  const resolveConditionLabel = React.useCallback(
    (c: { field?: string; operator?: string; value?: string }) => {
      const f = String(c.field || "")
      const op = String(c.operator || "=")
      const v = String(c.value ?? "")
      if (!f) return ""
      let vLabel = v
      if (f === "institute") {
        vLabel =
          institutes.find((x) => String(x.id) === v)?.name || `Institute #${v}`
      } else if (f === "program") {
        vLabel =
          programs.find((x) => String(x.id) === v)?.name || `Program #${v}`
      } else if (f === "course") {
        vLabel = courses.find((x) => String(x.id) === v)?.name || `Course #${v}`
      } else if (f === "status") {
        vLabel =
          statuses.find((x) => String(x.id) === v)?.name || `Status #${v}`
      } else if (f === "substatus") {
        vLabel =
          subStatuses.find((x) => String(x.id) === v)?.name ||
          `Sub-Status #${v}`
      } else if (f === "source") {
        vLabel = sources.find((x) => String(x.id) === v)?.name || `Source #${v}`
      } else if (f === "state") {
        vLabel = states.find((x) => String(x.id) === v)?.name || `State #${v}`
      }
      return `${f} ${op} ${vLabel}`
    },
    [institutes, programs, courses, statuses, subStatuses, sources, states]
  )

  const resolveActionSummary = React.useCallback(
    (raw: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = parseJsonSafe<any>(raw, null)
      if (!parsed) return "—"

      if (Array.isArray(parsed)) {
        return parsed
          .map((a) => `${a.type || "action"}${a.value ? `: ${a.value}` : ""}`)
          .join(", ")
      }

      const type = String(parsed.type || "")
      const data = parsed.data || {}
      if (type === "send_email") {
        const tpl = emailTemplates.find(
          (t) => String(t.id) === String(data.template_id)
        )
        return `Send Email → ${tpl?.title || `#${data.template_id || "—"}`}`
      }
      if (type === "send_whatsapp") {
        const tpl = whatsappTemplates.find(
          (t) => String(t.id) === String(data.template_id)
        )
        return `Send WhatsApp → ${tpl?.title || `#${data.template_id || "—"}`}`
      }
      if (type === "send_sms") {
        const tpl = smsTemplates.find(
          (t) => String(t.id) === String(data.template_id)
        )
        return `Send SMS → ${tpl?.title || `#${data.template_id || "—"}`}`
      }
      if (type === "assign_team") {
        const tm = teams.find((t) => String(t.id) === String(data.team_id))
        return `Assign Team → ${tm?.name || `#${data.team_id || "—"}`}`
      }
      if (type === "assign_user") {
        const usr = users.find((u) => String(u.id) === String(data.user_id))
        return `Assign User → ${usr?.name || `#${data.user_id || "—"}`}`
      }
      if (type === "change_status") {
        const st = statuses.find((s) => String(s.id) === String(data.status_id))
        return `Set Status → ${st?.name || `#${data.status_id || "—"}`}`
      }
      return type || "—"
    },
    [emailTemplates, whatsappTemplates, smsTemplates, teams, users, statuses]
  )

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Rule Name is required")
      return
    }
    if (!triggerEvent) {
      toast.error("Trigger Event is required")
      return
    }
    if (!actionType) {
      toast.error("Action Type is required")
      return
    }

    const cleanConds = conditions
      .filter((c) => c.field && c.value !== "")
      .map((c) => ({
        field: c.field,
        operator: c.operator || "=",
        value: c.value,
      }))

    const payloadActionData: Record<string, string | number> = {}
    if (
      actionType === "send_email" ||
      actionType === "send_whatsapp" ||
      actionType === "send_sms"
    ) {
      if (!actionData.template_id) {
        toast.error("Please select a communication template for this action")
        return
      }
      payloadActionData.template_id = actionData.template_id
    } else if (actionType === "assign_team") {
      if (!actionData.team_id) {
        toast.error("Please select a Team to assign")
        return
      }
      payloadActionData.team_id = actionData.team_id
    } else if (actionType === "assign_user") {
      if (!actionData.user_id) {
        toast.error("Please select a User to assign")
        return
      }
      payloadActionData.user_id = actionData.user_id
    } else if (actionType === "change_status") {
      if (!actionData.status_id) {
        toast.error("Please select a target Lead Status")
        return
      }
      payloadActionData.status_id = actionData.status_id
    }

    if (Number(actionData.delay_minutes || 0) > 0) {
      payloadActionData.delay_minutes = Number(actionData.delay_minutes)
    }

    setSaving(true)
    try {
      const res = await fetch("/api/crm-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "automation_rules",
          action: editing ? "update" : "create",
          id: editing?.id,
          name: name.trim(),
          trigger_event: triggerEvent,
          conditions: cleanConds,
          action_type: actionType,
          action_data: payloadActionData,
          is_active: isActive,
        }),
      })
      const out = await res.json()
      if (res.ok) {
        toast.success(
          editing ? "Automation rule updated!" : "Automation rule created!"
        )
        setShowModal(false)
        load()
      } else {
        toast.error(out.error || "Failed to save automation rule")
      }
    } finally {
      setSaving(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={items.length > 0 && selectedIds.length === items.length}
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? items.map((r) => String(r.id)) : [])
            }
            aria-label="Select all automation rules"
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
              aria-label={`Select ${row.original.name}`}
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.name || `Rule #${row.original.id}`}
          </span>
        ),
      },
      {
        accessorKey: "trigger_event",
        header: "Trigger",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px]">
            {row.original.trigger_event}
          </Badge>
        ),
      },
      {
        id: "conditions",
        header: "IF Conditions",
        cell: ({ row }) => {
          const conds = parseJsonSafe<
            { field?: string; operator?: string; value?: string }[]
          >(row.original.conditions, [])
          return (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(conds) && conds.length > 0 ? (
                conds.map((c, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]"
                  >
                    {resolveConditionLabel(c)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  All matching events
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: "actions_summary",
        header: "THEN Action",
        cell: ({ row }) => (
          <Badge className="bg-[#405189]/10 text-[10.5px] font-medium text-[#405189]">
            {resolveActionSummary(row.original.actions)}
          </Badge>
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
                      resource: "automation_rules",
                      action: "toggle",
                      id: r.id,
                    }),
                  })
                  toast.success("Automation status updated")
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
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => openEdit(r)}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Automation Rule?",
                    description: `Are you sure you want to delete automation rule "${r.name}"?`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "automation_rules",
                          action: "delete",
                          id: r.id,
                        }),
                      })
                      toast.success("Automation rule deleted")
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
    [
      items,
      selectedIds,
      load,
      confirmDelete,
      resolveConditionLabel,
      resolveActionSummary,
    ]
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
      <BreadcrumbBar parent="CRM" title="Automation Rules" />

      <Card className="p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3.5">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold">
              <Workflow className="size-4 text-[#405189]" />
              Workflow Automation Rules ({items.length})
            </h4>
            <p className="text-xs text-muted-foreground">
              Trigger automatic Email, WhatsApp, or SMS templates and Team /
              Counsellor assignments when leads match Institute, Program,
              Course, Status, Sub-Status, State, or City conditions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: `Delete ${selectedIds.length} Automation Rule(s)?`,
                    description: `Permanently delete ${selectedIds.length} selected automation workflow(s)?`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "automation_rules",
                          action: "bulk_delete",
                          ids: selectedIds.map(Number),
                        }),
                      })
                      toast.success("Selected automation rules deleted")
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
              onClick={openCreate}
              className="bg-[#405189] text-xs text-white hover:bg-[#364574]"
            >
              <Plus className="mr-1 size-3.5" /> Add Automation
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search automation rules..."
          emptyMessage="No automation rules configured."
        />
      </Card>

      {/* Create / Edit Automation Rule Modal — 1:1 with settings/automation/create.blade.php */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Automation Rule" : "Create Automation Rule"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the <strong>WHEN</strong> trigger event, cascading{" "}
              <strong>IF Conditions</strong> (Institute → Program → Course,
              Status → Sub-Status, State → City), and <strong>THEN Action</strong>{" "}
              (Email / WhatsApp / SMS Template or Team / User Assignment).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6">
                <Label className="mb-1 block text-xs">
                  Rule Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Instant WhatsApp Brochure on New B.Tech Lead"
                  className="h-9 text-xs"
                />
              </div>

              <div className="md:col-span-4">
                <Label className="mb-1 block text-xs">
                  Trigger Event <span className="text-destructive">*</span>
                </Label>
                <FormSelect
                  value={triggerEvent}
                  onValueChange={setTriggerEvent}
                  options={TRIGGER_OPTIONS}
                />
              </div>

              <div className="flex items-end pb-1.5 md:col-span-2">
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <Label className="text-xs font-semibold">Active</Label>
                </div>
              </div>
            </div>

            {/* IF CONDITIONS BUILDER */}
            <div className="space-y-2.5 rounded-md border border-border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground">
                    IF Conditions (AND Match)
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Leave empty to run on every matching trigger event, or add
                    cascading organization filters below.
                  </p>
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setConditions((prev) => [
                      ...prev,
                      makeConditionRow("", "=", ""),
                    ])
                  }
                >
                  <Plus className="mr-1 size-3" /> Add Condition
                </Button>
              </div>

              {conditions.length === 0 ? (
                <div className="rounded border border-dashed border-border bg-background px-3 py-2.5 text-center text-[11px] text-muted-foreground">
                  No conditions added — rule executes for all leads triggering{" "}
                  <code>{triggerEvent}</code>.
                </div>
              ) : (
                <div className="space-y-2">
                  {conditions.map((c, idx) => {
                    const valueMeta = getConditionValueOptions(c.field)
                    return (
                      <div
                        key={c.rowKey}
                        className="grid grid-cols-1 gap-2 rounded border border-border bg-background p-2 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-4">
                          <FormSelect
                            value={c.field || "__none__"}
                            onValueChange={(v) => {
                              const nextField = v === "__none__" ? "" : v
                              setConditions((prev) =>
                                prev.map((row, i) =>
                                  i === idx
                                    ? { ...row, field: nextField, value: "" }
                                    : row
                                )
                              )
                            }}
                            options={[
                              { value: "__none__", label: "Select Field" },
                              ...CONDITION_FIELD_OPTIONS,
                            ]}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <FormSelect
                            value={c.operator}
                            onValueChange={(v) =>
                              setConditions((prev) =>
                                prev.map((row, i) =>
                                  i === idx ? { ...row, operator: v } : row
                                )
                              )
                            }
                            options={[
                              { value: "=", label: "=" },
                              { value: "!=", label: "!=" },
                              { value: "contains", label: "Contains" },
                            ]}
                          />
                        </div>

                        <div className="sm:col-span-5">
                          {c.field && c.operator !== "contains" ? (
                            <FormSelect
                              value={c.value || "__none__"}
                              disabled={valueMeta.disabled}
                              onValueChange={(v) =>
                                updateConditionValue(
                                  idx,
                                  v === "__none__" ? "" : v
                                )
                              }
                              options={[
                                {
                                  value: "__none__",
                                  label: valueMeta.placeholder,
                                },
                                ...valueMeta.options,
                              ]}
                            />
                          ) : (
                            <Input
                              value={c.value}
                              onChange={(e) =>
                                updateConditionValue(idx, e.target.value)
                              }
                              placeholder={
                                c.field
                                  ? "Enter value to match..."
                                  : "Select a Field first"
                              }
                              disabled={!c.field}
                              className="h-9 text-xs"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-end sm:col-span-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="destructive"
                            onClick={() =>
                              setConditions((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            title="Remove condition"
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* THEN ACTION SECTION — 1:1 with settings/automation/create.blade.php */}
            <div className="space-y-3 rounded-md border border-[#0ab39c]/30 bg-[#0ab39c]/5 p-4">
              <div>
                <h5 className="font-bold text-[#0ab39c]">THEN Action</h5>
                <p className="text-[11px] text-muted-foreground">
                  Select the communication template or counsellor/team
                  assignment to execute when conditions pass.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label className="mb-1 block text-xs">
                    Action Type <span className="text-destructive">*</span>
                  </Label>
                  <FormSelect
                    value={actionType}
                    onValueChange={(v) => {
                      setActionType(v)
                      if (v === "send_email") {
                        setActionData((prev) => ({
                          ...prev,
                          template_id: emailTemplates[0]
                            ? String(emailTemplates[0].id)
                            : "",
                        }))
                      } else if (v === "send_whatsapp") {
                        setActionData((prev) => ({
                          ...prev,
                          template_id: whatsappTemplates[0]
                            ? String(whatsappTemplates[0].id)
                            : "",
                        }))
                      } else if (v === "send_sms") {
                        setActionData((prev) => ({
                          ...prev,
                          template_id: smsTemplates[0]
                            ? String(smsTemplates[0].id)
                            : "",
                        }))
                      }
                    }}
                    options={ACTION_TYPE_OPTIONS}
                  />
                </div>

                {/* Dynamic Target Picker based on Action Type */}
                <div className="sm:col-span-5">
                  {actionType === "send_email" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        Email Template <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.template_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            template_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          {
                            value: "__none__",
                            label: "Select Email Template",
                          },
                          ...emailTemplates.map((t) => ({
                            value: String(t.id),
                            label: `${t.title}${t.category ? ` (${t.category})` : ""}`,
                          })),
                        ]}
                      />
                    </>
                  )}

                  {actionType === "send_whatsapp" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        WhatsApp Template{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.template_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            template_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          {
                            value: "__none__",
                            label: "Select WhatsApp Template",
                          },
                          ...whatsappTemplates.map((t) => ({
                            value: String(t.id),
                            label: `${t.title}${t.category ? ` (${t.category})` : ""}`,
                          })),
                        ]}
                      />
                    </>
                  )}

                  {actionType === "send_sms" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        SMS Template <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.template_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            template_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          {
                            value: "__none__",
                            label: "Select SMS Template",
                          },
                          ...smsTemplates.map((t) => ({
                            value: String(t.id),
                            label: `${t.title}${t.category ? ` (${t.category})` : ""}`,
                          })),
                        ]}
                      />
                    </>
                  )}

                  {actionType === "assign_team" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        Select Team <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.team_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            team_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          { value: "__none__", label: "Select Team" },
                          ...teams.map((t) => ({
                            value: String(t.id),
                            label: t.name || `Team #${t.id}`,
                          })),
                        ]}
                      />
                    </>
                  )}

                  {actionType === "assign_user" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        Select User <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.user_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            user_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          { value: "__none__", label: "Select User" },
                          ...users.map((u) => ({
                            value: String(u.id),
                            label: u.name || u.email || `User #${u.id}`,
                          })),
                        ]}
                      />
                    </>
                  )}

                  {actionType === "change_status" && (
                    <>
                      <Label className="mb-1 block text-xs">
                        Target Lead Status{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <FormSelect
                        value={actionData.status_id || "__none__"}
                        onValueChange={(v) =>
                          setActionData({
                            ...actionData,
                            status_id: v === "__none__" ? "" : v,
                          })
                        }
                        options={[
                          { value: "__none__", label: "Select Status" },
                          ...statuses.map((s) => ({
                            value: String(s.id),
                            label: s.name,
                          })),
                        ]}
                      />
                    </>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <Label className="mb-1 block text-xs">Delay (Min)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10080}
                    value={actionData.delay_minutes}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        delay_minutes: e.target.value,
                      })
                    }
                    placeholder="0"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Automation"
                    : "Save Automation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
