"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

type KV = { key: string; value: string }

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
    // ignore
  }
  return []
}

export default function WebhooksPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    entity_type: "leads",
    description: "",
    method: "POST",
    end_point: "",
    payload_type: "default",
    raw_payload_type: "json",
    raw_payload: '{\n  "lead_id": "{lead_id}",\n  "name": "{lead_name}",\n  "mobile": "{lead_mobile}"\n}',
  })
  const [queryParams, setQueryParams] = React.useState<KV[]>([])
  const [headers, setHeaders] = React.useState<KV[]>([
    { key: "Content-Type", value: "application/json" },
  ])
  const [formEncoded, setFormEncoded] = React.useState<KV[]>([
    { key: "lead_name", value: "{lead_name}" },
  ])

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=webhooks")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

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
        accessorKey: "name",
        header: "Webhook Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-[#405189]">
              {row.original.name}
            </div>
            {row.original.description && (
              <div className="text-[10px] text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "entity_type",
        header: "Entity Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize text-[10px]">
            {row.original.entity_type}
          </Badge>
        ),
      },
      {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
          <Badge className="bg-slate-800 font-mono text-[10px] text-white">
            {row.original.method}
          </Badge>
        ),
      },
      {
        accessorKey: "end_point",
        header: "End Point URL",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate font-mono text-[11px]">
            {row.original.end_point}
          </span>
        ),
      },
      {
        accessorKey: "payload_type",
        header: "Body Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {row.original.payload_type} ({row.original.raw_payload_type || "json"})
          </Badge>
        ),
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
                  if (res.ok) toast.success(out.message || "Webhook tested!")
                }}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Test
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  setEditing(w)
                  setForm({
                    name: w.name || "",
                    entity_type: w.entity_type || "leads",
                    description: w.description || "",
                    method: w.method || "POST",
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
                    w.payload_type === "x-www-form-urlencoded"
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
                size="xs"
                variant="destructive"
                onClick={async () => {
                  await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "webhooks",
                      action: "delete",
                      id: w.id,
                    }),
                  })
                  toast.success("Webhook deleted")
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
    [load]
  )

  return (
    <div>
      <BreadcrumbBar parent="Master Data" title="Outbound Webhooks" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Outbound CRM Webhooks (${items.length})`}
          columns={columns}
          data={items}
          searchPlaceholder="Search webhook name or endpoint..."
          toolbarRight={
            <Button
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
                setHeaders([{ key: "Content-Type", value: "application/json" }])
                setFormEncoded([{ key: "lead_name", value: "{lead_name}" }])
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Create Webhook
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto text-xs sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Webhook — ${editing.name}` : "Create Outbound Webhook"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure HTTP method, endpoint URL, query parameters, custom headers, and payload format.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const payloadVal =
                form.payload_type === "raw"
                  ? form.raw_payload
                  : form.payload_type === "x-www-form-urlencoded"
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
                toast.success(editing ? "Webhook updated!" : "Webhook created!")
                setShowModal(false)
                load()
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
                <select
                  value={form.entity_type}
                  onChange={(e) =>
                    setForm({ ...form, entity_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="leads">Lead</option>
                  <option value="persons">Person</option>
                  <option value="organizations">Organization</option>
                  <option value="quotes">Quote</option>
                  <option value="activities">Activity</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Input
                placeholder="Push newly converted leads to University ERP..."
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
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="h-9 w-28 rounded-md border border-input bg-background px-2.5 font-mono text-xs font-semibold"
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="GET">GET</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
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
            <div className="rounded-md border border-border p-3 space-y-2">
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
              {queryParams.map((qp, i) => (
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
                      setQueryParams(queryParams.filter((_, idx) => idx !== i))
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>

            {/* HTTP Headers */}
            <div className="rounded-md border border-border p-3 space-y-2">
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

            {/* Request Body */}
            <div className="rounded-md border border-border p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-semibold">
                  Request Body Format
                </Label>
                <div className="flex items-center gap-3">
                  {[
                    { v: "default", l: "Default Payload" },
                    { v: "x-www-form-urlencoded", l: "x-www-form-urlencoded" },
                    { v: "raw", l: "Raw (JSON / Text)" },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      className="flex cursor-pointer items-center gap-1.5"
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

              {form.payload_type === "x-www-form-urlencoded" && (
                <div className="space-y-2">
                  {formEncoded.map((fe, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="Field Key"
                        value={fe.key}
                        onChange={(e) => {
                          const c = [...formEncoded]
                          c[i].key = e.target.value
                          setFormEncoded(c)
                        }}
                        className="h-8 font-mono text-xs"
                      />
                      <Input
                        placeholder="Value or {lead_name}"
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
                    + Add Form Field
                  </Button>
                </div>
              )}

              {form.payload_type === "raw" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <select
                      value={form.raw_payload_type}
                      onChange={(e) =>
                        setForm({ ...form, raw_payload_type: e.target.value })
                      }
                      className="h-7 rounded border border-input bg-background px-2 text-xs"
                    >
                      <option value="json">JSON (application/json)</option>
                      <option value="text">Plain Text (text/plain)</option>
                    </select>
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
    </div>
  )
}
