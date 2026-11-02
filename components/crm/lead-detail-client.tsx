"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { formatDateShort, formatDateTime } from "@/lib/serialize"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const TABS = [
  { id: "details", label: "Lead Details", icon: "ri-profile-line" },
  { id: "timeline", label: "Timeline", icon: "ri-history-line" },
  { id: "notes", label: "Notes", icon: "ri-sticky-note-line" },
  { id: "communication", label: "Communication", icon: "ri-mail-send-line" },
  { id: "events", label: "Events", icon: "ri-calendar-event-line" },
  { id: "docverify", label: "DocVerify", icon: "ri-Shield-check-line" },
  { id: "tickets", label: "Tickets", icon: "ri-customer-service-2-line" },
  { id: "calls", label: "Call Logs", icon: "ri-phone-line" },
  { id: "calendar", label: "Calendar Pro", icon: "ri-calendar-todo-line" },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LeadDetailClient({ leadId, master }: { leadId: string; master: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("timeline")

  // Drawers / Modals
  const [noteModalOpen, setNoteModalOpen] = React.useState(false)
  const [noteText, setNoteText] = React.useState("")

  const [stageDrawerOpen, setStageDrawerOpen] = React.useState(false)
  const [stageForm, setStageForm] = React.useState({
    lead_status_id: "",
    lead_sub_status_id: "",
    followup_date: "",
    note: "",
  })

  const [commDrawerOpen, setCommDrawerOpen] = React.useState(false)
  const [commForm, setCommForm] = React.useState({
    channel: "email",
    subject: "",
    message: "",
  })

  const [eventDrawerOpen, setEventDrawerOpen] = React.useState(false)
  const [eventForm, setEventForm] = React.useState({
    subject: "Admissions Follow-up Call",
    event_type: "phone_call",
    start_at: "",
    end_at: "",
    description: "",
  })

  const [waDrawerOpen, setWaDrawerOpen] = React.useState(false)
  const [waQuickMsg, setWaQuickMsg] = React.useState("")

  const [reassignOpen, setReassignOpen] = React.useState(false)
  const [reassignUserId, setReassignUserId] = React.useState("")

  // Application Payment & Coupon Modal
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState("")
  const [couponDiscount, setCouponDiscount] = React.useState(0)
  const [paymentMethod, setPaymentMethod] = React.useState("online")
  const [txnId, setTxnId] = React.useState("")

  // DocVerify upload modal
  const [docModalOpen, setDocModalOpen] = React.useState(false)
  const [docTitle, setDocTitle] = React.useState("12th Marksheet")

  // Ticket creation & reply state
  const [ticketSubject, setTicketSubject] = React.useState("")
  const [ticketCategory, setTicketCategory] = React.useState("Admissions")
  const [ticketMessage, setTicketMessage] = React.useState("")
  const [replyTextMap, setReplyTextMap] = React.useState<Record<number, string>>({})

  // Editable Lead Details tab form
  const [profileForm, setProfileForm] = React.useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    state: "",
    city: "",
    institute_id: "",
    programme_id: "",
    faculty_id: "",
    lead_source_id: "",
    pipeline_id: "",
    description: "",
  })

  const fetchDetail = React.useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}`)
    if (res.ok) {
      const json = await res.json()
      setData(json)
      const l = json.lead
      setProfileForm({
        name: l.name || "",
        mobile: l.mobile || "",
        alternate_mobile: l.alternate_mobile || "",
        email: l.email || "",
        state: l.state ? String(l.state) : "",
        city: l.city ? String(l.city) : "",
        institute_id: l.institute_id ? String(l.institute_id) : "",
        programme_id: l.programme_id ? String(l.programme_id) : "",
        faculty_id: l.faculty_id ? String(l.faculty_id) : "",
        lead_source_id: l.lead_source_id ? String(l.lead_source_id) : "",
        pipeline_id: l.pipeline_id ? String(l.pipeline_id) : "",
        description: l.description || "",
      })
      setStageForm((prev) => ({
        ...prev,
        lead_status_id: l.lead_status_id ? String(l.lead_status_id) : "",
        lead_sub_status_id: l.lead_sub_status_id ? String(l.lead_sub_status_id) : "",
      }))
      setReassignUserId(l.lead_assign_to ? String(l.lead_assign_to) : "")
    }
    setLoading(false)
  }, [leadId])

  React.useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  async function postAction(payload: Record<string, unknown>, successMsg?: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (res.ok) {
      if (successMsg) toast.success(successMsg)
      fetchDetail()
      return json
    } else {
      toast.error(json.error || "Action failed")
      return null
    }
  }

  if (loading || !data) {
    return (
      <div className="rounded-md border border-border bg-card p-10 text-center text-xs text-muted-foreground">
        Loading 360° Lead Profile...
      </div>
    )
  }

  const {
    lead,
    stages,
    notes,
    events,
    commLogs,
    activities,
    documents,
    appResponses,
    verification,
    tickets,
    ticketMessages,
    callLogs,
    coupons,
  } = data

  // Lookup helpers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusObj = master.statuses.find((s: any) => String(s.id) === String(lead.lead_status_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subStatusObj = master.subStatuses.find((s: any) => String(s.id) === String(lead.lead_sub_status_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instituteObj = master.institutes.find((i: any) => String(i.id) === String(lead.institute_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programObj = master.programs.find((p: any) => String(p.id) === String(lead.programme_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courseObj = master.courses.find((c: any) => String(c.id) === String(lead.faculty_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceObj = master.sources.find((s: any) => String(s.id) === String(lead.lead_source_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipelineObj = master.pipelines.find((p: any) => String(p.id) === String(lead.pipeline_id))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerObj = master.users.find((u: any) => String(u.id) === String(lead.lead_assign_to))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cityObj = master.cities.find((c: any) => String(c.id) === String(lead.city))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stateObj = master.states.find((s: any) => String(s.id) === String(lead.state))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appFormObj = master.applicationForms.find((f: any) => String(f.id) === String(lead.application_form_id)) || master.applicationForms[0]

  const baseAppFee = Number(appFormObj?.total_amount || 1200)
  const netPayable = Math.max(0, baseAppFee - couponDiscount)
  const latestApp = appResponses[0]

  // Determine current stage index for pipeline stepper
  const currentStageIdx = Math.max(
    0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stages.findIndex((st: any) => String(st.id) === String(lead.stage_id))
  )

  const whatsappMessages = commLogs.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.channel === "whatsapp"
  )

  return (
    <div className="space-y-4">
      {/* ==================== TOP PIPELINE STEPPER BAR ==================== */}
      <Card className="gap-2 p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="xs">
              <Link href="/leads">
                <i className="ri-arrow-left-line mr-1" /> Leads
              </Link>
            </Button>
            <span className="font-semibold text-muted-foreground">
              Pipeline:{" "}
              <strong className="text-foreground">
                {pipelineObj?.name || "Admissions Pipeline"}
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Click any stage below to advance lead
          </span>
        </div>

        <div className="pipeline-bar">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {stages.map((st: any, idx: number) => {
            const stateClass =
              idx < currentStageIdx
                ? "completed"
                : idx === currentStageIdx
                  ? "current"
                  : "upcoming"
            return (
              <div
                key={st.id}
                onClick={() =>
                  postAction(
                    {
                      action: "change_pipeline_stage",
                      stage_id: st.id,
                      stage_name: st.name,
                    },
                    `Moved to stage: ${st.name}`
                  )
                }
                className={`pipeline-step ${stateClass}`}
              >
                {idx < currentStageIdx && <i className="ri-check-line mr-1" />}
                {st.name}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ==================== MAIN 2-COLUMN VELZON LAYOUT ==================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* LEFT SIDEBAR CARDS (4 SHADCN CARDS) */}
        <div className="min-w-0 space-y-4 xl:col-span-3">
          {/* Card 1: Lead Summary */}
          <Card className="gap-3 p-4 shadow-xs text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarFallback className="bg-[#405189]/15 text-base font-bold text-[#405189]">
                    {lead.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-bold">{lead.name}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${statusObj?.color || "#405189"}20`,
                        color: statusObj?.color || "#405189",
                      }}
                      className="rounded px-2 py-0.5 text-[11px] font-semibold"
                    >
                      {statusObj?.name || "New"}
                    </Badge>
                    {subStatusObj && (
                      <Badge
                        variant="secondary"
                        className="rounded px-2 py-0.5 text-[10px]"
                      >
                        {subStatusObj.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setStageDrawerOpen(true)}
                title="Change Lead Stage"
              >
                <i className="ri-pencil-line text-sm" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded bg-muted/50 p-2.5 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">Score</div>
                <div className="text-sm font-bold text-[#0ab39c]">
                  {lead.lead_score ?? 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Weight</div>
                <div className="text-sm font-bold text-[#405189]">
                  {lead.lead_weight_count ?? 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">OTP</div>
                <div className="text-[11px] font-semibold">
                  {verification?.sms_verified ? (
                    <span className="text-[#0ab39c]">Verified</span>
                  ) : (
                    <span className="text-amber-600">Pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-border pt-2.5">
              <div className="flex items-center gap-2">
                <i className="ri-phone-fill text-[#0ab39c]" />
                <span className="font-medium">{lead.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-mail-fill text-[#405189]" />
                <span className="truncate">{lead.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <i className="ri-map-pin-fill text-[#f06548]" />
                <span>
                  {[cityObj?.name, stateObj?.name].filter(Boolean).join(", ") ||
                    "India"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() =>
                postAction(
                  { action: "call_now", duration: 95 },
                  `Connected Click-to-Call with ${lead.mobile}!`
                )
              }
              className="w-full gap-2 bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              <i className="ri-phone-line text-sm" /> Call Now
            </Button>
          </Card>

          {/* Card 2: Lead Attribution Details */}
          <Card className="gap-2.5 p-4 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h5 className="font-semibold uppercase text-muted-foreground">
                Details
              </h5>
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className="text-[#405189] hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pipeline:</span>
              <span className="font-medium">{pipelineObj?.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source:</span>
              <span className="font-medium">{sourceObj?.name || "Direct"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Followup:</span>
              <span className="font-medium">
                {formatDateTime(lead.next_followup_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered:</span>
              <span className="font-medium">
                {formatDateShort(lead.created_at)}
              </span>
            </div>
          </Card>

          {/* Card 3: Application & Fee Payment */}
          <Card className="gap-2.5 p-4 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h5 className="font-semibold uppercase text-muted-foreground">
                Application
              </h5>
              {latestApp?.payment_status === 1 ? (
                <Badge className="bg-[#0ab39c]/15 font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/20">
                  Paid ₹{latestApp.payment_amount}
                </Badge>
              ) : (
                <Badge className="bg-[#f7b84b]/20 font-semibold text-amber-700 hover:bg-[#f7b84b]/30">
                  Unpaid
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Institute:</div>
              <div className="font-semibold">{instituteObj?.name || "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Program / Course:</div>
              <div className="font-medium">
                {[programObj?.name, courseObj?.name]
                  .filter(Boolean)
                  .join(" • ") || "-"}
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setPaymentModalOpen(true)}
              className="mt-1 w-full bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              <i className="ri-bank-card-line mr-1" />
              {latestApp?.payment_status === 1
                ? "Record Additional Fee"
                : "Take Application Payment"}
            </Button>
          </Card>

          {/* Card 4: Assigned Counsellor */}
          <Card className="gap-2.5 p-4 shadow-xs text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h5 className="font-semibold uppercase text-muted-foreground">
                Assigned User
              </h5>
              <button
                type="button"
                onClick={() => setReassignOpen(true)}
                className="font-semibold text-[#299cdb] hover:underline"
              >
                Re-assign
              </button>
            </div>
            {ownerObj ? (
              <div>
                <div className="font-semibold">
                  {ownerObj.first_name} {ownerObj.last_name}
                </div>
                <div className="text-muted-foreground">{ownerObj.email}</div>
              </div>
            ) : (
              <div className="rounded bg-[#f7b84b]/20 p-2 font-medium text-amber-800">
                Untouched / Unassigned Lead
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT MAIN WORKSPACE (ACTION BAR + 9 TABS) */}
        <div className="min-w-0 space-y-4 xl:col-span-9">
          {/* Top 5 Quick Action Buttons */}
          <Card className="flex-row flex-wrap items-center gap-2 p-3 shadow-xs">
            <Button
              type="button"
              size="sm"
              onClick={() => setNoteModalOpen(true)}
              className="gap-1.5 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
            >
              <i className="ri-sticky-note-line" /> Add Note
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStageDrawerOpen(true)}
              className="gap-1.5 bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2389c2]"
            >
              <i className="ri-shuffle-line" /> Change Stage
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCommDrawerOpen(true)}
              className="gap-1.5 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <i className="ri-mail-send-line" /> Communicate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setEventDrawerOpen(true)}
              className="gap-1.5 bg-[#f7b84b] text-xs font-semibold text-slate-900 hover:bg-[#eab308]"
            >
              <i className="ri-calendar-event-line" /> Add Event
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setWaDrawerOpen(true)}
              className="ml-auto gap-1.5 border-[#0ab39c] bg-[#0ab39c]/10 text-xs font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/20"
            >
              <i className="ri-whatsapp-line text-sm" /> WhatsApp History (
              {whatsappMessages.length})
            </Button>
          </Card>

          {/* 9-Tab Card with shadcn Tabs */}
          <Card className="gap-0 py-0 shadow-xs">
            <div className="no-scrollbar overflow-x-auto border-b border-border px-3 pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line" className="h-auto gap-1 p-0">
                  {TABS.map((t) => (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="gap-1.5 px-3 py-2.5 text-xs font-semibold data-active:text-[#405189]"
                    >
                      <i className={t.icon} />
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="p-4 text-xs">
              {/* TAB 1: LEAD DETAILS EDIT FORM */}
              {activeTab === "details" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    postAction(
                      { action: "update_details", ...profileForm },
                      "Lead profile updated!"
                    )
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block font-medium">Full Name</label>
                      <input
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Mobile</label>
                      <input
                        value={profileForm.mobile}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            mobile: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Email</label>
                      <input
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            email: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Institute</label>
                      <select
                        value={profileForm.institute_id}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            institute_id: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      >
                        <option value="">Select Institute</option>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {master.institutes.map((i: any) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Program</label>
                      <select
                        value={profileForm.programme_id}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            programme_id: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      >
                        <option value="">Select Program</option>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {master.programs.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Course</label>
                      <select
                        value={profileForm.faculty_id}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            faculty_id: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded border border-input bg-background px-3"
                      >
                        <option value="">Select Course</option>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {master.courses.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block font-medium">
                      Student Remarks / Summary
                    </label>
                    <textarea
                      rows={3}
                      value={profileForm.description}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded border border-input bg-background p-3"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded bg-[#0ab39c] px-4 py-2 font-semibold text-white"
                  >
                    Save Lead Details
                  </button>
                </form>
              )}

              {/* TAB 2: TIMELINE */}
              {activeTab === "timeline" && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No timeline events yet.
                    </p>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    activities.map((act: any) => (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 border-l-2 border-[#405189] pl-4 py-1"
                      >
                        <div className="flex-1">
                          <div className="font-semibold capitalize">
                            {String(act.action).replace(/_/g, " ")}
                          </div>
                          <p className="text-muted-foreground">{act.description || act.details}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(act.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: NOTES */}
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!noteText.trim()) return
                      postAction(
                        { action: "add_note", note: noteText },
                        "Note saved"
                      )
                      setNoteText("")
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a quick counselling note..."
                      className="h-9 flex-1 rounded border border-input bg-background px-3"
                    />
                    <button
                      type="submit"
                      className="rounded bg-[#405189] px-4 font-semibold text-white"
                    >
                      Add Note
                    </button>
                  </form>

                  <div className="divide-y divide-border">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {notes.map((n: any) => (
                      <div
                        key={n.id}
                        className="flex items-start justify-between py-3"
                      >
                        <div>
                          <p className="whitespace-pre-wrap">{n.note}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(n.created_at)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            postAction(
                              { action: "delete_note", note_id: n.id },
                              "Note deleted"
                            )
                          }
                          className="text-[#f06548] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: COMMUNICATION LOGS */}
              {activeTab === "communication" && (
                <div className="-m-4">
                  <DataTable
                     
                    columns={[
                      {
                        accessorKey: "channel",
                        header: "Channel",
                        cell: ({ row }) => (
                          <span className="font-semibold uppercase">
                            {row.original.channel}
                          </span>
                        ),
                      },
                      {
                        accessorFn: (c) => c.subject || "-",
                        id: "subject",
                        header: "Subject",
                      },
                      {
                        accessorFn: (c) => c.message || c.content || "",
                        id: "message",
                        header: "Message",
                        cell: ({ row }) => (
                          <div className="max-w-md truncate">
                            {row.original.message || row.original.content}
                          </div>
                        ),
                      },
                      {
                        accessorKey: "status",
                        header: "Status",
                        cell: ({ row }) => (
                          <span className="rounded bg-[#0ab39c]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0ab39c]">
                            {row.original.status}
                          </span>
                        ),
                      },
                      {
                        accessorFn: (c) => c.sent_at || c.created_at || "",
                        id: "sent_at",
                        header: "Sent At",
                        cell: ({ row }) => (
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(
                              row.original.sent_at || row.original.created_at
                            )}
                          </span>
                        ),
                      },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ] as ColumnDef<any>[]}
                    data={commLogs}
                    searchPlaceholder="Search communications..."
                    emptyMessage="No communication history for this lead yet."
                  />
                </div>
              )}

              {/* TAB 5: EVENTS */}
              {activeTab === "events" && (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {events.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
                    >
                      <div>
                        <div className="font-semibold">
                          {ev.subject}{" "}
                          <span className="ml-1 rounded bg-muted px-2 py-0.5 text-[10px] uppercase">
                            {ev.event_type}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {formatDateTime(ev.start_at)} • {ev.description || "Follow-up"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#299cdb]/15 px-2 py-0.5 text-[11px] font-semibold capitalize text-[#299cdb]">
                          {ev.status}
                        </span>
                        {ev.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() =>
                              postAction(
                                {
                                  action: "event_status",
                                  event_id: ev.id,
                                  status: "completed",
                                },
                                "Event marked completed!"
                              )
                            }
                            className="rounded bg-[#0ab39c] px-2.5 py-1 text-[11px] font-semibold text-white"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: DOCVERIFY */}
              {activeTab === "docverify" && (
                <div className="-m-4">
                  <DataTable
                    title={`Student Admission Documents (${documents.length})`}
                     
                    columns={[
                      {
                        accessorKey: "title",
                        header: "Document Title",
                        cell: ({ row }) => (
                          <span className="font-semibold">
                            {row.original.title}
                          </span>
                        ),
                      },
                      {
                        accessorKey: "status",
                        header: "Verification Status",
                        cell: ({ row }) => {
                          const d = row.original
                          return (
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                d.status === "approved"
                                  ? "bg-[#0ab39c]/15 text-[#0ab39c]"
                                  : d.status === "rejected"
                                    ? "bg-[#f06548]/15 text-[#f06548]"
                                    : "bg-[#f7b84b]/20 text-amber-700"
                              }`}
                            >
                              {d.status}
                            </span>
                          )
                        },
                      },
                      {
                        accessorFn: (d) => d.created_at || "",
                        id: "created_at",
                        header: "Uploaded",
                        cell: ({ row }) => (
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(row.original.created_at)}
                          </span>
                        ),
                      },
                      {
                        id: "actions",
                        header: () => (
                          <div className="text-right">Verify Actions</div>
                        ),
                        enableSorting: false,
                        cell: ({ row }) => {
                          const d = row.original
                          return (
                            <div className="flex justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  postAction(
                                    {
                                      action: "verify_doc",
                                      doc_id: d.id,
                                      status: "approved",
                                    },
                                    "Document Approved"
                                  )
                                }
                                className="rounded bg-[#0ab39c] px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  postAction(
                                    {
                                      action: "verify_doc",
                                      doc_id: d.id,
                                      status: "rejected",
                                    },
                                    "Document Rejected"
                                  )
                                }
                                className="rounded bg-[#f06548] px-2.5 py-1 text-[11px] font-semibold text-white"
                              >
                                Reject
                              </button>
                            </div>
                          )
                        },
                      },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ] as ColumnDef<any>[]}
                    data={documents}
                    searchPlaceholder="Search documents..."
                    emptyMessage="No documents uploaded for this student yet."
                    toolbarRight={
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setDocModalOpen(true)}
                        className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                      >
                        + Upload Document
                      </Button>
                    }
                  />
                </div>
              )}

              {/* TAB 7: TICKETS / QUERIES */}
              {activeTab === "tickets" && (
                <div className="space-y-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!ticketSubject.trim()) return
                      postAction(
                        {
                          action: "create_ticket",
                          subject: ticketSubject,
                          category: ticketCategory,
                          message: ticketMessage,
                        },
                        "Support Ticket Created!"
                      )
                      setTicketSubject("")
                      setTicketMessage("")
                    }}
                    className="rounded border border-border bg-muted/30 p-3 space-y-2.5"
                  >
                    <div className="font-semibold">Raise Student Query / Ticket</div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <input
                        required
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Ticket Subject"
                        className="h-8 rounded border border-input bg-background px-2.5 md:col-span-2"
                      />
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2.5"
                      >
                        <option value="Admissions">Admissions</option>
                        <option value="Fee & Scholarship">Fee & Scholarship</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Documents">Documents</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Describe student issue..."
                        className="h-8 flex-1 rounded border border-input bg-background px-2.5"
                      />
                      <button
                        type="submit"
                        className="rounded bg-[#405189] px-3 font-semibold text-white"
                      >
                        Create Ticket
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {tickets.map((t: any) => {
                      const msgs = ticketMessages.filter(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (m: any) => m.query_id === t.id
                      )
                      return (
                        <div
                          key={t.id}
                          className="rounded border border-border p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold">#{t.id} {t.subject}</span>
                              <span className="ml-2 rounded bg-muted px-2 py-0.5 text-[10px]">
                                {t.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-[#299cdb]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#299cdb]">
                                {t.status}
                              </span>
                              {t.status !== "closed" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    postAction(
                                      {
                                        action: "ticket_status",
                                        query_id: t.id,
                                        status: "closed",
                                      },
                                      "Ticket closed"
                                    )
                                  }
                                  className="rounded border border-border px-2 py-0.5 text-[11px] hover:bg-muted"
                                >
                                  Close Ticket
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5 rounded bg-muted/40 p-2.5">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {msgs.map((m: any) => (
                              <div key={m.id} className="text-xs">
                                <strong className="capitalize text-[#405189]">
                                  {m.sender_type}:
                                </strong>{" "}
                                {m.message}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={replyTextMap[t.id] || ""}
                              onChange={(e) =>
                                setReplyTextMap({
                                  ...replyTextMap,
                                  [t.id]: e.target.value,
                                })
                              }
                              placeholder="Write counsellor reply..."
                              className="h-8 flex-1 rounded border border-input bg-background px-2.5"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const msg = replyTextMap[t.id]
                                if (!msg?.trim()) return
                                postAction(
                                  {
                                    action: "reply_ticket",
                                    query_id: t.id,
                                    message: msg,
                                  },
                                  "Reply posted"
                                )
                                setReplyTextMap({ ...replyTextMap, [t.id]: "" })
                              }}
                              className="rounded bg-[#0ab39c] px-3 font-semibold text-white"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* TAB 8: CALL LOGS */}
              {activeTab === "calls" && (
                <div className="-m-4">
                  <DataTable
                     
                    columns={[
                      {
                        accessorKey: "phone",
                        header: "Phone",
                        cell: ({ row }) => (
                          <span className="font-medium">
                            {row.original.phone}
                          </span>
                        ),
                      },
                      {
                        accessorKey: "call_type",
                        header: "Direction",
                        cell: ({ row }) => (
                          <span className="uppercase">
                            {row.original.call_type}
                          </span>
                        ),
                      },
                      {
                        accessorFn: (cl) => Number(cl.duration || 0),
                        id: "duration",
                        header: "Duration",
                        cell: ({ row }) => `${row.original.duration}s`,
                      },
                      {
                        accessorKey: "status",
                        header: "Status",
                        cell: ({ row }) => (
                          <span className="rounded bg-[#0ab39c]/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-[#0ab39c]">
                            {row.original.status}
                          </span>
                        ),
                      },
                      {
                        accessorFn: (cl) => cl.created_at || "",
                        id: "created_at",
                        header: "Timestamp",
                        cell: ({ row }) => (
                          <span className="text-muted-foreground whitespace-nowrap">
                            {formatDateTime(row.original.created_at)}
                          </span>
                        ),
                      },
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ] as ColumnDef<any>[]}
                    data={callLogs}
                    searchPlaceholder="Search call logs..."
                    emptyMessage="No call logs recorded for this lead yet."
                  />
                </div>
              )}

              {/* TAB 9: CALENDAR PRO */}
              {activeTab === "calendar" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded bg-[#405189]/10 p-3">
                    <div>
                      <h5 className="font-semibold text-[#405189]">
                        Calendar Pro — Scheduled Counselling & Campus Visits
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        Next Follow-up: {formatDateTime(lead.next_followup_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEventDrawerOpen(true)}
                      className="rounded bg-[#405189] px-3 py-1.5 font-semibold text-white"
                    >
                      + Schedule Slot
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {events.map((ev: any) => (
                      <div
                        key={ev.id}
                        className="rounded border-l-4 border-[#0ab39c] bg-muted/40 p-3"
                      >
                        <div className="font-semibold">{ev.subject}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {formatDateTime(ev.start_at)} ({ev.event_type})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ==================== SHADCN DIALOGS & SHEETS ==================== */}

      {/* Add Note shadcn Dialog */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Add Counselling Note
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a counselling update on {lead.name}&apos;s profile.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter note..."
            className="text-xs"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNoteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction({ action: "add_note", note: noteText }, "Note added")
                setNoteText("")
                setNoteModalOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Stage shadcn Sheet */}
      <Sheet open={stageDrawerOpen} onOpenChange={setStageDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Change Lead Stage
            </SheetTitle>
            <SheetDescription className="text-xs">
              Update admission stage, sub-status, and next follow-up.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Lead Status</Label>
              <select
                value={stageForm.lead_status_id}
                onChange={(e) =>
                  setStageForm({
                    ...stageForm,
                    lead_status_id: e.target.value,
                    lead_sub_status_id: "",
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Status</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master.statuses.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Sub-Status</Label>
              <select
                value={stageForm.lead_sub_status_id}
                onChange={(e) =>
                  setStageForm({
                    ...stageForm,
                    lead_sub_status_id: e.target.value,
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Sub-Status</option>
                {master.subStatuses
                  .filter(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (ss: any) =>
                      String(ss.lead_status_id) ===
                      String(stageForm.lead_status_id)
                  )
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((ss: any) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Next Followup</Label>
              <Input
                type="datetime-local"
                value={stageForm.followup_date}
                onChange={(e) =>
                  setStageForm({ ...stageForm, followup_date: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Stage Remark</Label>
              <Textarea
                rows={3}
                value={stageForm.note}
                onChange={(e) =>
                  setStageForm({ ...stageForm, note: e.target.value })
                }
                className="text-xs"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStageDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  { action: "change_stage", ...stageForm },
                  "Lead stage updated!"
                )
                setStageDrawerOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Stage
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Communicate shadcn Sheet */}
      <Sheet open={commDrawerOpen} onOpenChange={setCommDrawerOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-lg flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Communicate with {lead.name}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send outbound Email, SMS, or WhatsApp directly to {lead.mobile}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <Tabs
              value={commForm.channel}
              onValueChange={(ch) => setCommForm({ ...commForm, channel: ch })}
            >
              <TabsList className="h-8">
                {["email", "sms", "whatsapp"].map((ch) => (
                  <TabsTrigger key={ch} value={ch} className="text-xs uppercase">
                    {ch}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {commForm.channel === "email" && (
              <Input
                value={commForm.subject}
                onChange={(e) =>
                  setCommForm({ ...commForm, subject: e.target.value })
                }
                placeholder="Email Subject"
                className="h-9 text-xs"
              />
            )}
            <Textarea
              rows={6}
              value={commForm.message}
              onChange={(e) =>
                setCommForm({ ...commForm, message: e.target.value })
              }
              placeholder={`Type ${commForm.channel.toUpperCase()} message...`}
              className="text-xs"
            />
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  { action: "communicate", ...commForm },
                  `${commForm.channel.toUpperCase()} sent!`
                )
                setCommDrawerOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Send Message
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Event shadcn Sheet */}
      <Sheet open={eventDrawerOpen} onOpenChange={setEventDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Add Follow-up Event
            </SheetTitle>
            <SheetDescription className="text-xs">
              Schedule a call, video meeting, or campus visit.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <Input
              value={eventForm.subject}
              onChange={(e) =>
                setEventForm({ ...eventForm, subject: e.target.value })
              }
              placeholder="Event Subject"
              className="h-9 text-xs"
            />
            <select
              value={eventForm.event_type}
              onChange={(e) =>
                setEventForm({ ...eventForm, event_type: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="phone_call">Phone Call</option>
              <option value="video_call">Video Call</option>
              <option value="meeting">Campus Meeting</option>
            </select>
            <Input
              type="datetime-local"
              value={eventForm.start_at}
              onChange={(e) =>
                setEventForm({ ...eventForm, start_at: e.target.value })
              }
              className="h-9 text-xs"
            />
            <Textarea
              rows={3}
              value={eventForm.description}
              onChange={(e) =>
                setEventForm({ ...eventForm, description: e.target.value })
              }
              placeholder="Agenda..."
              className="text-xs"
            />
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  { action: "add_event", ...eventForm },
                  "Follow-up scheduled!"
                )
                setEventDrawerOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Event
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* WhatsApp History Chat shadcn Sheet */}
      <Sheet open={waDrawerOpen} onOpenChange={setWaDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0 text-xs">
          <SheetHeader className="bg-[#0ab39c] px-4 py-3.5 text-white">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold text-white">
              <i className="ri-whatsapp-line text-lg" />
              <span>{lead.name}</span>
            </SheetTitle>
            <SheetDescription className="text-[11px] text-white/85">
              WhatsApp History • {lead.mobile}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-emerald-950/5 p-4">
            {whatsappMessages.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No WhatsApp messages yet. Send the first message below!
              </p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              whatsappMessages.map((m: any) => (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-lg bg-[#0ab39c]/15 p-2.5"
                >
                  <p>{m.message || m.content}</p>
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">
                    {formatDateTime(m.created_at)} ✓✓
                  </div>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!waQuickMsg.trim()) return
              postAction(
                {
                  action: "communicate",
                  channel: "whatsapp",
                  message: waQuickMsg,
                },
                "WhatsApp message sent!"
              )
              setWaQuickMsg("")
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <Input
              value={waQuickMsg}
              onChange={(e) => setWaQuickMsg(e.target.value)}
              placeholder="Type WhatsApp message..."
              className="h-9 flex-1 text-xs"
            />
            <Button
              type="submit"
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Send
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Application Payment + Coupon Validation shadcn Dialog */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Application Fee & Coupon Redemption
            </DialogTitle>
            <DialogDescription className="text-xs">
              Validate scholarship coupons and record student application payment.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between">
              <span>Application Form:</span>
              <strong>{appFormObj?.title || "Standard Admission Form"}</strong>
            </div>
            <div className="flex justify-between">
              <span>Base Application Fee:</span>
              <strong>₹{baseAppFee}</strong>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#0ab39c]">
                <span>Coupon Discount ({couponCode.toUpperCase()}):</span>
                <strong>- ₹{couponDiscount}</strong>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold">
              <span>Net Payable:</span>
              <span className="text-[#405189]">₹{netPayable}</span>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs">
              Have a Coupon? (Try `EARLY2026`, `MERIT25`, `FREEAPP`)
            </Label>
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="h-9 flex-1 text-xs uppercase"
              />
              <Button
                type="button"
                onClick={async () => {
                  const res = await postAction({
                    action: "validate_coupon",
                    code: couponCode,
                    amount: baseAppFee,
                  })
                  if (res?.valid) {
                    setCouponDiscount(res.discount)
                    toast.success(`Coupon applied! Saved ₹${res.discount}`)
                  }
                }}
                className="bg-[#299cdb] text-white hover:bg-[#2389c2]"
              >
                Apply
              </Button>
            </div>
            {coupons?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {coupons.map((cp: any) => (
                  <Badge
                    key={cp.id}
                    variant="outline"
                    onClick={() => setCouponCode(cp.code)}
                    className="cursor-pointer border-dashed border-[#0ab39c] text-[10px] font-semibold text-[#0ab39c]"
                  >
                    {cp.code}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs">Payment Mode</Label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="online">Online Gateway</option>
                <option value="offline">Offline Bank</option>
                <option value="cash">Campus Cash</option>
                <option value="dd">Demand Draft</option>
                <option value="free">100% Waiver (Free)</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Transaction Ref</Label>
              <Input
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="UTR / Receipt #"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  {
                    action: "mark_payment_done",
                    form_id: appFormObj?.id || 1,
                    payment_method: netPayable === 0 ? "free" : paymentMethod,
                    amount: netPayable,
                    coupon_code: couponDiscount > 0 ? couponCode : "",
                    discount_amount: couponDiscount,
                    transaction_id: txnId,
                  },
                  `Payment of ₹${netPayable} recorded!`
                )
                setPaymentModalOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Mark Payment Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Counsellor shadcn Dialog */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="sm:max-w-sm text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Re-assign Counsellor
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select a counsellor to assign ownership of {lead.name}.
            </DialogDescription>
          </DialogHeader>
          <select
            value={reassignUserId}
            onChange={(e) => setReassignUserId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Select User</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {master.users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReassignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  { action: "reassign", reassign_to: reassignUserId },
                  "Lead re-assigned!"
                )
                setReassignOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document shadcn Dialog */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="sm:max-w-sm text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Upload Student Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Upload academic marksheets or identity proof for verification.
            </DialogDescription>
          </DialogHeader>
          <select
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="10th Marksheet">10th Marksheet</option>
            <option value="12th Marksheet">12th Marksheet</option>
            <option value="Graduation Degree">Graduation Degree</option>
            <option value="Entrance Scorecard">Entrance Scorecard</option>
            <option value="Aadhaar / ID Proof">Aadhaar / ID Proof</option>
          </select>
          <Input type="file" className="text-xs" />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDocModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                postAction(
                  { action: "upload_doc", title: docTitle },
                  `${docTitle} uploaded for verification!`
                )
                setDocModalOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
