"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function CampaignsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emailTpls, setEmailTpls] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [smsTpls, setSmsTpls] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [waTpls, setWaTpls] = React.useState<any[]>([])

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    subject: "",
    type: "email",
    mail_to: "all_leads",
    marketing_event_id: "",
    marketing_template_id: "",
    spooling: "queue",
    status: true,
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.items || [])
        setEvents(d.events || [])
        setEmailTpls(d.emailTemplates || [])
        setSmsTpls(d.messageTemplates || [])
        setWaTpls(d.whatsappTemplates || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const eventMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const ev of events) m[String(ev.id)] = ev.name
    return m
  }, [events])

  const activeTemplates =
    form.type === "sms"
      ? smsTpls
      : form.type === "whatsapp"
        ? waTpls
        : emailTpls

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
        accessorFn: (c) => c.type || "email",
        id: "type",
        header: "Channel",
        cell: ({ row }) => (
          <Badge variant="outline" className="uppercase text-[10px]">
            {row.original.type || "email"}
          </Badge>
        ),
      },
      {
        accessorFn: (c) => eventMap[String(c.marketing_event_id)] || "-",
        id: "event",
        header: "Event",
      },
      {
        accessorFn: (c) => c.mail_to || "all_leads",
        id: "mail_to",
        header: "Audience",
        cell: ({ row }) => (
          <span className="capitalize">
            {String(row.original.mail_to || "all_leads").replace(/_/g, " ")}
          </span>
        ),
      },
      {
        accessorFn: (c) => c.spooling || "-",
        id: "spooling",
        header: "Spooling",
        cell: ({ row }) =>
          row.original.spooling ? (
            <Badge className="bg-sky-100 text-[10px] text-sky-700">
              Spool On
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Direct
            </Badge>
          ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const st = row.original.status
          const isActive =
            Number(st ?? 0) === 1 ||
            st === true ||
            String(st || "").toLowerCase() === "active"
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
                size="xs"
                onClick={async () => {
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
                  if (res.ok) toast.success(out.message || "Campaign queued!")
                }}
                className="bg-[#0ab39c] text-[11px] text-white hover:bg-[#099885]"
              >
                Dispatch
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  setEditing(c)
                  setForm({
                    name: c.name || "",
                    subject: c.subject || "",
                    type: c.type || "email",
                    mail_to: c.mail_to || "all_leads",
                    marketing_event_id: c.marketing_event_id
                      ? String(c.marketing_event_id)
                      : "",
                    marketing_template_id: c.marketing_template_id
                      ? String(c.marketing_template_id)
                      : "",
                    spooling:
                      c.spooling && c.spooling !== "No" && c.spooling !== "0"
                        ? c.spooling
                        : "",
                    status:
                      Number(c.status ?? 0) === 1 ||
                      c.status === true ||
                      String(c.status || "").toLowerCase() === "active",
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
                      resource: "campaigns",
                      action: "delete",
                      id: c.id,
                    }),
                  })
                  toast.success("Campaign deleted")
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
    [eventMap, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="Master Data" title="Marketing Campaigns" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Marketing Campaigns (${campaigns.length})`}
          columns={columns}
          data={campaigns}
          searchPlaceholder="Search campaign name, subject, audience..."
          toolbarRight={
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/marketing-events">Manage Events</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    subject: "",
                    type: "email",
                    mail_to: "all_leads",
                    marketing_event_id: events[0] ? String(events[0].id) : "",
                    marketing_template_id: emailTpls[0]
                      ? String(emailTpls[0].id)
                      : "",
                    spooling: "queue",
                    status: true,
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                + Create Campaign
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Campaign — ${editing.name}` : "Create Campaign"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure campaign event schedule, communication channel, template, audience, spooling, and active status.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "campaigns",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Campaign updated!" : "Campaign created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Campaign Name *</Label>
                <Input
                  required
                  placeholder="Admission 2026-27 Drive"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Subject *</Label>
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
                <Label className="mb-1 block text-xs">Channel Type *</Label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                      marketing_template_id: "",
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="email">Email Campaign</option>
                  <option value="whatsapp">WhatsApp Broadcast</option>
                  <option value="sms">DLT SMS Campaign</option>
                </select>
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Send To / Audience *
                </Label>
                <select
                  value={form.mail_to}
                  onChange={(e) =>
                    setForm({ ...form, mail_to: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="all_leads">All Leads</option>
                  <option value="new_leads">New / Fresh Inquiries</option>
                  <option value="counseling_pending">Counselling Pending</option>
                  <option value="application_started">Application Started</option>
                </select>
              </div>

              <div>
                <Label className="mb-1 block text-xs">Marketing Event *</Label>
                <select
                  value={form.marketing_event_id}
                  onChange={(e) =>
                    setForm({ ...form, marketing_event_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select Event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} {ev.date ? `(${ev.date})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  {form.type.toUpperCase()} Template *
                </Label>
                <select
                  value={form.marketing_template_id}
                  onChange={(e) =>
                    setForm({ ...form, marketing_template_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select Template</option>
                  {activeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="camp-spool"
                  checked={Boolean(form.spooling)}
                  onCheckedChange={(v) =>
                    setForm({ ...form, spooling: v ? "queue" : "" })
                  }
                />
                <Label htmlFor="camp-spool" className="cursor-pointer text-xs">
                  Enable Queue Spooling
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="camp-status"
                  checked={form.status}
                  onCheckedChange={(v) => setForm({ ...form, status: v })}
                />
                <Label htmlFor="camp-status" className="cursor-pointer text-xs">
                  Campaign Active Status
                </Label>
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
                {editing ? "Update Campaign" : "Save Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
