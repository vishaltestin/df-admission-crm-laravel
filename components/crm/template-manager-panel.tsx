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
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

const VARIABLES = [
  { token: "{lead_id}", label: "Lead ID" },
  { token: "{lead_name}", label: "Lead Name" },
  { token: "{lead_mobile}", label: "Lead Mobile" },
  { token: "{lead_email}", label: "Lead Email" },
  { token: "{lead_city}", label: "City" },
  { token: "{lead_state}", label: "State" },
  { token: "{lead_next_followup}", label: "Next Follow-up" },
  { token: "{lead_registration_date}", label: "Registration Date" },
  { token: "{lead_assign_to}", label: "Assigned User ID" },
  { token: "{lead_source}", label: "Lead Source" },
  { token: "{programme_name}", label: "Programme Name" },
  { token: "{institute_name}", label: "Institute Name" },
  { token: "{course_name}", label: "Course Name" },
  { token: "{assigned_user}", label: "Assigned User" },
  { token: "{assigned_user_name}", label: "Counsellor Name" },
  { token: "{customer_name}", label: "Customer Name" },
  { token: "{customer_email}", label: "Customer Email" },
  { token: "{customer_mobile}", label: "Customer Mobile" },
  { token: "{application_link}", label: "Application Link" },
  { token: "{company_name}", label: "Organization Name" },
]

const CATEGORY_PRESETS = [
  "welcome",
  "followup",
  "payment",
  "otp",
  "reminder",
  "admission",
]

interface TemplateRecord {
  id: string | number
  title?: string | null
  name?: string | null
  category?: string | null
  send_by?: string | null
  subject?: string | null
  message?: string | null
  content?: string | null
  organization_id?: string | number | null
  organization_name?: string | null
  sent_count?: number | null
  status?: string | number | boolean | null
}

interface OrgOption {
  id: string | number
  name: string
}

function isTemplateActive(st: TemplateRecord["status"]) {
  return (
    st === "active" ||
    st === true ||
    st === 1 ||
    st === "1"
  )
}

