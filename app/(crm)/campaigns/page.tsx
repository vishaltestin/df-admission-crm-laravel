"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { FormSelect } from "@/components/ui/form-select"
import { cn } from "@/lib/utils"

interface CampaignRow {
  id: number
  name: string
  subject: string
  status?: string | number | boolean | null
  type: string
  mail_to: string
  spooling?: string | null
  marketing_template_id?: number | null
  marketing_event_id?: number | null
}

interface NamedItem {
  id: number | string
  name?: string | null
  title?: string | null
  date?: string | null
}

const AUDIENCE_OPTIONS = [
  { value: "all_leads", label: "All Leads" },
  { value: "new_leads", label: "New / Fresh Inquiries" },
  { value: "counseling_pending", label: "Counselling Pending" },
  { value: "application_started", label: "Application Started" },
  { value: "application_submitted", label: "Application Submitted" },
  { value: "closed_leads", label: "Closed / Enrolled Leads" },
]

const AUDIENCE_LABEL_MAP: Record<string, string> = Object.fromEntries(
  AUDIENCE_OPTIONS.map((o) => [o.value, o.label])
)

function isAudienceSegment(val?: string | null) {
  if (!val) return false
  return Boolean(AUDIENCE_LABEL_MAP[val.trim().toLowerCase()])
}

function isCampaignActive(st: CampaignRow["status"]) {
  return (
    st === true ||
    st === 1 ||
    st === "1" ||
    String(st || "").toLowerCase() === "active"
  )
}

function isSpoolingEnabled(sp?: string | null) {
  if (!sp) return false
  const low = sp.toLowerCase()
  return low === "yes" || low === "queue" || low === "1" || low === "true"
}

