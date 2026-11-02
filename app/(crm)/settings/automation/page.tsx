"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const TRIGGERS = [
  ["lead.created", "Lead Created"],
  ["lead.assigned", "Lead Assigned"],
  ["lead.status.changed", "Lead Status Changed"],
  ["lead.followup.missed", "Follow-up Missed"],
  ["lead.inactive", "Lead Inactive"],
  ["lead.converted", "Lead Converted"],
]

export default function AutomationRulesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rules, setRules] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [showBuilder, setShowBuilder] = React.useState(false)
  const [name, setName] = React.useState("")
  const [triggerEvent, setTriggerEvent] = React.useState("lead.created")
  const [conditions, setConditions] = React.useState<
    { field: string; operator: string; value: string }[]
  >([])
  const [actions, setActions] = React.useState<
    { type: string; value: string }[]
  >([{ type: "send_whatsapp", value: "Welcome_Brochure_2026" }])

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=automation_rules")
      .then((r) => r.json())
      .then((d) => setRules(d.items || []))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openNew = React.useCallback(() => {
    setEditing(null)
    setName("")
    setTriggerEvent("lead.created")
    setConditions([{ field: "city", operator: "=", value: "Delhi" }])
    setActions([{ type: "send_whatsapp", value: "Welcome_Brochure_2026" }])
    setShowBuilder(true)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = React.useCallback((r: any) => {
    setEditing(r)
    setName(r.name || "")
    setTriggerEvent(r.trigger_event || "lead.created")
    try {
      const c = JSON.parse(r.conditions || "[]")
      setConditions(Array.isArray(c) ? c : [])
    } catch {
      setConditions([])
    }
    try {
      const a = JSON.parse(r.actions || "[]")
      setActions(
        Array.isArray(a)
          ? a
          : [{ type: "send_whatsapp", value: "Welcome_Brochure_2026" }]
      )
    } catch {
      setActions([])
    }
    setShowBuilder(true)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "trigger_event",
        header: "Trigger Event",
        cell: ({ row }) => (
          <span className="font-mono text-[#405189]">
            {row.original.trigger_event}
          </span>
        ),
      },
      {
        accessorFn: (r) => r.conditions || "Any",
        id: "conditions",
        header: "IF Conditions",
        cell: ({ row }) => (
          <div className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
            {row.original.conditions || "Any"}
          </div>
        ),
      },
      {
        accessorFn: (r) => r.actions || "",
        id: "rule_actions",
        header: "THEN Actions",
        cell: ({ row }) => (
          <div className="max-w-xs truncate font-mono text-[11px] text-muted-foreground">
            {row.original.actions}
          </div>
        ),
      },
      {
        accessorFn: (r) => (r.is_active ? "Active" : "Paused"),
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const r = row.original
          return (
            <Badge
              onClick={async () => {
                await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "automation_rules",
                    action: "toggle",
                    id: r.id,
                  }),
                })
                toast.success("Rule status toggled")
                load()
              }}
              className={`cursor-pointer text-[10px] font-semibold ${
                r.is_active
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {r.is_active ? "Active (Click to Pause)" : "Paused"}
            </Badge>
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
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={async () => {
                  await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "automation_rules",
                      action: "delete",
                      id: r.id,
                    }),
                  })
                  toast.success("Rule deleted")
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
    [load, openEdit]
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Automation Rules" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          columns={columns}
          data={rules}
          searchPlaceholder="Search automation rules..."
          toolbarRight={
            <Button
              size="sm"
              onClick={openNew}
              className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
            >
              + Add Automation
            </Button>
          }
        />
      </Card>

      <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Automation Rule" : "Create Automation Rule"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define IF/THEN workflow triggers and automated counselling actions.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "automation_rules",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  name,
                  trigger_event: triggerEvent,
                  conditions,
                  actions,
                  is_active: true,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing
                    ? "Automation rule updated!"
                    : "Automation rule saved!"
                )
                setShowBuilder(false)
                load()
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Rule Name *</Label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Instant WhatsApp Brochure on New Lead"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Trigger Event *</Label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  {TRIGGERS.map(([val, label]) => (
                    <option key={val} value={val}>
                      {label} ({val})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">IF Conditions</span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setConditions([
                      ...conditions,
                      { field: "lead_score", operator: ">=", value: "20" },
                    ])
                  }
                >
                  + Add Condition
                </Button>
              </div>
              {conditions.map((c, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-12"
                >
                  <select
                    value={c.field}
                    onChange={(e) => {
                      const next = [...conditions]
                      next[idx].field = e.target.value
                      setConditions(next)
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs sm:col-span-4"
                  >
                    <option value="city">City</option>
                    <option value="lead_score">Lead Score</option>
                    <option value="source">Lead Source</option>
                    <option value="status">Lead Status</option>
                  </select>
                  <select
                    value={c.operator}
                    onChange={(e) => {
                      const next = [...conditions]
                      next[idx].operator = e.target.value
                      setConditions(next)
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs sm:col-span-3"
                  >
                    <option value="=">Equals (=)</option>
                    <option value="!=">Not Equals (!=)</option>
                    <option value=">=">&gt;=</option>
                  </select>
                  <Input
                    value={c.value}
                    onChange={(e) => {
                      const next = [...conditions]
                      next[idx].value = e.target.value
                      setConditions(next)
                    }}
                    placeholder="Value"
                    className="h-8 text-xs sm:col-span-4"
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() =>
                      setConditions(conditions.filter((_, i) => i !== idx))
                    }
                    className="text-rose-500 sm:col-span-1"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">THEN Actions</span>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setActions([
                      ...actions,
                      { type: "send_email", value: "Admissions_Welcome" },
                    ])
                  }
                >
                  + Add Action
                </Button>
              </div>
              {actions.map((a, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 sm:grid-cols-12"
                >
                  <select
                    value={a.type}
                    onChange={(e) => {
                      const next = [...actions]
                      next[idx].type = e.target.value
                      setActions(next)
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs sm:col-span-5"
                  >
                    <option value="send_whatsapp">Send WhatsApp Template</option>
                    <option value="send_sms">Send SMS Template</option>
                    <option value="send_email">Send Email Template</option>
                    <option value="assign_round_robin">
                      Assign via Round-Robin
                    </option>
                    <option value="trigger_ivr">Trigger Outbound IVR</option>
                  </select>
                  <Input
                    value={a.value}
                    onChange={(e) => {
                      const next = [...actions]
                      next[idx].value = e.target.value
                      setActions(next)
                    }}
                    placeholder="Template / Target"
                    className="h-8 text-xs sm:col-span-6"
                  />
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() =>
                      setActions(actions.filter((_, i) => i !== idx))
                    }
                    className="text-rose-500 sm:col-span-1"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBuilder(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Automation Rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