export function TemplateManagerPanel({
  resource,
  title,
  hasSubject = false,
}: {
  resource: "email_templates" | "message_templates" | "whatsapp_templates"
  title: string
  hasSubject?: boolean
}) {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [items, setItems] = React.useState<TemplateRecord[]>([])
  const [orgs, setOrgs] = React.useState<OrgOption[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])

  const [showModal, setShowModal] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editing, setEditing] = React.useState<TemplateRecord | null>(null)
  const [previewItem, setPreviewItem] = React.useState<TemplateRecord | null>(
    null
  )

  const lexicalInsertRef = React.useRef<((text: string) => void) | null>(null)
  const plainTextareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  const [form, setForm] = React.useState({
    name: "",
    category: "welcome",
    subject: "",
    content: "",
    send_by: "ADTUUN",
    organization_id: "1",
    status: "active",
  })

  const isEmail = resource === "email_templates" || hasSubject
  const isSms = resource === "message_templates"
  const isWa = resource === "whatsapp_templates"

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/crm-resources?resource=${resource}`)
      const d = await res.json()
      setItems(d.items || [])
      setOrgs(d.organizations || [])
    } catch {
      toast.error(`Failed to load ${title.toLowerCase()}`)
    } finally {
      setLoading(false)
    }
  }, [resource, title])

  React.useEffect(() => {
    load()
  }, [load])

  const orgMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const o of orgs) m[String(o.id)] = o.name
    return m
  }, [orgs])

  function insertVar(token: string) {
    if (isEmail && lexicalInsertRef.current) {
      lexicalInsertRef.current(token)
      return
    }
    if (!isEmail && plainTextareaRef.current) {
      const el = plainTextareaRef.current
      const start = el.selectionStart ?? form.content.length
      const end = el.selectionEnd ?? form.content.length
      const next =
        form.content.slice(0, start) + token + form.content.slice(end)
      setForm((prev) => ({ ...prev, content: next }))
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
      })
      return
    }
    setForm((prev) => ({
      ...prev,
      content: `${prev.content}${prev.content ? " " : ""}${token}`,
    }))
  }

  const columns = React.useMemo<ColumnDef<TemplateRecord>[]>(() => {
    const cols: ColumnDef<TemplateRecord>[] = [
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
        accessorFn: (t) => t.name || t.title || "",
        id: "name",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189]">
            {row.original.name || row.original.title}
          </span>
        ),
      },
      {
        accessorFn: (t) =>
          t.organization_name || orgMap[String(t.organization_id)] || "—",
        id: "org",
        header: "Organization",
      },
      {
        accessorFn: (t) => t.category || "—",
        id: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <Badge
              variant="outline"
              className="border-[#405189]/30 bg-[#405189]/5 text-[10px] capitalize text-[#405189]"
            >
              {row.original.category}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ]

    if (isEmail) {
      cols.push({
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate font-medium">
            {row.original.subject || "—"}
          </span>
        ),
      })
    } else {
      cols.push({
        accessorFn: (t) => t.send_by || "—",
        id: "send_by",
        header: "Send By",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px]">
            {row.original.send_by || "—"}
          </Badge>
        ),
      })
    }

    cols.push({
      id: "status",
      accessorFn: (t) => (isTemplateActive(t.status) ? "Active" : "Inactive"),
      header: "Status",
      cell: ({ row }) =>
        isTemplateActive(row.original.status) ? (
          <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Inactive
          </Badge>
        ),
    })

    cols.push({
      accessorFn: (t) => Number(t.sent_count ?? 0),
      id: "sent_count",
      header: "Sent Count",
      cell: ({ getValue }) => (
        <span className="font-mono font-medium">{String(getValue())}</span>
      ),
    })

    cols.push({
      id: "actions",
      header: () => <div className="text-right">Action</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const t = row.original
        const tplLabel = t.name || t.title || `#${t.id}`
        return (
          <div className="flex justify-end gap-1.5 whitespace-nowrap">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setPreviewItem(t)}
              className="text-[11px]"
            >
              Preview
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => {
                setEditing(t)
                setForm({
                  name: t.name || t.title || "",
                  category: t.category || "",
                  subject: t.subject || "",
                  content: t.content || t.message || "",
                  send_by: t.send_by || (isSms ? "ADTUUN" : ""),
                  organization_id: t.organization_id
                    ? String(t.organization_id)
                    : orgs[0]
                      ? String(orgs[0].id)
                      : "1",
                  status: isTemplateActive(t.status) ? "active" : "inactive",
                })
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
                  title: `Delete ${isEmail ? "Email" : isSms ? "Message" : "WhatsApp"} Template?`,
                  description: `Are you sure you want to permanently delete template "${tplLabel}"? This action cannot be undone.`,
                  confirmLabel: "Yes, Delete Template",
                  onConfirm: async () => {
                    const res = await fetch("/api/crm-resources", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource,
                        action: "delete",
                        id: t.id,
                      }),
                    })
                    if (res.ok) {
                      setSelected((prev) =>
                        prev.filter((id) => id !== String(t.id))
                      )
                      toast.success("Template deleted")
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
    })

    return cols
  }, [items, selected, isEmail, isSms, orgMap, orgs, resource, load, confirmDelete])

  const charCount = form.content.length
  const smsSegments = Math.max(1, Math.ceil(charCount / 160))

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="Templates" title={title} />

      {loading ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-44" />
          </div>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="gap-0 py-0 text-xs shadow-xs">
          <DataTable
            title={`${title} (${items.length})`}
            columns={columns}
            data={items}
            searchPlaceholder={`Search ${title.toLowerCase()}...`}
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
                        title: `Delete ${selected.length} Template(s)?`,
                        description: `Are you sure you want to permanently delete ${selected.length} selected template(s)? This action cannot be undone.`,
                        confirmLabel: `Yes, Delete (${selected.length})`,
                        onConfirm: async () => {
                          const res = await fetch("/api/crm-resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resource,
                              action: "bulk_delete",
                              ids: selected,
                            }),
                          })
                          if (res.ok) {
                            setSelected([])
                            toast.success("Selected templates deleted")
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
                      category: "welcome",
                      subject: isEmail
                        ? "Welcome to Admissions 2026-27 — {institute_name}"
                        : "",
                      content: isEmail
                        ? "<p>Dear <strong>{lead_name}</strong>,</p><p>Thank you for your interest in <strong>{programme_name}</strong> at {institute_name}. Click below to complete your online application:</p><p><a href='{application_link}'>{application_link}</a></p><p>Warm regards,<br/>Admissions Office</p>"
                        : "Dear {lead_name}, thank you for enquiring about {programme_name} at {institute_name}. Complete your application at {application_link} - Admissions Desk",
                      send_by: isSms ? "ADTUUN" : "9876543210",
                      organization_id: orgs[0] ? String(orgs[0].id) : "1",
                      status: "active",
                    })
                    setShowModal(true)
                  }}
                  className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  + Add{" "}
                  {isEmail
                    ? "Email Template"
                    : isSms
                      ? "Message Template"
                      : "Whatsapp Template"}
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Create / Edit Template Studio Modal (8 / 4 2-Column Layout matching df-laravel-crm) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto text-xs sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#405189]">
              {editing
                ? `Edit ${isEmail ? "Email" : isSms ? "SMS Message" : "WhatsApp"} Template — ${editing.name || editing.title}`
                : `Add ${isEmail ? "Email" : isSms ? "SMS Message" : "WhatsApp"} Template`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEmail
                ? "Compose rich HTML emails using the Lexical Rich Text Editor, configure category & status, and insert dynamic CRM variables."
                : isSms
                  ? "Configure SMS message template title, use-case category, organization, sender ID, active status, and dynamic variables."
                  : "Configure WhatsApp template title, use-case category, organization, sender ID/number, active status, and dynamic variables."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                const usedVars = VARIABLES.map((v) => v.token).filter(
                  (tok) =>
                    form.content.includes(tok) || form.subject.includes(tok)
                )
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource,
                    action: editing ? "update" : "create",
                    id: editing?.id,
                    title: form.name,
                    name: form.name,
                    category: form.category,
                    subject: form.subject,
                    message: form.content,
                    content: form.content,
                    send_by: form.send_by,
                    organization_id: form.organization_id,
                    status: form.status,
                    variables_json: usedVars,
                  }),
                })
                if (res.ok) {
                  toast.success(
                    editing ? "Template updated!" : "Template created!"
                  )
                  setShowModal(false)
                  await load()
                } else {
                  toast.error("Failed to save template")
                }
              } finally {
                setSaving(false)
              }
            }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          >
            {/* Left 8 Columns: Form Fields & Editor */}
            <div className="space-y-3 lg:col-span-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    {isEmail ? "Template Name *" : "Title *"}
                  </Label>
                  <Input
                    required
                    placeholder={
                      isEmail
                        ? "e.g. Admission Welcome Email"
                        : isSms
                          ? "e.g. Welcome SMS, Fee Reminder, OTP Message"
                          : "e.g. WhatsApp Counselling Follow-up"
                    }
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Category
                  </Label>
                  <Input
                    placeholder="e.g. welcome, followup, payment, otp, reminder"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {CATEGORY_PRESETS.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground hover:bg-[#405189] hover:text-white"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Organization *
                  </Label>
                  <FormSelect
                    value={form.organization_id}
                    onChange={(e) =>
                      setForm({ ...form, organization_id: e.target.value })
                    }
                    className="h-9 w-full"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    {isEmail
                      ? "Sender Name / Header"
                      : "Send By (Sender ID / Number)"}
                  </Label>
                  <Input
                    placeholder={
                      isEmail
                        ? "e.g. Admissions Desk"
                        : "e.g. SKYITN / 9876543210"
                    }
                    value={form.send_by}
                    onChange={(e) =>
                      setForm({ ...form, send_by: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Status *
                  </Label>
                  <FormSelect
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="h-9 w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </FormSelect>
                </div>
              </div>

              {isEmail && (
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Subject *
                  </Label>
                  <Input
                    required
                    placeholder="Your Application for {programme_name} — {institute_name}"
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    className="h-9 text-xs"
                  />
                </div>
              )}

              {/* Content / Message Body Editor */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    {isEmail ? "Content (Lexical Rich Text Editor) *" : "Message Body *"}
                  </Label>
                  {!isEmail && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {charCount} chars
                      {isSms ? ` • ${smsSegments} SMS segment(s)` : ""}
                    </span>
                  )}
                </div>

                {isEmail ? (
                  <RichTextEditor
                    value={form.content}
                    onChange={(html) => setForm({ ...form, content: html })}
                    minHeight={260}
                    insertRef={lexicalInsertRef}
                    variables={VARIABLES}
                  />
                ) : (
                  <Textarea
                    ref={plainTextareaRef}
                    required
                    rows={7}
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder="Type your message here with {lead_name} placeholders..."
                    className="text-xs leading-relaxed"
                  />
                )}
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
                  disabled={saving}
                  className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Update Template"
                      : "Save"}
                </Button>
              </DialogFooter>
            </div>

            {/* Right 4 Columns: Dynamic Variables & Live Preview */}
            <div className="space-y-3 lg:col-span-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <h5 className="mb-1 font-bold text-[#405189]">
                  Dynamic Variables
                </h5>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Click any variable to insert directly at your cursor position:
                </p>
                <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => insertVar(v.token)}
                      title={v.label}
                      className="rounded border border-[#405189]/30 bg-background px-2 py-1 font-mono text-[11px] font-medium text-[#405189] transition-colors hover:bg-[#405189] hover:text-white"
                    >
                      {v.token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border p-3">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>
                    Live {isWa ? "WhatsApp" : isSms ? "SMS" : "Email"} Preview
                  </span>
                  {form.category && (
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {form.category}
                    </Badge>
                  )}
                </div>
                {isWa ? (
                  <div className="rounded-lg bg-[#e5ddd5] p-3">
                    {form.send_by && (
                      <div className="mb-1 font-mono text-[10px] font-semibold text-slate-600">
                        Sender: {form.send_by}
                      </div>
                    )}
                    <div className="rounded-lg bg-[#dcf8c6] p-2.5 text-xs leading-relaxed whitespace-pre-wrap text-slate-900 shadow-2xs">
                      {form.content || "WhatsApp preview..."}
                    </div>
                  </div>
                ) : isSms ? (
                  <div className="rounded-lg bg-slate-100 p-3 text-slate-800">
                    <div className="mb-1 font-mono text-[10px] font-bold text-slate-500">
                      From: {form.send_by || "ADTUUN"}
                    </div>
                    <div className="rounded-lg bg-white p-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-2xs">
                      {form.content || "SMS preview..."}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
                    <div className="mb-2 border-b border-slate-100 pb-1.5 font-semibold">
                      Subject: {form.subject || "(No subject)"}
                    </div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: form.content || "<p>Preview...</p>",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Read-Only Preview Modal */}
      <Dialog
        open={Boolean(previewItem)}
        onOpenChange={(o) => {
          if (!o) setPreviewItem(null)
        }}
      >
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {previewItem?.name || previewItem?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {previewItem?.category
                ? `Category: ${previewItem.category}`
                : "Template Preview"}
              {previewItem?.subject ? ` • Subject: ${previewItem.subject}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border bg-white p-4 text-xs text-slate-800">
            {isEmail ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: previewItem?.content || previewItem?.message || "",
                }}
              />
            ) : (
              <pre className="font-sans leading-relaxed whitespace-pre-wrap">
                {previewItem?.content || previewItem?.message}
              </pre>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setPreviewItem(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