export default function CampaignsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [campaigns, setCampaigns] = React.useState<CampaignRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])

  const [events, setEvents] = React.useState<NamedItem[]>([])
  const [emailTpls, setEmailTpls] = React.useState<NamedItem[]>([])
  const [smsTpls, setSmsTpls] = React.useState<NamedItem[]>([])
  const [waTpls, setWaTpls] = React.useState<NamedItem[]>([])

  // Add / Edit Campaign Offcanvas Sheet (matching df-laravel-crm #campaignCanvas)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editing, setEditing] = React.useState<CampaignRow | null>(null)

  // Option 1 (Default): "standalone" (direct Mail To / Send To like df-laravel-crm)
  // Option 2: "audience" (CRM Lead Audience Segment selector)
  const [recipientMode, setRecipientMode] = React.useState<
    "standalone" | "audience"
  >("standalone")
  const [standaloneMailTo, setStandaloneMailTo] = React.useState("")
  const [audienceSegment, setAudienceSegment] = React.useState("all_leads")

  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    type: "Email",
    spooling: "No",
    marketing_template_id: "",
    marketing_event_id: "",
    status: true,
  })

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/crm-resources?resource=campaigns")
      const d = await res.json()
      setCampaigns(d.items || [])
      setEvents(d.events || [])
      setEmailTpls(d.emailTemplates || d.templates || [])
      setSmsTpls(d.messageTemplates || [])
      setWaTpls(d.whatsappTemplates || [])
    } catch {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const eventMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const ev of events) m[String(ev.id)] = ev.name || `Event #${ev.id}`
    return m
  }, [events])

  const normalizedType = form.type.toLowerCase()
  const activeTemplates =
    normalizedType === "sms"
      ? smsTpls
      : normalizedType === "whatsapp"
        ? waTpls
        : emailTpls

  const columns = React.useMemo<ColumnDef<CampaignRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={
              campaigns.length > 0 && selected.length === campaigns.length
            }
            onCheckedChange={(checked) =>
              setSelected(checked ? campaigns.map((x) => String(x.id)) : [])
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
          <span className="font-semibold text-[#405189]">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
      },
      {
        accessorFn: (c) => c.type || "Email",
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] uppercase">
            {row.original.type || "Email"}
          </Badge>
        ),
      },
      {
        accessorFn: (c) => c.mail_to || "",
        id: "mail_to",
        header: "Send To / Mail To",
        cell: ({ row }) => {
          const raw = String(row.original.mail_to || "").trim()
          const low = raw.toLowerCase()
          if (AUDIENCE_LABEL_MAP[low]) {
            return (
              <div className="flex items-center gap-1.5">
                <Badge className="bg-[#405189]/10 text-[10px] font-medium text-[#405189] hover:bg-[#405189]/15">
                  Audience
                </Badge>
                <span className="font-medium">{AUDIENCE_LABEL_MAP[low]}</span>
              </div>
            )
          }
          return (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-[#0ab39c]/40 bg-[#0ab39c]/10 text-[10px] font-medium text-[#0ab39c]"
              >
                Direct
              </Badge>
              <span className="font-mono text-[11px]">{raw || "—"}</span>
            </div>
          )
        },
      },
      {
        accessorFn: (c) => eventMap[String(c.marketing_event_id)] || "—",
        id: "event",
        header: "Marketing Event",
      },
      {
        accessorFn: (c) => (isSpoolingEnabled(c.spooling) ? "Yes" : "No"),
        id: "spooling",
        header: "Spooling",
        cell: ({ row }) =>
          isSpoolingEnabled(row.original.spooling) ? (
            <Badge className="bg-sky-100 text-[10px] text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300">
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              No
            </Badge>
          ),
      },
      {
        id: "status",
        accessorFn: (c) => (isCampaignActive(c.status) ? "Active" : "Inactive"),
        header: "Status",
        cell: ({ row }) =>
          isCampaignActive(row.original.status) ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
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
          const c = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                type="button"
                size="xs"
                onClick={async (e) => {
                  e.stopPropagation()
                  const res = await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "campaigns",
                      action: "dispatch",
                      id: c.id,
                    }),
                  })
                  const out = await res.json()
                  if (res.ok) {
                    toast.success(
                      out.mode === "standalone"
                        ? `Campaign "${c.name}" sent to ${out.target} (${out.recipients} recipient${out.recipients === 1 ? "" : "s"})`
                        : `Campaign "${c.name}" queued for ${AUDIENCE_LABEL_MAP[String(out.target || "").toLowerCase()] || out.target} (${out.recipients || 0} leads)`
                    )
                    await load()
                  }
                }}
                className="bg-[#0ab39c] text-[11px] text-white hover:bg-[#099885]"
              >
                <i className="ri-send-plane-line mr-1" />
                Dispatch
              </Button>
              <Button
                type="button"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  const rawType = String(c.type || "Email").toLowerCase()
                  const rawMail = String(c.mail_to || "").trim()
                  const isSeg = isAudienceSegment(rawMail)
                  setEditing(c)
                  setRecipientMode(isSeg ? "audience" : "standalone")
                  setStandaloneMailTo(isSeg ? "" : rawMail)
                  setAudienceSegment(
                    isSeg ? rawMail.toLowerCase() : "all_leads"
                  )
                  setForm({
                    name: c.name || "",
                    subject: c.subject || "",
                    type:
                      rawType === "whatsapp"
                        ? "Whatsapp"
                        : rawType === "sms"
                          ? "SMS"
                          : "Email",
                    spooling: isSpoolingEnabled(c.spooling) ? "Yes" : "No",
                    marketing_template_id: c.marketing_template_id
                      ? String(c.marketing_template_id)
                      : "",
                    marketing_event_id: c.marketing_event_id
                      ? String(c.marketing_event_id)
                      : "",
                    status: isCampaignActive(c.status),
                  })
                  setSheetOpen(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                <i className="ri-pencil-line mr-1" />
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
                    title: "Delete Campaign?",
                    description: `Are you sure you want to permanently delete campaign "${c.name}" (Subject: "${c.subject}")? This action cannot be undone.`,
                    confirmLabel: "Yes, Delete Campaign",
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "campaigns",
                          action: "delete",
                          id: c.id,
                        }),
                      })
                      if (res.ok) {
                        setSelected((prev) =>
                          prev.filter((id) => id !== String(c.id))
                        )
                        toast.success(`Campaign "${c.name}" deleted`)
                        await load()
                      } else {
                        toast.error("Failed to delete campaign")
                      }
                    },
                  })
                }}
                className="text-[11px]"
              >
                <i className="ri-delete-bin-line mr-1" />
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [campaigns, selected, eventMap, load, confirmDelete]
  )

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="CRM" title="Campaigns" />

      {loading ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-40" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="gap-0 py-0 text-xs shadow-xs">
          <DataTable
            title={`Campaigns (${campaigns.length})`}
            columns={columns}
            data={campaigns}
            searchPlaceholder="Search campaign name, subject, recipient..."
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
                        title: `Delete ${selected.length} Campaign(s)?`,
                        description: `Are you sure you want to permanently delete ${selected.length} selected campaign(s)? This action cannot be undone.`,
                        confirmLabel: `Yes, Delete (${selected.length})`,
                        onConfirm: async () => {
                          const res = await fetch("/api/crm-resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resource: "campaigns",
                              action: "bulk_delete",
                              ids: selected,
                            }),
                          })
                          if (res.ok) {
                            setSelected([])
                            toast.success("Selected campaigns deleted")
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
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Link href="/marketing-events">Manage Events</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditing(null)
                    // Default to Option 1: Standalone Send To (Mail To), matching df-laravel-crm
                    setRecipientMode("standalone")
                    setStandaloneMailTo("")
                    setAudienceSegment("all_leads")
                    setForm({
                      name: "",
                      subject: "",
                      type: "Email",
                      spooling: "No",
                      marketing_template_id: emailTpls[0]
                        ? String(emailTpls[0].id)
                        : "",
                      marketing_event_id: events[0]
                        ? String(events[0].id)
                        : "",
                      status: true,
                    })
                    setSheetOpen(true)
                  }}
                  className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  + Add Campaigns
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Add / Edit Campaign Offcanvas Sheet (1:1 df-laravel-crm #campaignCanvas + Dual Send To Mode) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto text-xs sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle className="text-base font-bold text-[#405189]">
              {editing ? "Edit Campaign" : "Add Campaign"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send directly to a standalone recipient (default) or broadcast to
              a CRM Lead Audience segment.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const resolvedMailTo =
                recipientMode === "standalone"
                  ? standaloneMailTo.trim()
                  : audienceSegment

              if (!resolvedMailTo) {
                toast.error(
                  recipientMode === "standalone"
                    ? "Please enter a standalone Mail To / Send To recipient."
                    : "Please choose a CRM Lead Audience segment."
                )
                return
              }

              setSaving(true)
              try {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "campaigns",
                    action: editing ? "update" : "create",
                    id: editing?.id,
                    name: form.name,
                    subject: form.subject,
                    type: form.type,
                    mail_to: resolvedMailTo,
                    spooling: form.spooling,
                    marketing_template_id: form.marketing_template_id || null,
                    marketing_event_id: form.marketing_event_id || null,
                    status: form.status ? "Active" : "Inactive",
                  }),
                })
                const out = await res.json()
                if (res.ok) {
                  toast.success(
                    editing ? "Campaign updated!" : "Campaign created!"
                  )
                  setSheetOpen(false)
                  await load()
                } else {
                  toast.error(out.error || "Failed to save campaign")
                }
              } finally {
                setSaving(false)
              }
            }}
            className="flex flex-1 flex-col justify-between gap-4 p-4"
          >
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Name *
                </Label>
                <Input
                  required
                  placeholder="Admission 2026-27 Drive"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Subject *
                </Label>
                <Input
                  required
                  placeholder="Applications Open for 2026-27!"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">Type</Label>
                <FormSelect
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                      marketing_template_id: "",
                    })
                  }
                  className="h-9 w-full"
                >
                  <option value="Email">Email</option>
                  <option value="Whatsapp">Whatsapp</option>
                  <option value="SMS">SMS</option>
                </FormSelect>
              </div>

              {/* Dual Recipient Mode:
                  1st & Default: Standalone Send To / Mail To (df-laravel-crm)
                  2nd Option: CRM Lead Audience Segment */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                <Label className="block text-xs font-semibold">
                  Send To / Recipient Mode *
                </Label>

                <div className="grid grid-cols-2 gap-1.5 rounded-md border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setRecipientMode("standalone")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                      recipientMode === "standalone"
                        ? "bg-[#405189] text-white shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <i className="ri-mail-send-line" />
                    <span>Standalone Send To</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientMode("audience")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                      recipientMode === "audience"
                        ? "bg-[#405189] text-white shadow-2xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <i className="ri-team-line" />
                    <span>CRM Lead Audience</span>
                  </button>
                </div>

                {recipientMode === "standalone" ? (
                  <div className="pt-1">
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        {normalizedType === "email" ? "Mail To *" : "Send To *"}
                      </Label>
                      <Badge
                        variant="outline"
                        className="border-[#0ab39c]/40 bg-[#0ab39c]/10 text-[10px] text-[#0ab39c]"
                      >
                        Default Direct Mode
                      </Badge>
                    </div>
                    <Input
                      required
                      placeholder={
                        normalizedType === "email"
                          ? "example@gmail.com (or comma-separated emails)"
                          : "9876543210 (or comma-separated mobile numbers)"
                      }
                      value={standaloneMailTo}
                      onChange={(e) => setStandaloneMailTo(e.target.value)}
                      className="h-9 bg-background text-xs"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {normalizedType === "email"
                        ? "Enter a standalone email address (e.g. example@gmail.com) or multiple comma-separated addresses."
                        : `Enter a standalone ${form.type} mobile number or comma-separated numbers.`}
                    </p>
                  </div>
                ) : (
                  <div className="pt-1">
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Target Lead Audience *
                      </Label>
                      <Badge variant="secondary" className="text-[10px]">
                        Option 2 • Segment
                      </Badge>
                    </div>
                    <FormSelect
                      value={audienceSegment}
                      onChange={(e) => setAudienceSegment(e.target.value)}
                      className="h-9 w-full bg-background"
                    >
                      {AUDIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </FormSelect>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Broadcasts this campaign to all matching leads in your CRM
                      organization.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Spooling
                </Label>
                <FormSelect
                  value={form.spooling}
                  onChange={(e) =>
                    setForm({ ...form, spooling: e.target.value })
                  }
                  className="h-9 w-full"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Select Template
                </Label>
                <FormSelect
                  value={form.marketing_template_id}
                  onChange={(e) =>
                    setForm({ ...form, marketing_template_id: e.target.value })
                  }
                  className="h-9 w-full"
                >
                  <option value="">Select {form.type} Template</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.name || t.title || `Template #${t.id}`}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Marketing Event
                </Label>
                <FormSelect
                  value={form.marketing_event_id}
                  onChange={(e) =>
                    setForm({ ...form, marketing_event_id: e.target.value })
                  }
                  className="h-9 w-full"
                >
                  <option value="">Select Event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={String(ev.id)}>
                      {ev.name}
                      {ev.date ? ` (${String(ev.date).slice(0, 10)})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-2.5">
                <Label
                  htmlFor="camp-status-switch"
                  className="cursor-pointer text-xs font-semibold"
                >
                  Status (Active)
                </Label>
                <Switch
                  id="camp-status-switch"
                  checked={form.status}
                  onCheckedChange={(v) => setForm({ ...form, status: v })}
                />
              </div>
            </div>

            <SheetFooter className="border-t border-border pt-3 sm:flex-col">
              <Button
                type="submit"
                disabled={saving}
                className="h-9 w-full bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {DeleteDialog}
    </div>
  )
}
