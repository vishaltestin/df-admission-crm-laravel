"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { FormSelect } from "@/components/ui/form-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
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

export default function FollowUpCalendarPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = React.useState<any[]>([])
  const [showAdd, setShowAdd] = React.useState(false)
  const [form, setForm] = React.useState({
    lead_id: "",
    subject: "Counselling Callback",
    event_type: "call",
    start_at: "2026-10-28T11:00",
    description: "",
  })

  const load = React.useCallback(() => {
    fetch("/api/calendar/events")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || [])
        setLeads(d.leads || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (ev) => ev.start_at || "",
        id: "start_at",
        header: "Date & Time",
        cell: ({ row }) => (
          <span className="font-semibold text-[#405189] whitespace-nowrap">
            {row.original.start_at
              ? new Date(row.original.start_at).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
      {
        accessorFn: (ev) => ev.event_type || "call",
        id: "event_type",
        header: "Type",
        cell: ({ row }) => (
          <Badge className="bg-[#299cdb]/15 text-[10px] font-bold uppercase text-[#299cdb] hover:bg-[#299cdb]/25">
            {row.original.event_type || "call"}
          </Badge>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.subject}</span>
        ),
      },
      {
        accessorFn: (ev) => `${ev.lead_name || ""} ${ev.lead_mobile || ""}`,
        id: "lead",
        header: "Student Lead",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              {row.original.lead_name}
            </Link>
            <div className="font-mono text-[11px] text-muted-foreground">
              {row.original.lead_mobile}
            </div>
          </div>
        ),
      },
      {
        accessorFn: (ev) => ev.description || "-",
        id: "description",
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.description || "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right whitespace-nowrap">
            <Button asChild size="xs" variant="outline">
              <Link href={`/leads/${row.original.lead_id}`}>Open Lead →</Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="Leads" title="Follow-Up Calendar & Schedule" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={`Scheduled Follow-Ups & Campus Visits (${events.length})`}
          columns={columns}
          data={events}
          searchPlaceholder="Search student, subject, or mobile..."
          emptyMessage="No scheduled follow-up events yet. Click + Schedule Follow-Up above!"
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setForm((prev) => ({
                  ...prev,
                  lead_id: leads[0]?.id ? String(leads[0].id) : "",
                }))
                setShowAdd(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Schedule Follow-Up
            </Button>
          }
        />
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Schedule Lead Follow-Up
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a scheduled phone call, video counselling, or campus visit.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/calendar/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              })
              if (res.ok) {
                toast.success("Follow-up scheduled!")
                setShowAdd(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Student Lead *</Label>
              <FormSelect
                required
                value={form.lead_id}
                onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.mobile})
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Event Type</Label>
                <FormSelect
                  value={form.event_type}
                  onChange={(e) =>
                    setForm({ ...form, event_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">Campus Visit</option>
                  <option value="counselling">Video Counselling</option>
                </FormSelect>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Date & Time *</Label>
                <DateTimePicker
                  value={form.start_at}
                  onChange={(v) => setForm({ ...form, start_at: v })}
                  placeholder="Pick event date & time"
                />
              </div>
            </div>
            <Input
              required
              placeholder="Subject *"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="h-9 text-xs"
            />
            <Textarea
              rows={2}
              placeholder="Agenda / Discussion Notes"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="text-xs"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
