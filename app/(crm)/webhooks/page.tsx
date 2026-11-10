"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

type KV = { key: string; value: string }

interface WebhookRow {
  id: string | number
  name: string
  entity_type: string
  description?: string | null
  method: string
  end_point: string
  query_params?: string | null
  headers?: string | null
  payload_type: string
  raw_payload_type?: string | null
  payload?: string | null
}

function parseKv(raw?: string | null): KV[] {
  if (!raw) return []
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed).map(([k, v]) => ({
        key: k,
        value: String(v ?? ""),
      }))
    }
  } catch {
    // ignore malformed json
  }
  return []
}

function buildDefaultSamplePayload(entityType: string) {
  const sampleByEntity: Record<string, Record<string, unknown>> = {
    leads: {
      id: 1042,
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      mobile: "9876543210",
      city: "Delhi",
      state: "Delhi",
      institute_id: 1,
      programme_id: 2,
      lead_source_id: 1,
      pipeline_id: 1,
      stage_id: 1,
      stage_name: "New Lead",
      lead_assign_to: 4,
      created_at: "2026-11-05T10:30:00Z",
    },
    contacts: {
      id: 308,
      name: "Priya Nair",
      emails: ["priya.nair@example.com"],
      contact_numbers: ["9811122233"],
      organization_id: 1,
    },
    persons: {
      id: 308,
      name: "Priya Nair",
      emails: ["priya.nair@example.com"],
      contact_numbers: ["9811122233"],
      organization_id: 1,
    },
    deals: {
      id: 512,
      title: "MBA 2026-27 Admission Seat",
      amount: 145000,
      currency: "INR",
      stage: "Application Submitted",
      lead_id: 1042,
    },
    quotes: {
      id: 512,
      subject: "Fee Structure Quote — B.Tech CSE",
      grand_total: 125000,
      lead_id: 1042,
    },
    organizations: {
      id: 1,
      name: "Assam Down Town University",
      status: "active",
    },
    activities: {
      id: 890,
      type: "call",
      title: "Counselling Follow-up Completed",
      lead_id: 1042,
      is_done: true,
    },
  }

  return JSON.stringify(
    {
      event: `${entityType || "leads"}.created`,
      entity_type: entityType || "leads",
      organization_id: 1,
      dispatched_at: "2026-11-05T10:30:00Z",
      data: sampleByEntity[entityType] || sampleByEntity.leads,
    },
    null,
    2
  )
}

