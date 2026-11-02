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
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const VARIABLES = [
  { token: "{lead_name}", desc: "Applicant Full Name" },
  { token: "{lead_mobile}", desc: "Applicant Mobile Number" },
  { token: "{lead_email}", desc: "Applicant Email Address" },
  { token: "{course_name}", desc: "Enquired Course / Program" },
  { token: "{application_link}", desc: "Unique Application URL" },
  { token: "{otp}", desc: "6-Digit Verification OTP" },
  { token: "{user_name}", desc: "Assigned Counsellor Name" },
  { token: "{company_name}", desc: "University / Organization" },
  { token: "{date}", desc: "Current Date" },
]

export function TemplateManagerPanel({
  resource,
  title,
  hasSubject = false,
}: {
  resource: "email_templates" | "message_templates" | "whatsapp_templates"
  title: string
  hasSubject?: boolean
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orgs, setOrgs] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewItem, setPreviewItem] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    content: "",
    send_by: "ADTUUN",
    provider: "",
    organization_id: "1",
    status: "1",
  })

  const isEmail = resource === "email_templates" || hasSubject
  const isSms = resource === "message_templates"
  const isWa = resource === "whatsapp_templates"

  const load = React.useCallback(() => {
    fetch(`/api/crm-resources?resource=${resource}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || [])
        setOrgs(d.organizations || [])
      })
  }, [resource])

  React.useEffect(() => {
    load()
  }, [load])

  const orgMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const o of orgs) m[String(o.id)] = o.name
    return m
  }, [orgs])

  function insertVar(token: string) {
    setForm((prev) => ({
      ...prev,
      content: `${prev.content}${prev.content ? " " : ""}${token}`,
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<any>[] = [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorFn: (t) => t.name || t.title || "",
        id: "name",
        header: "Template Name",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189]">
            {row.original.name || row.original.title}
          </span>
        ),
      },
    ]

    if (isEmail) {
      cols.push({
        accessorKey: "subject",
        header: "Email Subject",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.subject}</span>
        ),
      })
    }

    if (isSms) {
      cols.push({
        accessorFn: (t) => t.send_by || "-",
        id: "send_by",
        header: "Sender / DLT ID",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-[10px]">
            {row.original.send_by || "ADTUUN"}
          </Badge>
        ),
      })
    }

    cols.push({
      accessorFn: (t) => t.content || t.message || "",
      id: "content",
      header: isEmail ? "HTML Body Preview" : "Template Body",
      cell: ({ row }) => {
        const plain = String(
          row.original.content || row.original.message || ""
        ).replace(/<[^>]+>/g, " ")
        return (
          <span className="block max-w-md truncate text-muted-foreground">
            {plain}
          </span>
        )
      },
    })

    cols.push({
      accessorFn: (t) => orgMap[String(t.organization_id)] || "Global",
      id: "org",
      header: "Organization",
    })

    cols.push({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const st = row.original.status
        const isActive =
          st === "active" ||
          st === true ||
          Number(st ?? 1) === 1
        return isActive ? (
          <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            Inactive
          </Badge>
        )
      },
    })

    cols.push({
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
              onClick={() => setPreviewItem(t)}
              className="text-[11px]"
            >
              Preview
            </Button>
            <Button
              size="xs"
              onClick={() => {
                setEditing(t)
                const isInactive =
                  t.status === "inactive" ||
                  t.status === 0 ||
                  t.status === "0" ||
                  t.status === false
                setForm({
                  name: t.name || t.title || "",
                  subject: t.subject || "",
                  content: t.content || t.message || "",
                  send_by: t.send_by || "ADTUUN",
                  provider: "",
                  organization_id: t.organization_id
                    ? String(t.organization_id)
                    : "1",
                  status: isInactive ? "0" : "1",
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
                await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource,
                    action: "delete",
                    id: t.id,
                  }),
                })
                toast.success("Template deleted")
                load()
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
  }, [isEmail, isSms, orgMap, resource, load])

  const charCount = form.content.length
  const smsSegments = Math.max(1, Math.ceil(charCount / 160))

  return (
    <div>
      <BreadcrumbBar parent="Templates" title={title} />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`${title} (${items.length})`}
          columns={columns}
          data={items}
          searchPlaceholder={`Search ${title.toLowerCase()}...`}
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  name: "",
                  subject: isEmail
                    ? "Welcome to Admissions 2026-27 — {company_name}"
                    : "",
                  content: isEmail
                    ? "<p>Dear <strong>{lead_name}</strong>,</p><p>Thank you for your interest in <strong>{course_name}</strong> at {company_name}. Click below to complete your online application:</p><p><a href='{application_link}'>{application_link}</a></p><p>Warm regards,<br/>Admissions Office</p>"
                    : "Dear {lead_name}, thank you for enquiring about {course_name}. Complete your application at {application_link} - Admissions Desk",
                  send_by: "ADTUUN",
                  provider: "",
                  organization_id: orgs[0] ? String(orgs[0].id) : "1",
                  status: "1",
                })
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Create {isEmail ? "Email" : isSms ? "SMS" : "WhatsApp"} Template
            </Button>
          }
        />
      </Card>

      {/* Create / Edit Studio Dialog (8 / 4 2-Column Layout matching df-laravel-crm) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-h-[92vh] overflow-y-auto text-xs sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit ${title} — ${editing.name}` : `Create ${title}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEmail
                ? "Design rich HTML email templates with formatting toolbar and dynamic lead placeholders."
                : isSms
                  ? "Configure DLT-compliant SMS templates with Sender ID, character counter, and dynamic variables."
                  : "Configure WhatsApp business message templates with formatting and dynamic lead variables."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const usedVars = VARIABLES.map((v) => v.token).filter((tok) =>
                form.content.includes(tok)
              )
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource,
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                  variables_json: usedVars,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Template updated!" : "Template created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-12"
          >
            {/* Left 8 Columns: Form & Rich Text / Message Editor */}
            <div className="space-y-3 lg:col-span-8">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs">Template Name *</Label>
                  <Input
                    required
                    placeholder="Admission Welcome Template"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Organization</Label>
                  <select
                    value={form.organization_id}
                    onChange={(e) =>
                      setForm({ ...form, organization_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isEmail && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Label className="mb-1 block text-xs">
                      Email Subject *
                    </Label>
                    <Input
                      required
                      placeholder="Your Application for {course_name}"
                      value={form.subject}
                      onChange={(e) =>
                        setForm({ ...form, subject: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">
                      Provider (Optional)
                    </Label>
                    <Input
                      placeholder="SMTP / SES / SendGrid"
                      value={form.provider}
                      onChange={(e) =>
                        setForm({ ...form, provider: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              )}

              {isSms && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="mb-1 block text-xs">
                      Sender ID / DLT Header *
                    </Label>
                    <Input
                      required
                      placeholder="ADTUUN"
                      value={form.send_by}
                      onChange={(e) =>
                        setForm({ ...form, send_by: e.target.value })
                      }
                      className="h-9 font-mono uppercase text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">
                      Provider (Optional)
                    </Label>
                    <Input
                      placeholder="MSG91 / TextLocal / Fast2SMS"
                      value={form.provider}
                      onChange={(e) =>
                        setForm({ ...form, provider: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              {isWa && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-1 block text-xs">
                      Provider (Optional)
                    </Label>
                    <Input
                      placeholder="DigitalFueled / Meta Cloud / WATI"
                      value={form.provider}
                      onChange={(e) =>
                        setForm({ ...form, provider: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Status</Label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Content Editor */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">
                    {isEmail
                      ? "Email HTML Content (Rich Text Editor) *"
                      : "Message Body *"}
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
                    minHeight={240}
                  />
                ) : (
                  <Textarea
                    required
                    rows={7}
                    value={form.content}
                    onChange={(e) =>
                      setForm({ ...form, content: e.target.value })
                    }
                    placeholder="Type message body with {lead_name} placeholders..."
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
                  className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                >
                  {editing ? "Update Template" : "Save Template"}
                </Button>
              </DialogFooter>
            </div>

            {/* Right 4 Columns: Dynamic Variables & Live Preview */}
            <div className="space-y-3 lg:col-span-4">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <h5 className="mb-1 font-bold text-[#405189]">
                  Available Dynamic Variables
                </h5>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Click any chip to insert into your template:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((v) => (
                    <button
                      key={v.token}
                      type="button"
                      onClick={() => insertVar(v.token)}
                      title={v.desc}
                      className="rounded border border-[#405189]/30 bg-background px-2 py-1 font-mono text-[11px] font-medium text-[#405189] hover:bg-[#405189] hover:text-white"
                    >
                      {v.token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-border p-3">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Live {isWa ? "WhatsApp" : isSms ? "SMS" : "Email"} Preview
                </div>
                {isWa ? (
                  <div className="rounded-lg bg-[#e5ddd5] p-3">
                    <div className="rounded-lg bg-[#dcf8c6] p-2.5 text-xs leading-relaxed text-slate-900 shadow-2xs whitespace-pre-wrap">
                      {form.content || "WhatsApp preview..."}
                    </div>
                  </div>
                ) : isSms ? (
                  <div className="rounded-lg bg-slate-100 p-3 text-slate-800">
                    <div className="mb-1 font-mono text-[10px] font-bold text-slate-500">
                      From: {form.send_by || "ADTUUN"}
                    </div>
                    <div className="rounded-lg bg-white p-2.5 text-xs leading-relaxed shadow-2xs whitespace-pre-wrap">
                      {form.content || "SMS preview..."}
                    </div>
                  </div>
                ) : (
                  <div className="max-h-52 overflow-y-auto rounded border border-slate-200 bg-white p-3 text-xs text-slate-800">
                    <div className="mb-2 border-b border-slate-100 pb-1.5 font-semibold">
                      Subject: {form.subject || "(No subject)"}
                    </div>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: form.content || "<p> Preview...</p>",
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
        onOpenChange={(o) => !o && setPreviewItem(null)}
      >
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {previewItem?.name}
            </DialogTitle>
            {previewItem?.subject && (
              <DialogDescription className="text-xs">
                Subject: {previewItem.subject}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="rounded-md border border-border bg-white p-4 text-xs text-slate-800">
            {isEmail ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: previewItem?.content || "",
                }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                {previewItem?.content}
              </pre>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