export default function WebhooksPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [items, setItems] = React.useState<WebhookRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])
  const [showModal, setShowModal] = React.useState(false)
  const [editing, setEditing] = React.useState<WebhookRow | null>(null)
  const [testPreview, setTestPreview] = React.useState<{
    webhook: WebhookRow
    message: string
    payload: string
  } | null>(null)

  const [form, setForm] = React.useState({
    name: "",
    entity_type: "leads",
    description: "",
    method: "POST",
    end_point: "",
    payload_type: "default",
    raw_payload_type: "json",
    raw_payload:
      '{\n  "lead_id": "{lead_id}",\n  "name": "{lead_name}",\n  "mobile": "{lead_mobile}"\n}',
  })
  const [queryParams, setQueryParams] = React.useState<KV[]>([])
  const [headers, setHeaders] = React.useState<KV[]>([
    { key: "Content-Type", value: "application/json" },
  ])
  const [formEncoded, setFormEncoded] = React.useState<KV[]>([
    { key: "lead_name", value: "{lead_name}" },
  ])

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/crm-resources?resource=webhooks")
      const d = await res.json()
      setItems(d.items || [])
    } catch {
      toast.error("Failed to load webhooks")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const columns = React.useMemo<ColumnDef<WebhookRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={items.length > 0 && selected.length === items.length}
            onCheckedChange={(checked) =>
              setSelected(checked ? items.map((x) => String(x.id)) : [])
            }
          />
        ),
        cell: ({ row }) => {
          const idStr = String(row.original.id)
          return (
            <Checkbox
              checked={selected.includes(idStr)}
              onCheckedChange={(checked) =>
                setSelected((prev) =>
                  checked ? [...prev, idStr] : prev.filter((x) => x !== idStr)
                )
              }
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-[#405189]">
              {row.original.name}
            </div>
            {row.original.description && (
              <div className="text-[11px] text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "entity_type",
        header: "Entity",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize">
            {row.original.entity_type}
          </Badge>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
          <Badge className="bg-slate-800 font-mono text-[10px] uppercase text-white">
            {String(row.original.method || "POST").toUpperCase()}
          </Badge>
        ),
      },
      {
        accessorKey: "end_point",
        header: "URL",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate font-mono text-[11px]">
            {row.original.end_point}
          </span>
        ),
      },
      {
        accessorKey: "payload_type",
        header: "Payload Mode",
        cell: ({ row }) => {
          const pt = row.original.payload_type || "default"
          if (pt === "default") {
            return (
              <Badge className="bg-[#405189]/15 text-[10px] font-semibold text-[#405189] hover:bg-[#405189]/20">
                Default (Auto Full Entity JSON)
              </Badge>
            )
          }
          return (
            <Badge variant="secondary" className="font-mono text-[10px]">
              {pt}
              {pt === "raw" ? ` (${row.original.raw_payload_type || "json"})` : ""}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const w = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                type="button"
                size="xs"
                onClick={async () => {
                  const res = await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "webhooks",
                      action: "test",
                      id: w.id,
                    }),
                  })
                  const out = await res.json()
                  if (res.ok) {
                    toast.success(out.message || "Webhook test dispatched!")
                    setTestPreview({
                      webhook: w,
                      message: out.message || "Dispatched",
                      payload:
                        w.payload_type === "default"
                          ? buildDefaultSamplePayload(w.entity_type)
                          : typeof out.sample_payload === "string"
                            ? out.sample_payload
                            : JSON.stringify(out.sample_payload || {}, null, 2),
                    })
                  }
                }}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Test
              </Button>
              <Button
                type="button"
                size="xs"
                onClick={() => {
                  setEditing(w)
                  setForm({
                    name: w.name || "",
                    entity_type: w.entity_type || "leads",
                    description: w.description || "",
                    method: String(w.method || "POST").toUpperCase(),
                    end_point: w.end_point || "",
                    payload_type: w.payload_type || "default",
                    raw_payload_type: w.raw_payload_type || "json",
                    raw_payload:
                      w.payload_type === "raw" ? w.payload || "{}" : "{}",
                  })
                  setQueryParams(parseKv(w.query_params))
                  setHeaders(
                    parseKv(w.headers).length > 0
                      ? parseKv(w.headers)
                      : [{ key: "Content-Type", value: "application/json" }]
                  )
                  setFormEncoded(
                    w.payload_type === "x-www-form-urlencoded" ||
                      w.payload_type === "form-data"
                      ? parseKv(w.payload)
                      : [{ key: "lead_name", value: "{lead_name}" }]
                  )
                  setShowModal(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  confirmDelete({
                    title: "Delete Webhook?",
                    description: `Are you sure you want to permanently delete webhook "${w.name}" (${w.end_point})? This action cannot be undone.`,
                    confirmLabel: "Yes, Delete Webhook",
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "webhooks",
                          action: "delete",
                          id: w.id,
                        }),
                      })
                      if (res.ok) {
                        setSelected((prev) =>
                          prev.filter((id) => id !== String(w.id))
                        )
                        toast.success("Webhook deleted")
                        await load()
                      }
                    },
                  })
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
    [items, selected, load, confirmDelete]
  )

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="Master Data" title="Webhooks" />

      {/* Default Webhook Behavior Reference Banner */}
      <Card className="border-[#405189]/25 bg-[#405189]/[0.03] p-4 text-xs shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#405189]">
              <i className="ri-webhook-line text-base" />
              <span>What Happens in a Default Webhook?</span>
              <Badge className="bg-[#0ab39c]/15 text-[10px] font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/15">
                Zero-Config Auto JSON
              </Badge>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              When a webhook uses{" "}
              <strong className="text-foreground">Default Payload</strong> mode:
            </p>
            <ul className="grid grid-cols-1 gap-1.5 pt-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
              <li className="flex items-start gap-1.5">
                <i className="ri-checkbox-circle-fill mt-0.5 text-[#0ab39c]" />
                <span>
                  <strong className="text-foreground">1. Automatic Event Trigger:</strong>{" "}
                  Fires automatically whenever a record in the chosen{" "}
                  <code>Entity Type</code> (e.g. <code>leads</code>,{" "}
                  <code>contacts</code>, <code>deals</code>) is created or
                  updated in your organization.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <i className="ri-checkbox-circle-fill mt-0.5 text-[#0ab39c]" />
                <span>
                  <strong className="text-foreground">2. Full CRM Record Envelope:</strong>{" "}
                  Sends a standardized <code>application/json</code> body with{" "}
                  <code>event</code>, <code>entity_type</code>,{" "}
                  <code>organization_id</code>, <code>dispatched_at</code>, and{" "}
                  <code>data</code> (all lead/entity attributes, stage, source &
                  counsellor IDs) without manual field mapping.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <i className="ri-checkbox-circle-fill mt-0.5 text-[#0ab39c]" />
                <span>
                  <strong className="text-foreground">3. Headers & Query Params:</strong>{" "}
                  Appends any configured URL Query Parameters and attaches your
                  custom HTTP Headers (e.g. <code>Authorization: Bearer ...</code>
                  ) using the selected HTTP Method.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <i className="ri-checkbox-circle-fill mt-0.5 text-[#0ab39c]" />
                <span>
                  <strong className="text-foreground">4. Custom Override Modes:</strong>{" "}
                  Need a custom ERP schema instead? Switch the Body Format to{" "}
                  <code>x-www-form-urlencoded</code>, <code>Form Data</code>, or{" "}
                  <code>Raw JSON</code> with <code>{"{lead_*}"}</code>{" "}
                  placeholders.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-36" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="gap-0 py-0 text-xs shadow-xs">
          <DataTable
            title={`Outbound CRM Webhooks (${items.length})`}
            columns={columns}
            data={items}
            searchPlaceholder="Search webhook name or endpoint..."
            toolbarRight={
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      confirmDelete({
                        title: `Delete ${selected.length} Webhook(s)?`,
                        description: `Are you sure you want to permanently delete ${selected.length} selected webhook(s)?`,
                        confirmLabel: `Yes, Delete (${selected.length})`,
                        onConfirm: async () => {
                          const res = await fetch("/api/crm-resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resource: "webhooks",
                              action: "bulk_delete",
                              ids: selected,
                            }),
                          })
                          if (res.ok) {
                            setSelected([])
                            toast.success("Selected webhooks deleted")
                            await load()
                          }
                        },
                      })
                    }}
                    className="h-8 text-xs"
                  >
                    <i className="ri-delete-bin-2-line mr-1" />
                    Delete ({selected.length})
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditing(null)
                    setForm({
                      name: "",
                      entity_type: "leads",
                      description: "",
                      method: "POST",
                      end_point: "",
                      payload_type: "default",
                      raw_payload_type: "json",
                      raw_payload:
                        '{\n  "lead_id": "{lead_id}",\n  "name": "{lead_name}",\n  "mobile": "{lead_mobile}"\n}',
                    })
                    setQueryParams([])
                    setHeaders([
                      { key: "Content-Type", value: "application/json" },
                    ])
                    setFormEncoded([{ key: "lead_name", value: "{lead_name}" }])
                    setShowModal(true)
                  }}
                  className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  + Add Webhooks
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Create / Edit Webhook Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto text-xs sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing
                ? `Edit Webhook — ${editing.name}`
                : "Create Outbound Webhook"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure entity trigger, HTTP method, endpoint URL, query
              parameters, headers, and payload format.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const payloadVal =
                form.payload_type === "raw"
                  ? form.raw_payload
                  : form.payload_type === "x-www-form-urlencoded" ||
                      form.payload_type === "form-data"
                    ? JSON.stringify(formEncoded.filter((r) => r.key))
                    : ""
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "webhooks",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  name: form.name,
                  entity_type: form.entity_type,
                  description: form.description,
                  method: form.method,
                  end_point: form.end_point,
                  query_params: queryParams.filter((r) => r.key),
                  headers: headers.filter((r) => r.key),
                  payload_type: form.payload_type,
                  raw_payload_type: form.raw_payload_type,
                  payload: payloadVal,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Webhook updated!" : "Webhook created!"
                )
                setShowModal(false)
                await load()
              }
            }}
            className="space-y-3.5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Webhook Name *</Label>
                <Input
                  required
                  placeholder="ERP Admission Sync"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Entity Type *</Label>
                <FormSelect
                  value={form.entity_type}
                  onChange={(e) =>
                    setForm({ ...form, entity_type: e.target.value })
                  }
                  className="h-9 w-full"
                >
                  <option value="leads">Leads</option>
                  <option value="contacts">Contacts</option>
                  <option value="deals">Deals</option>
                  <option value="persons">Persons</option>
                  <option value="organizations">Organizations</option>
                  <option value="quotes">Quotes</option>
                  <option value="activities">Activities</option>
                </FormSelect>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Description *</Label>
              <Input
                required
                placeholder="Push newly created or updated leads to University ERP..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>

            {/* Method + Endpoint URL */}
            <div>
              <Label className="mb-1 block text-xs">
                HTTP Method & End Point URL *
              </Label>
              <div className="flex gap-2">
                <FormSelect
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="h-9 w-28 font-mono font-semibold"
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="GET">GET</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </FormSelect>
                <Input
                  required
                  placeholder="https://erp.university.edu/api/v1/admissions/webhook"
                  value={form.end_point}
                  onChange={(e) =>
                    setForm({ ...form, end_point: e.target.value })
                  }
                  className="h-9 flex-1 font-mono text-xs"
                />
              </div>
            </div>

            {/* URL Query Parameters */}
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  URL Query Parameters
                </Label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setQueryParams([...queryParams, { key: "", value: "" }])
                  }
                >
                  + Add Param
                </Button>
              </div>
              {queryParams.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Optional query string parameters appended to the endpoint URL.
                </p>
              ) : (
                queryParams.map((qp, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Key (e.g. api_version)"
                      value={qp.key}
                      onChange={(e) => {
                        const c = [...queryParams]
                        c[i].key = e.target.value
                        setQueryParams(c)
                      }}
                      className="h-8 font-mono text-xs"
                    />
                    <Input
                      placeholder="Value (e.g. 2)"
                      value={qp.value}
                      onChange={(e) => {
                        const c = [...queryParams]
                        c[i].value = e.target.value
                        setQueryParams(c)
                      }}
                      className="h-8 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      size="xs"
                      variant="destructive"
                      onClick={() =>
                        setQueryParams(
                          queryParams.filter((_, idx) => idx !== i)
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* HTTP Headers */}
            <div className="space-y-2 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Request Headers</Label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    setHeaders([...headers, { key: "", value: "" }])
                  }
                >
                  + Add Header
                </Button>
              </div>
              {headers.map((hd, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Header Name (e.g. Authorization)"
                    value={hd.key}
                    onChange={(e) => {
                      const c = [...headers]
                      c[i].key = e.target.value
                      setHeaders(c)
                    }}
                    className="h-8 font-mono text-xs"
                  />
                  <Input
                    placeholder="Value (e.g. Bearer sk_live_...)"
                    value={hd.value}
                    onChange={(e) => {
                      const c = [...headers]
                      c[i].value = e.target.value
                      setHeaders(c)
                    }}
                    className="h-8 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    onClick={() =>
                      setHeaders(headers.filter((_, idx) => idx !== i))
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            {/* Request Body Format */}
            <div className="space-y-2.5 rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-semibold">
                  Request Body Format
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { v: "default", l: "Default Webhook" },
                    { v: "x-www-form-urlencoded", l: "x-www-form-urlencoded" },
                    { v: "form-data", l: "Form Data" },
                    { v: "raw", l: "Raw (JSON / Text)" },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      className="flex cursor-pointer items-center gap-1.5 font-medium"
                    >
                      <input
                        type="radio"
                        checked={form.payload_type === opt.v}
                        onChange={() =>
                          setForm({ ...form, payload_type: opt.v })
                        }
                      />
                      <span>{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Explicit Explanation + Live Schema Preview for Default Webhook */}
              {form.payload_type === "default" && (
                <div className="space-y-2.5 rounded-lg border border-[#405189]/25 bg-[#405189]/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-[#405189]">
                      <i className="ri-information-line text-sm" />
                      What happens when &ldquo;Default Webhook&rdquo; is selected?
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[#405189]/30 bg-background font-mono text-[10px] text-[#405189]"
                    >
                      Auto {form.method} JSON
                    </Badge>
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                    <li>
                      <strong className="text-foreground">
                        Automatic Lifecycle Trigger:
                      </strong>{" "}
                      Whenever a <code>{form.entity_type}</code> record is{" "}
                      <strong>created</strong> or <strong>updated</strong> in
                      the CRM, this webhook fires automatically to your End
                      Point URL.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Complete Standard CRM Payload:
                      </strong>{" "}
                      Automatically serializes the full{" "}
                      <code>{form.entity_type}</code> record inside{" "}
                      <code>data</code> along with <code>event</code>,{" "}
                      <code>organization_id</code>, and{" "}
                      <code>dispatched_at</code> as{" "}
                      <code>Content-Type: application/json</code> — no manual
                      field mapping needed.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Headers & Query Params Applied:
                      </strong>{" "}
                      All URL Query Parameters and Request Headers above are
                      included in the outbound HTTP request.
                    </li>
                  </ul>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sample Auto-Generated Default JSON Payload ({form.entity_type})
                    </div>
                    <pre className="max-h-40 overflow-y-auto rounded-md bg-slate-950 p-2.5 font-mono text-[11px] leading-relaxed text-emerald-300">
                      {buildDefaultSamplePayload(form.entity_type)}
                    </pre>
                  </div>
                </div>
              )}

              {(form.payload_type === "x-www-form-urlencoded" ||
                form.payload_type === "form-data") && (
                <div className="space-y-2">
                  {formEncoded.map((fe, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Payload Key"
                        value={fe.key}
                        onChange={(e) => {
                          const c = [...formEncoded]
                          c[i].key = e.target.value
                          setFormEncoded(c)
                        }}
                        className="h-8 font-mono text-xs"
                      />
                      <Input
                        placeholder="Payload Value or {lead_name}"
                        value={fe.value}
                        onChange={(e) => {
                          const c = [...formEncoded]
                          c[i].value = e.target.value
                          setFormEncoded(c)
                        }}
                        className="h-8 font-mono text-xs"
                      />
                      <Button
                        type="button"
                        size="xs"
                        variant="destructive"
                        onClick={() =>
                          setFormEncoded(
                            formEncoded.filter((_, idx) => idx !== i)
                          )
                        }
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setFormEncoded([...formEncoded, { key: "", value: "" }])
                    }
                  >
                    + Add Payload Field
                  </Button>
                </div>
              )}

              {form.payload_type === "raw" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormSelect
                      value={form.raw_payload_type}
                      onChange={(e) =>
                        setForm({ ...form, raw_payload_type: e.target.value })
                      }
                      className="h-8 w-52"
                    >
                      <option value="json">JSON (application/json)</option>
                      <option value="text">Plain Text (text/plain)</option>
                    </FormSelect>
                    <div className="flex flex-wrap gap-1">
                      {[
                        "{lead_id}",
                        "{lead_name}",
                        "{lead_mobile}",
                        "{lead_email}",
                      ].map((ph) => (
                        <button
                          key={ph}
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              raw_payload: `${form.raw_payload}${ph}`,
                            })
                          }
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] hover:bg-muted/80"
                        >
                          +{ph}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    rows={5}
                    value={form.raw_payload}
                    onChange={(e) =>
                      setForm({ ...form, raw_payload: e.target.value })
                    }
                    className="font-mono text-xs"
                  />
                </div>
              )}
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
                {editing ? "Update Webhook" : "Save Webhook"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Test Dispatch Inspection Modal */}
      <Dialog
        open={Boolean(testPreview)}
        onOpenChange={(o) => {
          if (!o) setTestPreview(null)
        }}
      >
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#0ab39c]">
              Webhook Test Dispatched — {testPreview?.webhook.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {testPreview?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground">
              Dispatched Request Payload ({testPreview?.webhook.payload_type})
            </div>
            <pre className="max-h-60 overflow-y-auto rounded-md bg-slate-950 p-3 font-mono text-[11px] text-emerald-300">
              {testPreview?.payload}
            </pre>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setTestPreview(null)}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
