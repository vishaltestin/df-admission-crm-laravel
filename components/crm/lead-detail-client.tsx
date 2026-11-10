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
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { FormSelect } from "@/components/ui/form-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

/* eslint-disable @typescript-eslint/no-explicit-any */
interface LeadDetailProps {
  leadId: string
  master: {
    countries?: any[]
    states: any[]
    cities: any[]
    institutes: any[]
    programs: any[]
    courses: any[]
    sources: any[]
    leadTypes?: any[]
    campaigns?: any[]
    events?: any[]
    statuses: any[]
    subStatuses: any[]
    pipelines: any[]
    applicationForms: any[]
    emailTemplates?: any[]
    smsTemplates?: any[]
    whatsappTemplates?: any[]
    users: any[]
  }
  userEmail?: string
  userName?: string
}

export function LeadDetailClient({
  leadId,
  master,
  userEmail = "admin@dfcrm.com",
  userName = "Counsellor",
}: LeadDetailProps) {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [data, setData] = React.useState<any>(null)
  const [initialLoading, setInitialLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<
    | "details"
    | "timeline"
    | "notes"
    | "comms"
    | "events"
    | "docs"
    | "tickets"
    | "calls"
    | "calendar"
  >("details")
  const [editingDetails, setEditingDetails] = React.useState(false)

  // Modals & Sheets
  const [noteOpen, setNoteOpen] = React.useState(false)
  const [noteText, setNoteText] = React.useState("")
  const [viewNoteItem, setViewNoteItem] = React.useState<any>(null)
  const [viewCommItem, setViewCommItem] = React.useState<any>(null)

  const [stageOpen, setStageOpen] = React.useState(false)
  const [stageForm, setStageForm] = React.useState({
    lead_status_id: "",
    lead_sub_status_id: "",
    stage_id: "",
    followup_date: "",
    stage_note: "",
  })

  // Inline Left-Card Edit Drawers (matching df-laravel-crm editPipelineCanvas & editSourceCanvas)
  const [editPipelineOpen, setEditPipelineOpen] = React.useState(false)
  const [selectedPipelineId, setSelectedPipelineId] = React.useState("")
  const [editSourceOpen, setEditSourceOpen] = React.useState(false)
  const [selectedSourceId, setSelectedSourceId] = React.useState("")
  const [assignFormModalOpen, setAssignFormModalOpen] = React.useState(false)
  const [selectedAppFormId, setSelectedAppFormId] = React.useState("")

  // Unified Communicate Sidebar (100% identical to All Leads)
  const [commOpen, setCommOpen] = React.useState(false)
  const [commTab, setCommTab] = React.useState<"email" | "sms" | "whatsapp">(
    "email"
  )
  const [commTemplateId, setCommTemplateId] = React.useState("")
  const [commFromEmail, setCommFromEmail] = React.useState(userEmail)
  const [commSubject, setCommSubject] = React.useState("")
  const [commMessage, setCommMessage] = React.useState("")

  const [eventOpen, setEventOpen] = React.useState(false)
  const [eventForm, setEventForm] = React.useState({
    subject: "Follow up",
    event_type: "phone_call",
    start_at: "",
    end_at: "",
    owner_id: "",
    organiser: userName,
    description: "",
  })

  // Re-assign Lead Modal (with Add Owner | Remove & Add)
  const [reassignOpen, setReassignOpen] = React.useState(false)
  const [reassignUserId, setReassignUserId] = React.useState("")
  const [reassignType, setReassignType] = React.useState<
    "add_owner" | "remove_and_add"
  >("add_owner")

  // Take Payment Console Modal
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false)
  const [paymentMethod, setPaymentMethod] = React.useState("Online / Razorpay")
  const [finalAmountInput, setFinalAmountInput] = React.useState("")
  const [couponCode, setCouponCode] = React.useState("")
  const [appliedCoupon, setAppliedCoupon] = React.useState<any>(null)

  // WhatsApp Chat History Drawer
  const [waChatOpen, setWaChatOpen] = React.useState(false)
  const [waQuickText, setWaQuickText] = React.useState("")

  // Calendar Pro state
  const [calMonthOffset, setCalMonthOffset] = React.useState(0)

  // DocVerify upload modal
  const [docModalOpen, setDocModalOpen] = React.useState(false)
  const [docTitle, setDocTitle] = React.useState("")
  const [docType, setDocType] = React.useState("Academic Marksheet")

  // Ticket create & reply state
  const [ticketModalOpen, setTicketModalOpen] = React.useState(false)
  const [ticketSubject, setTicketSubject] = React.useState("")
  const [ticketDesc, setTicketDesc] = React.useState("")
  const [replyTicketId, setReplyTicketId] = React.useState<number | null>(null)
  const [replyText, setReplyText] = React.useState("")

  // Full Editable Lead Profile form
  const [editForm, setEditForm] = React.useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    country: "",
    state: "",
    city: "",
    institute_id: "",
    programme_id: "",
    faculty_id: "",
    lead_source_id: "",
    type_id: "",
    lead_campaign_id: "",
    application_form_id: "",
  })

  const fetchDetail = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setInitialLoading(true)
      } else {
        setIsRefreshing(true)
      }
      try {
        const res = await fetch(`/api/leads/${leadId}`)
        if (res.ok) {
          const d = await res.json()
          setData(d)
          if (d.lead) {
            setEditForm({
              name: d.lead.name || "",
              mobile: d.lead.mobile || "",
              alternate_mobile: d.lead.alternate_mobile || "",
              email: d.lead.email || "",
              country: d.lead.country ? String(d.lead.country) : "",
              state: d.lead.state ? String(d.lead.state) : "",
              city: d.lead.city ? String(d.lead.city) : "",
              institute_id: d.lead.institute_id
                ? String(d.lead.institute_id)
                : "",
              programme_id: d.lead.programme_id
                ? String(d.lead.programme_id)
                : "",
              faculty_id: d.lead.faculty_id ? String(d.lead.faculty_id) : "",
              lead_source_id: d.lead.lead_source_id
                ? String(d.lead.lead_source_id)
                : "",
              type_id: d.lead.type_id ? String(d.lead.type_id) : "",
              lead_campaign_id: d.lead.lead_campaign_id
                ? String(d.lead.lead_campaign_id)
                : "",
              application_form_id: d.lead.application_form_id
                ? String(d.lead.application_form_id)
                : "",
            })
            setStageForm((prev) => ({
              ...prev,
              lead_status_id: d.lead.lead_status_id
                ? String(d.lead.lead_status_id)
                : "",
              lead_sub_status_id: d.lead.lead_sub_status_id
                ? String(d.lead.lead_sub_status_id)
                : "",
              stage_id: d.lead.stage_id ? String(d.lead.stage_id) : "",
            }))
            setSelectedPipelineId(
              d.lead.pipeline_id ? String(d.lead.pipeline_id) : ""
            )
            setSelectedSourceId(
              d.lead.lead_source_id ? String(d.lead.lead_source_id) : ""
            )
            setSelectedAppFormId(
              d.lead.application_form_id
                ? String(d.lead.application_form_id)
                : ""
            )
            setReassignUserId(
              d.lead.lead_assign_to ? String(d.lead.lead_assign_to) : ""
            )
          }
        }
      } finally {
        setInitialLoading(false)
        setIsRefreshing(false)
      }
    },
    [leadId]
  )

  React.useEffect(() => {
    fetchDetail(false)
  }, [fetchDetail])

  async function postAction(
    payload: Record<string, unknown>,
    successMsg?: string
  ) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (res.ok) {
      if (successMsg) toast.success(successMsg)
      // Silent background refresh — NEVER blanks or unmounts the screen
      await fetchDetail(true)
      return result
    } else {
      toast.error(result.error || "Action failed")
      return null
    }
  }

  // Initial load skeleton (only shown before `data` has loaded the first time)
  if (initialLoading && !data) {
    return (
      <div className="space-y-4">
        <Card className="gap-2 p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex gap-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 flex-1 rounded" />
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-4">
            <Card className="items-center gap-3 p-4 shadow-xs">
              <Skeleton className="size-16 rounded-full" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
              <div className="grid w-full grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
              </div>
              <Skeleton className="h-9 w-full rounded" />
            </Card>

            <Card className="gap-2.5 p-4 shadow-xs">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </Card>

            <Card className="gap-2.5 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-36 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-8 w-full rounded" />
            </Card>
          </div>

          <div className="space-y-4 xl:col-span-8">
            <Card className="flex-row flex-wrap gap-2 p-3 shadow-xs">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded" />
              ))}
            </Card>
            <Card className="gap-4 p-4 shadow-xs">
              <div className="flex gap-2 border-b border-border pb-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded" />
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="col-span-2 h-4 w-full" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.lead) {
    return (
      <Card className="p-8 text-center shadow-xs">
        <h3 className="text-sm font-semibold">Lead Not Found</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          This lead record does not exist or belongs to another organization.
        </p>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/leads">Back to All Leads</Link>
          </Button>
        </div>
      </Card>
    )
  }

  const lead = data.lead
  const organization = data.organization
  const stages: any[] = data.stages || []
  const notes: any[] = data.notes || []
  const events: any[] = data.events || []
  const commLogs: any[] = data.commLogs || []
  const activities: any[] = data.activities || []
  const documents: any[] = data.documents || []
  const appResponses: any[] = data.appResponses || []
  const leadApplication = data.application
  const verification = data.verification
  const tickets: any[] = data.tickets || []
  const ticketMessages: any[] = data.ticketMessages || []
  const callLogs: any[] = data.callLogs || []

  // Resolve master lookup names (supports numeric ID or stored string name)
  const resolveGeoName = (val: unknown, list: any[] = []) => {
    if (!val) return "-"
    const str = String(val)
    const byId = list.find((item) => String(item.id) === str)
    if (byId) return byId.name
    return str
  }

  const countryName = resolveGeoName(lead.country, master.countries || [])
  const stateName = resolveGeoName(lead.state, master.states || [])
  const cityName = resolveGeoName(lead.city, master.cities || [])

  const statusObj = master.statuses.find(
    (s) => Number(s.id) === Number(lead.lead_status_id)
  )
  const subStatusObj = master.subStatuses.find(
    (s) => Number(s.id) === Number(lead.lead_sub_status_id)
  )
  const instituteObj = master.institutes.find(
    (i) => Number(i.id) === Number(lead.institute_id)
  )
  const programObj = master.programs.find(
    (p) => Number(p.id) === Number(lead.programme_id)
  )
  const courseObj = master.courses.find(
    (c) => Number(c.id) === Number(lead.faculty_id)
  )
  const sourceObj = master.sources.find(
    (s) => Number(s.id) === Number(lead.lead_source_id)
  )
  const leadTypeObj = (master.leadTypes || []).find(
    (t) => Number(t.id) === Number(lead.type_id)
  )
  const campaignObj = (master.campaigns || []).find(
    (c) => Number(c.id) === Number(lead.lead_campaign_id)
  )
  const pipelineObj = master.pipelines.find(
    (p) => Number(p.id) === Number(lead.pipeline_id)
  )
  const currentStageObj = stages.find(
    (s) => Number(s.id) === Number(lead.stage_id)
  )
  const assignedUser =
    data.assignedUser ||
    master.users.find((u) => Number(u.id) === Number(lead.lead_assign_to))
  const appFormObj =
    data.applicationForm ||
    master.applicationForms.find(
      (f) => Number(f.id) === Number(lead.application_form_id)
    ) ||
    master.applicationForms[0]

  // Application form response & payment state
  const latestResp = appResponses[0]
  const fillPct = Number(latestResp?.fill_percentage || 0)
  const currentStep = Number(latestResp?.current_step || 0)
  const formFees = Number(appFormObj?.fees || 1000)
  const baseFee = Number(latestResp?.total_fee || formFees)
  const discountVal = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round((baseFee * Number(appliedCoupon.discount_value || 0)) / 100)
      : Number(appliedCoupon.discount_value || 0)
    : Number(latestResp?.discount_total || 0)
  const netPayable = Math.max(0, baseFee - discountVal)
  const isPaid =
    latestResp?.payment_status === "paid" ||
    leadApplication?.payment_status === "paid"
  const currentPaidAmount = isPaid
    ? Number(latestResp?.final_amount || netPayable)
    : 0
  const appScore = Number(
    leadApplication?.application_score ??
      (isPaid ? 100 : fillPct > 0 ? fillPct : 0)
  )
  const applicationPortalHref = appFormObj
    ? `/application_form_show/${appFormObj.unique_code}/${lead.id}`
    : null

  // Parse any custom/extra WebForm attributes or application response fields
  const extraEntries: Array<[string, string]> = []
  if (lead.extra_fields_json) {
    try {
      const parsed =
        typeof lead.extra_fields_json === "string"
          ? JSON.parse(lead.extra_fields_json)
          : lead.extra_fields_json
      if (parsed && typeof parsed === "object") {
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== null && v !== undefined && String(v).trim() !== "") {
            extraEntries.push([k, String(v)])
          }
        }
      }
    } catch {
      // ignore invalid json
    }
  }

  // Status Logs (filtered stage/status/reassignment timeline entries)
  const statusLogs = activities.filter((a) =>
    [
      "stage_changed",
      "pipeline_stage_changed",
      "pipeline_updated",
      "source_updated",
      "lead_reassigned",
      "bulk_reassigned",
      "lead_created",
      "payment_completed",
    ].includes(String(a.action || ""))
  )

  // Cascading lists for Edit Lead Details
  const statesByCountry = editForm.country
    ? master.states.filter(
        (s) =>
          String(s.country_id) === editForm.country ||
          String(s.name).toLowerCase() === editForm.country.toLowerCase()
      )
    : []
  const filteredEditStates =
    statesByCountry.length > 0 ? statesByCountry : master.states

  const stateMatchForCity = editForm.state
    ? master.states.find(
        (s) =>
          String(s.id) === editForm.state ||
          String(s.name).toLowerCase() === editForm.state.toLowerCase()
      )
    : null
  const filteredEditCities = stateMatchForCity
    ? master.cities.filter(
        (c) => Number(c.state_id) === Number(stateMatchForCity.id)
      )
    : master.cities.slice(0, 200)

  // Calendar Pro Month Computation
  const calDate = new Date()
  calDate.setMonth(calDate.getMonth() + calMonthOffset)
  const calYear = calDate.getFullYear()
  const calMonth = calDate.getMonth()
  const firstDayIdx = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const monthLabel = calDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div
      className={`space-y-4 transition-opacity ${
        isRefreshing ? "opacity-95" : "opacity-100"
      }`}
    >
      {/* ==================== TOP PIPELINE STAGE PROGRESSION STEPPER ==================== */}
      <Card className="gap-0 p-3 shadow-xs">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-base font-bold">{lead.name}</span>
            <Badge className="border-0 bg-[#405189]/10 text-[#405189]">
              {pipelineObj?.name || "Admissions Pipeline"}
            </Badge>
            <span className="text-muted-foreground">Lead ID #{lead.id}</span>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <i className="ri-loader-4-line animate-spin" /> Syncing...
              </span>
            )}
          </div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#405189] hover:underline"
          >
            <i className="ri-arrow-left-line" /> Back to All Leads
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stages.map((st, idx) => {
            const isCurrent = Number(lead.stage_id) === Number(st.id)
            return (
              <Button
                key={st.id}
                type="button"
                size="sm"
                variant={isCurrent ? "default" : "outline"}
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
                className={`min-w-[110px] flex-1 text-xs font-semibold ${
                  isCurrent
                    ? "bg-[#0ab39c] text-white hover:bg-[#099885]"
                    : "bg-muted/50 text-muted-foreground hover:border-[#405189] hover:text-[#405189]"
                }`}
              >
                {idx + 1}. {st.name}
              </Button>
            )
          })}
        </div>
      </Card>

      {/* ==================== 2-COLUMN 360° WORKSPACE ==================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ==================== LEFT SIDEBAR (ALL 5 DF-LARAVEL-CRM CARDS) ==================== */}
        <div className="space-y-4 xl:col-span-4">
          {/* CARD 1: LEAD SUMMARY CARD */}
          <Card className="gap-3 p-4 shadow-xs">
            <div className="flex flex-col items-center text-center">
              <Avatar className="mb-2 size-16">
                <AvatarFallback className="bg-[#405189]/10 text-xl font-bold text-[#405189]">
                  {(lead.name || "S").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-sm font-bold">{lead.name}</h3>
              <p className="text-xs text-muted-foreground">
                {currentStageObj?.name || pipelineObj?.name || "Fresh Inquiry"}
              </p>

              {/* Status & Sub Status with inline Pencil Edit triggers */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-semibold text-muted-foreground">
                    Status:
                  </span>
                  <Badge className="border-0 bg-[#405189]/10 text-[#405189]">
                    {statusObj?.name || "New"}
                  </Badge>
                  <button
                    type="button"
                    title="Change Status"
                    onClick={() => setStageOpen(true)}
                    className="text-[#405189] hover:text-[#364574]"
                  >
                    <i className="ri-pencil-fill text-xs" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-semibold text-muted-foreground">
                    Sub Status:
                  </span>
                  <span className="font-medium">
                    {subStatusObj?.name || "-"}
                  </span>
                  <button
                    type="button"
                    title="Change Sub Status"
                    onClick={() => setStageOpen(true)}
                    className="text-[#405189] hover:text-[#364574]"
                  >
                    <i className="ri-pencil-fill text-xs" />
                  </button>
                </div>
              </div>

              {/* Quick Icon Action Row (Email, Call, Add Note, Timeline) */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <a
                  href={lead.email ? `mailto:${lead.email}` : "#"}
                  onClick={(e) => {
                    if (!lead.email) {
                      e.preventDefault()
                      setCommTab("email")
                      setCommOpen(true)
                    }
                  }}
                  title="Send Email"
                  className="flex size-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 transition-colors hover:bg-blue-500 hover:text-white"
                >
                  <i className="ri-mail-line text-sm" />
                </a>
                <a
                  href={`tel:${lead.mobile}`}
                  title="Call Mobile"
                  className="flex size-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
                >
                  <i className="ri-phone-line text-sm" />
                </a>
                <button
                  type="button"
                  title="Add Note"
                  onClick={() => setNoteOpen(true)}
                  className="flex size-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 transition-colors hover:bg-amber-500 hover:text-white"
                >
                  <i className="ri-sticky-note-line text-sm" />
                </button>
                <button
                  type="button"
                  title="View Timeline"
                  onClick={() => setActiveTab("timeline")}
                  className="flex size-8 items-center justify-center rounded-md bg-[#405189]/10 text-[#405189] transition-colors hover:bg-[#405189] hover:text-white"
                >
                  <i className="ri-time-line text-sm" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
              <div className="rounded bg-muted/50 p-2">
                <div className="text-sm font-bold text-[#405189]">
                  {lead.lead_score ?? 45}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Lead Score
                </div>
              </div>
              <div className="rounded bg-muted/50 p-2">
                <div className="text-sm font-bold text-[#0ab39c]">
                  {lead.lead_weight_count ?? 1}
                </div>
                <div className="text-[10px] text-muted-foreground">Weight</div>
              </div>
              <div className="rounded bg-muted/50 p-2">
                <div className="text-sm font-bold text-[#f7b84b]">
                  {lead.mobile_verified || verification?.mobile_verified
                    ? "Verified"
                    : "Pending"}
                </div>
                <div className="text-[10px] text-muted-foreground">OTP</div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() =>
                postAction(
                  { action: "call_now" },
                  `Dialling ${lead.mobile} via Cloud Telephony...`
                )
              }
              className="w-full bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <i className="ri-phone-fill" /> Call Now ({lead.mobile})
            </Button>
          </Card>

          {/* CARD 2: LEAD DETAILS CARD (WITH INLINE PIPELINE & SOURCE PENCIL EDIT) */}
          <Card className="gap-2.5 p-4 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-semibold">Lead Details</h4>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("details")
                  setEditingDetails(true)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#405189] hover:underline"
              >
                <i className="ri-edit-line" /> Edit
              </button>
            </div>

            <div className="space-y-2">
              {[
                ["Name", lead.name || "-"],
                ["Mobile", lead.mobile || "-"],
                ["Alternate Mobile", lead.alternate_mobile || "-"],
                ["Email", lead.email || "-"],
                ["City", cityName],
                ["State", stateName],
                ["Country", countryName],
                ["Institute", instituteObj?.name || "-"],
                ["Programme", programObj?.name || "-"],
                ["Course", courseObj?.name || "-"],
                ["Lead Medium", leadTypeObj?.name || "-"],
                ["Campaign", campaignObj?.name || "-"],
                ["Created", formatDateShort(lead.created_at)],
                [
                  "Next Followup",
                  lead.next_followup_at
                    ? formatDateTime(lead.next_followup_at)
                    : "Not Scheduled",
                ],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] truncate text-right font-medium">
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border pt-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">Pipeline: </span>
                  <span className="font-semibold">
                    {pipelineObj?.name || "Admissions Pipeline"}
                  </span>
                </div>
                <button
                  type="button"
                  title="Edit Pipeline"
                  onClick={() => {
                    setSelectedPipelineId(
                      lead.pipeline_id ? String(lead.pipeline_id) : ""
                    )
                    setEditPipelineOpen(true)
                  }}
                  className="rounded p-1 text-[#405189] hover:bg-muted"
                >
                  <i className="ri-pencil-fill" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">Source: </span>
                  <span className="font-semibold">
                    {sourceObj?.name || "Direct"}
                  </span>
                </div>
                <button
                  type="button"
                  title="Edit Source"
                  onClick={() => {
                    setSelectedSourceId(
                      lead.lead_source_id ? String(lead.lead_source_id) : ""
                    )
                    setEditSourceOpen(true)
                  }}
                  className="rounded p-1 text-[#405189] hover:bg-muted"
                >
                  <i className="ri-pencil-fill" />
                </button>
              </div>
            </div>
          </Card>

          {/* CARD 3: ORGANIZATION CARD (RESTORED FROM leads_show.blade.php) */}
          <Card className="gap-2 p-4 text-xs shadow-xs">
            <h4 className="border-b border-border pb-2 font-semibold">
              Organization
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {organization?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Mobile</span>
                <span className="font-medium">
                  {organization?.mobile || "-"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate font-medium">
                  {organization?.email || "-"}
                </span>
              </div>
            </div>
          </Card>

          {/* CARD 4: APPLICATION CARD (WITH FILL APPLICATION FORM + ASSIGN FORM + TAKE PAYMENT) */}
          <Card className="gap-3 p-4 text-xs shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold">Application</h4>
                <button
                  type="button"
                  title="Assign / Change Application Form"
                  onClick={() => {
                    setSelectedAppFormId(
                      lead.application_form_id
                        ? String(lead.application_form_id)
                        : appFormObj?.id
                          ? String(appFormObj.id)
                          : ""
                    )
                    setAssignFormModalOpen(true)
                  }}
                  className="rounded p-0.5 text-[#405189] hover:bg-muted"
                >
                  <i className="ri-pencil-fill text-xs" />
                </button>
              </div>

              {applicationPortalHref ? (
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    size="xs"
                    className="bg-[#405189] text-[11px] font-semibold text-white hover:bg-[#364574]"
                  >
                    <a
                      href={applicationPortalHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <i className="ri-external-link-line" /> Fill Application
                      Form
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    title="Copy Application Form Link"
                    onClick={() => {
                      const url = `${window.location.origin}${applicationPortalHref}`
                      navigator.clipboard?.writeText(url)
                      toast.success("Application Portal link copied!")
                    }}
                  >
                    <i className="ri-file-copy-line text-xs" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setAssignFormModalOpen(true)}
                >
                  Assign Form
                </Button>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Current Step: <strong>Step {currentStep}</strong>
                </span>
                <span className="font-semibold text-[#0ab39c]">
                  {fillPct}% Form Completed
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#0ab39c] transition-all"
                  style={{ width: `${Math.min(100, fillPct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Form</span>
                <span className="max-w-[60%] truncate text-right font-medium">
                  {appFormObj?.title || "Not Assigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees</span>
                <span className="font-semibold">
                  ₹{formFees.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-semibold text-[#0ab39c]">
                  ₹{netPayable.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  className={`border-0 ${
                    isPaid
                      ? "bg-[#0ab39c]/15 text-[#0ab39c]"
                      : latestResp
                        ? "bg-[#f7b84b]/20 text-amber-700"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPaid ? "PAID" : latestResp ? "PENDING" : "NOT APPLIED"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Programme</span>
                <span className="font-medium">{programObj?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course / PG</span>
                <span className="font-medium">{courseObj?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score</span>
                <span className="font-semibold">{appScore}%</span>
              </div>
            </div>

            {!isPaid && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setFinalAmountInput(String(netPayable))
                  setPaymentModalOpen(true)
                }}
                className="w-full bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                <i className="ri-bank-card-line" /> Take Payment
              </Button>
            )}
          </Card>

          {/* CARD 5: ASSIGNED USER CARD */}
          <Card className="gap-2.5 p-4 text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-semibold">Assigned User</h4>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setReassignUserId(
                    lead.lead_assign_to ? String(lead.lead_assign_to) : ""
                  )
                  setReassignType("add_owner")
                  setReassignOpen(true)
                }}
                className="border-amber-300 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400"
              >
                <i className="ri-user-shared-line" /> Re-assign
              </Button>
            </div>

            {assignedUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-[#405189]/10 text-xs font-bold text-[#405189]">
                      {(assignedUser.first_name || "U").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {assignedUser.first_name} {assignedUser.last_name}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {assignedUser.email}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 text-[11px]">
                  <span className="text-muted-foreground">Mobile</span>
                  <span className="font-medium">
                    {assignedUser.mobile || "-"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-amber-600">
                Unassigned — click Re-assign to allocate a counsellor.
              </p>
            )}
          </Card>
        </div>

        {/* ==================== RIGHT MAIN WORKSPACE ==================== */}
        <div className="space-y-4 xl:col-span-8">
          {/* Quick Action Buttons Bar */}
          <Card className="flex-row flex-wrap items-center gap-2 p-3 shadow-xs">
            <Button
              type="button"
              size="sm"
              onClick={() => setNoteOpen(true)}
              className="bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
            >
              <i className="ri-sticky-note-line" /> Add Note
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setStageOpen(true)}
              className="bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <i className="ri-exchange-line" /> Change Stage
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCommTemplateId("")
                setCommFromEmail(userEmail)
                setCommOpen(true)
              }}
              className="bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2385ba]"
            >
              <i className="ri-mail-send-line" /> Communicate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setEventOpen(true)}
              className="bg-[#f7b84b] text-xs font-semibold text-slate-900 hover:bg-[#e0a642]"
            >
              <i className="ri-calendar-event-line" /> Add Event
            </Button>
            {applicationPortalHref && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-[#405189]/40 text-xs font-semibold text-[#405189]"
              >
                <a
                  href={applicationPortalHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <i className="ri-file-list-3-line" /> Fill Application Form
                </a>
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setWaChatOpen(true)}
              className="ml-auto border-[#0ab39c]/40 text-xs font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/10"
            >
              <i className="ri-whatsapp-line" /> WhatsApp History
            </Button>
          </Card>

          {/* Main 9-Tab Card */}
          <Card className="gap-0 overflow-hidden p-0 shadow-xs">
            <div className="border-b border-border px-3 py-2">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              >
                <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                  {[
                    { key: "details", label: "Lead Details", icon: "ri-user-3-line" },
                    {
                      key: "timeline",
                      label: `Timeline (${activities.length})`,
                      icon: "ri-history-line",
                    },
                    {
                      key: "notes",
                      label: `Notes (${notes.length})`,
                      icon: "ri-sticky-note-line",
                    },
                    {
                      key: "comms",
                      label: `Communication (${commLogs.length})`,
                      icon: "ri-mail-line",
                    },
                    {
                      key: "events",
                      label: `Events (${events.length})`,
                      icon: "ri-calendar-line",
                    },
                    {
                      key: "docs",
                      label: `DocVerify (${documents.length})`,
                      icon: "ri-folder-shield-2-line",
                    },
                    {
                      key: "tickets",
                      label: `Tickets (${tickets.length})`,
                      icon: "ri-customer-service-2-line",
                    },
                    {
                      key: "calls",
                      label: `Call Logs (${callLogs.length})`,
                      icon: "ri-phone-line",
                    },
                    {
                      key: "calendar",
                      label: "Calendar Pro",
                      icon: "ri-calendar-todo-line",
                    },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.key}
                      value={t.key}
                      className="px-2.5 py-1.5 text-xs data-[state=active]:bg-[#405189]/10 data-[state=active]:text-[#405189]"
                    >
                      <i className={`${t.icon} mr-1`} />
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="p-4 text-xs">
              {/* ==================== TAB 1: FULL LEAD DETAILS (READ-ONLY + EDIT MODE) ==================== */}
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div>
                      <h4 className="text-sm font-semibold">
                        Complete Lead Information
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Full student inquiry profile, academic preferences, attribution &amp; WebForm fields.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={editingDetails ? "outline" : "default"}
                      onClick={() => setEditingDetails((v) => !v)}
                      className={
                        editingDetails
                          ? "text-xs"
                          : "bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
                      }
                    >
                      <i
                        className={
                          editingDetails ? "ri-eye-line" : "ri-edit-box-line"
                        }
                      />{" "}
                      {editingDetails ? "View Profile" : "Edit Lead Details"}
                    </Button>
                  </div>

                  {!editingDetails ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                        {[
                          [
                            "Form Interested In",
                            appFormObj?.title || "Not Assigned",
                          ],
                          ["Full Name", lead.name || "-"],
                          ["Email Address", lead.email || "-"],
                          ["Mobile Number", lead.mobile || "-"],
                          ["Alternate Mobile", lead.alternate_mobile || "-"],
                          ["Country", countryName],
                          ["State", stateName],
                          ["City", cityName],
                          ["Institute", instituteObj?.name || "-"],
                          ["Programme", programObj?.name || "-"],
                          ["Course / Specialization", courseObj?.name || "-"],
                          [
                            "Pipeline",
                            pipelineObj?.name || "Admissions Pipeline",
                          ],
                          ["Current Stage", currentStageObj?.name || "-"],
                          ["Lead Status", statusObj?.name || "New"],
                          ["Lead Sub-Status", subStatusObj?.name || "-"],
                          ["Lead Source", sourceObj?.name || "Direct"],
                          ["Lead Medium / Type", leadTypeObj?.name || "-"],
                          ["Campaign", campaignObj?.name || "-"],
                          [
                            "Lead From (Channel)",
                            lead.upload_via
                              ? String(lead.upload_via).toUpperCase()
                              : "CRM / Direct",
                          ],
                          [
                            "Assigned Counsellor",
                            assignedUser
                              ? `${assignedUser.first_name} ${assignedUser.last_name}`.trim()
                              : "Unassigned",
                          ],
                          ["Registration Date", formatDateTime(lead.created_at)],
                          [
                            "Next Follow-up",
                            lead.next_followup_at
                              ? formatDateTime(lead.next_followup_at)
                              : "Not Scheduled",
                          ],
                        ].map(([label, val]) => (
                          <div
                            key={label}
                            className="flex items-start justify-between gap-3 border-b border-border/50 py-1.5"
                          >
                            <span className="font-medium text-muted-foreground">
                              {label}
                            </span>
                            <span className="text-right font-semibold text-foreground">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>

                      {extraEntries.length > 0 && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3">
                          <h5 className="mb-2 text-xs font-semibold text-[#405189]">
                            Additional Submitted Fields (WebForm / Custom Attributes)
                          </h5>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                            {extraEntries.map(([k, v]) => (
                              <div
                                key={k}
                                className="flex items-start justify-between gap-2 border-b border-border/40 py-1"
                              >
                                <span className="capitalize text-muted-foreground">
                                  {k.replace(/_/g, " ")}
                                </span>
                                <span className="text-right font-medium">
                                  {v}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const ok = await postAction(
                          { action: "update_details", ...editForm },
                          "Lead profile updated successfully!"
                        )
                        if (ok) setEditingDetails(false)
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1 block text-xs">
                            Full Name *
                          </Label>
                          <Input
                            required
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs">
                            Mobile Number *
                          </Label>
                          <Input
                            required
                            value={editForm.mobile}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                mobile: e.target.value,
                              })
                            }
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs">
                            Alternate Mobile
                          </Label>
                          <Input
                            value={editForm.alternate_mobile}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                alternate_mobile: e.target.value,
                              })
                            }
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-xs">
                            Email Address
                          </Label>
                          <Input
                            type="email"
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="h-9 text-xs"
                          />
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">Country</Label>
                          <FormSelect
                            value={editForm.country}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                country: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Country</option>
                            {(master.countries || []).map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">State</Label>
                          <FormSelect
                            value={editForm.state}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                state: e.target.value,
                                city: "",
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select State</option>
                            {filteredEditStates.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">City</Label>
                          <FormSelect
                            value={editForm.city}
                            onChange={(e) =>
                              setEditForm({ ...editForm, city: e.target.value })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select City</option>
                            {filteredEditCities.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Institute
                          </Label>
                          <FormSelect
                            value={editForm.institute_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                institute_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Institute</option>
                            {master.institutes.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Programme
                          </Label>
                          <FormSelect
                            value={editForm.programme_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                programme_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Programme</option>
                            {master.programs.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Course / Specialization
                          </Label>
                          <FormSelect
                            value={editForm.faculty_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                faculty_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Course</option>
                            {master.courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Lead Source
                          </Label>
                          <FormSelect
                            value={editForm.lead_source_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                lead_source_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Source</option>
                            {master.sources.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Lead Medium / Type
                          </Label>
                          <FormSelect
                            value={editForm.type_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                type_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Lead Type</option>
                            {(master.leadTypes || []).map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">Campaign</Label>
                          <FormSelect
                            value={editForm.lead_campaign_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                lead_campaign_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Campaign</option>
                            {(master.campaigns || []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </FormSelect>
                        </div>

                        <div>
                          <Label className="mb-1 block text-xs">
                            Application Form Interested In
                          </Label>
                          <FormSelect
                            value={editForm.application_form_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                application_form_id: e.target.value,
                              })
                            }
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          >
                            <option value="">Select Application Form</option>
                            {master.applicationForms.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.title} (₹{f.fees || 0})
                              </option>
                            ))}
                          </FormSelect>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-border pt-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingDetails(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
                        >
                          Save Lead Profile
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* ==================== TAB 2: TIMELINE ==================== */}
              {activeTab === "timeline" && (
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No activity recorded yet.
                    </p>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex gap-3 border-l-2 border-[#405189]/30 pl-3"
                      >
                        <div className="flex-1 rounded bg-muted/40 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold uppercase text-[#405189]">
                              {act.action}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(act.created_at)}
                            </span>
                          </div>
                          <p className="mt-1">{act.description}</p>
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            By {act.actor_name || "System"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ==================== TAB 3: NOTES ==================== */}
              {activeTab === "notes" && (
                <div className="space-y-2.5">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => setNoteOpen(true)}
                      className="bg-[#405189] text-white hover:bg-[#364574]"
                    >
                      + Add Note
                    </Button>
                  </div>
                  {notes.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No counselling notes added yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Note</TableHead>
                          <TableHead>Added By</TableHead>
                          <TableHead>Date &amp; Time</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notes.map((n) => (
                          <TableRow key={n.id}>
                            <TableCell className="max-w-[340px] truncate font-medium">
                              {n.note}
                            </TableCell>
                            <TableCell>{n.creator_name || "System"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(n.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  title="View Full Note"
                                  onClick={() => setViewNoteItem(n)}
                                >
                                  <i className="ri-eye-line text-[#405189]" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  title="Delete Note"
                                  onClick={() =>
                                    confirmDelete({
                                      title: "Delete Note?",
                                      description:
                                        "Are you sure you want to permanently delete this counsellor note?",
                                      onConfirm: () =>
                                        postAction(
                                          {
                                            action: "delete_note",
                                            note_id: n.id,
                                          },
                                          "Note deleted"
                                        ),
                                    })
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <i className="ri-delete-bin-line" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* ==================== TAB 4: COMMUNICATION LOGS ==================== */}
              {activeTab === "comms" && (
                <div>
                  {commLogs.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No Email, SMS, or WhatsApp logs yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Channel</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent At</TableHead>
                          <TableHead className="text-right">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commLogs.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-semibold uppercase">
                              {c.channel}
                            </TableCell>
                            <TableCell>{c.to}</TableCell>
                            <TableCell className="max-w-[200px] truncate font-medium">
                              {c.subject || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className="border-0 bg-[#0ab39c]/15 text-[#0ab39c]">
                                {c.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(c.sent_at || c.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => setViewCommItem(c)}
                              >
                                <i className="ri-eye-line text-[#405189]" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* ==================== TAB 5: EVENTS ==================== */}
              {activeTab === "events" && (
                <div className="space-y-2.5">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => setEventOpen(true)}
                      className="bg-[#405189] text-white hover:bg-[#364574]"
                    >
                      + Schedule Event
                    </Button>
                  </div>
                  {events.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No follow-up events scheduled yet.
                    </p>
                  ) : (
                    events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between gap-3 rounded border border-border p-3"
                      >
                        <div>
                          <div className="font-semibold">{ev.subject}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {String(ev.event_type || "").toUpperCase()} ·{" "}
                            {formatDateTime(ev.start_at)}
                            {ev.end_at ? ` → ${formatDateTime(ev.end_at)}` : ""}{" "}
                            · Owner: {ev.owner_name || "System"}
                          </div>
                          {ev.description && (
                            <p className="mt-1 text-muted-foreground">
                              {ev.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary">
                            {ev.status || "scheduled"}
                          </Badge>
                          {ev.status !== "completed" && (
                            <Button
                              type="button"
                              size="xs"
                              onClick={() =>
                                postAction(
                                  {
                                    action: "event_status",
                                    event_id: ev.id,
                                    status: "completed",
                                  },
                                  "Event marked completed"
                                )
                              }
                              className="bg-[#0ab39c]/15 text-[#0ab39c] hover:bg-[#0ab39c]/25"
                            >
                              Mark Done
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ==================== TAB 6: DOCVERIFY ==================== */}
              {activeTab === "docs" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Upload and verify student KYC &amp; academic documents.
                    </p>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => setDocModalOpen(true)}
                      className="bg-[#405189] text-white hover:bg-[#364574]"
                    >
                      + Upload Document
                    </Button>
                  </div>
                  {documents.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded border border-border p-2.5"
                        >
                          <div>
                            <div className="font-semibold">{d.title}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {d.doc_type || "Academic"} · Uploaded{" "}
                              {formatDateShort(d.created_at)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={`border-0 ${
                                d.status === "approved"
                                  ? "bg-[#0ab39c]/15 text-[#0ab39c]"
                                  : d.status === "rejected"
                                    ? "bg-[#f06548]/15 text-[#f06548]"
                                    : "bg-[#f7b84b]/20 text-amber-700"
                              }`}
                            >
                              {String(d.status || "pending").toUpperCase()}
                            </Badge>
                            <Button
                              type="button"
                              size="xs"
                              onClick={() =>
                                postAction(
                                  {
                                    action: "verify_doc",
                                    doc_id: d.id,
                                    status: 1,
                                  },
                                  "Document approved!"
                                )
                              }
                              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="destructive"
                              onClick={() =>
                                postAction(
                                  {
                                    action: "verify_doc",
                                    doc_id: d.id,
                                    status: 2,
                                  },
                                  "Document rejected"
                                )
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ==================== TAB 7: TICKETS ==================== */}
              {activeTab === "tickets" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Student admission queries &amp; support tickets.
                    </p>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => setTicketModalOpen(true)}
                      className="bg-[#405189] text-white hover:bg-[#364574]"
                    >
                      + New Ticket
                    </Button>
                  </div>

                  {tickets.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No support tickets opened for this lead.
                    </p>
                  ) : (
                    tickets.map((tk) => {
                      const msgs = ticketMessages.filter(
                        (m) => Number(m.query_id) === Number(tk.id)
                      )
                      return (
                        <div
                          key={tk.id}
                          className="space-y-2 rounded border border-border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold">
                                #{tk.id} — {tk.subject}
                              </span>
                              <span className="ml-2 text-[11px] text-muted-foreground">
                                {formatDateTime(tk.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary">
                                {tk.status || "open"}
                              </Badge>
                              {tk.status !== "closed" && (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  onClick={() =>
                                    postAction(
                                      {
                                        action: "ticket_status",
                                        query_id: tk.id,
                                        status: "closed",
                                      },
                                      "Ticket resolved & closed"
                                    )
                                  }
                                >
                                  Close
                                </Button>
                              )}
                            </div>
                          </div>
                          {tk.description && (
                            <p className="text-muted-foreground">
                              {tk.description}
                            </p>
                          )}
                          {msgs.length > 0 && (
                            <div className="space-y-1.5 border-t border-border pt-2">
                              {msgs.map((m) => (
                                <div
                                  key={m.id}
                                  className="rounded bg-muted/50 px-2.5 py-1.5"
                                >
                                  <span className="font-semibold text-[#405189]">
                                    {m.sender_type || "Counsellor"}:
                                  </span>{" "}
                                  {m.message}
                                </div>
                              ))}
                            </div>
                          )}
                          {replyTicketId === tk.id ? (
                            <div className="flex gap-2 pt-1">
                              <Input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write reply..."
                                className="h-8 text-xs"
                              />
                              <Button
                                type="button"
                                size="xs"
                                onClick={async () => {
                                  if (!replyText.trim()) return
                                  await postAction(
                                    {
                                      action: "reply_ticket",
                                      query_id: tk.id,
                                      message: replyText,
                                    },
                                    "Reply sent"
                                  )
                                  setReplyText("")
                                  setReplyTicketId(null)
                                }}
                                className="bg-[#405189] text-white"
                              >
                                Send
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="link"
                              size="xs"
                              onClick={() => setReplyTicketId(tk.id)}
                              className="h-auto p-0 text-[#405189]"
                            >
                              Reply to Ticket
                            </Button>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {/* ==================== TAB 8: CALL LOGS ==================== */}
              {activeTab === "calls" && (
                <div className="space-y-2.5">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="xs"
                      onClick={() =>
                        postAction({ action: "call_now" }, "Call logged!")
                      }
                      className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                    >
                      + Initiate Call
                    </Button>
                  </div>
                  {callLogs.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">
                      No telephony calls recorded yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Direction</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callLogs.map((cl) => (
                          <TableRow key={cl.id}>
                            <TableCell className="uppercase">
                              {cl.direction || "outbound"}
                            </TableCell>
                            <TableCell>{cl.customer_number || lead.mobile}</TableCell>
                            <TableCell>
                              <Badge className="border-0 bg-[#0ab39c]/15 text-[#0ab39c]">
                                {cl.status || "completed"}
                              </Badge>
                            </TableCell>
                            <TableCell>{cl.duration || 45}s</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(cl.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}

              {/* ==================== TAB 9: CALENDAR PRO ==================== */}
              {activeTab === "calendar" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setCalMonthOffset((m) => m - 1)}
                      >
                        <i className="ri-arrow-left-s-line" />
                      </Button>
                      <span className="text-sm font-semibold">
                        {monthLabel}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setCalMonthOffset((m) => m + 1)}
                      >
                        <i className="ri-arrow-right-s-line" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => setEventOpen(true)}
                      className="bg-[#405189] text-white hover:bg-[#364574]"
                    >
                      + Add Follow-up Event
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (d) => (
                        <div key={d} className="py-1">
                          {d}
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayIdx }).map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-16 rounded border border-transparent bg-muted/20"
                      />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1
                      const dayEvents = events.filter((ev) => {
                        if (!ev.start_at) return false
                        const dt = new Date(ev.start_at)
                        return (
                          dt.getFullYear() === calYear &&
                          dt.getMonth() === calMonth &&
                          dt.getDate() === dayNum
                        )
                      })
                      return (
                        <div
                          key={dayNum}
                          className="min-h-16 rounded border border-border p-1.5 text-[11px]"
                        >
                          <div className="font-semibold text-muted-foreground">
                            {dayNum}
                          </div>
                          <div className="mt-0.5 space-y-0.5">
                            {dayEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="truncate rounded bg-[#405189]/15 px-1 py-0.5 text-[10px] font-medium text-[#405189]"
                                title={ev.subject}
                              >
                                {ev.subject}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ==================== STATUS LOG CARD (RESTORED FROM leads_show.blade.php L1201) ==================== */}
          <Card className="gap-0 overflow-hidden p-0 shadow-xs">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h4 className="text-xs font-semibold">Status &amp; Assignment Log</h4>
              <Badge variant="secondary" className="text-[10px]">
                {statusLogs.length} entries
              </Badge>
            </div>
            <div className="p-0 text-xs">
              {statusLogs.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">
                  No stage or status transitions recorded yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Action</TableHead>
                      <TableHead>Remarks / Transition</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead>Changed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statusLogs.slice(0, 12).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className="border-0 bg-[#405189]/10 text-[10px] uppercase text-[#405189]">
                            {String(log.action || "").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate font-medium">
                          {log.description}
                        </TableCell>
                        <TableCell>{log.actor_name || "System"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ==================== MODAL 1: ADD LEAD NOTE (WITH PREVIOUS ACTIVITIES) ==================== */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!noteText.trim()) return
              const ok = await postAction(
                { action: "add_note", note: noteText.slice(0, 1024) },
                "Note saved!"
              )
              if (ok) {
                setNoteText("")
              }
            }}
            className="space-y-3"
          >
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Add Lead Note — {lead.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Record counselling notes and inspect previous activities.
              </DialogDescription>
            </DialogHeader>

            <div>
              <Label className="mb-1 block text-xs">Note</Label>
              <Textarea
                rows={4}
                required
                maxLength={1024}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your note here..."
                className="text-xs"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Only 1024 characters allowed.</span>
                <span>{noteText.length}/1024</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNoteOpen(false)}
              >
                Close
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Note
              </Button>
            </div>

            <div className="border-t border-border pt-3">
              <h6 className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span>Previous Activities</span>
                <Badge variant="secondary" className="text-[10px]">
                  {notes.length + activities.length}
                </Badge>
              </h6>

              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {notes.length === 0 && activities.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No previous notes or activities recorded yet.
                  </p>
                ) : (
                  <>
                    {notes.map((n) => (
                      <div
                        key={`prev-note-${n.id}`}
                        className="rounded border border-amber-200/70 bg-amber-50/40 p-2.5 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
                      >
                        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            <i className="ri-sticky-note-line mr-1 text-amber-600" />
                            {n.creator_name || "Counsellor"}
                          </span>
                          <span>{formatDateTime(n.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-foreground/90">
                          {n.note}
                        </p>
                      </div>
                    ))}
                    {activities.map((act) => (
                      <div
                        key={`prev-act-${act.id}`}
                        className="rounded border border-border bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="mb-0.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="font-semibold text-[#405189]">
                            <i className="ri-history-line mr-1" />
                            {act.actor_name || "System"} ·{" "}
                            <span className="uppercase">{act.action}</span>
                          </span>
                          <span>{formatDateTime(act.created_at)}</span>
                        </div>
                        <p className="text-muted-foreground">
                          {act.description}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 2: VIEW NOTE DETAIL ==================== */}
      <Dialog
        open={Boolean(viewNoteItem)}
        onOpenChange={(open) => !open && setViewNoteItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Lead Note Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              By {viewNoteItem?.creator_name || "System"} on{" "}
              {formatDateTime(viewNoteItem?.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
            {viewNoteItem?.note}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewNoteItem(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 3: VIEW COMMUNICATION DETAIL ==================== */}
      <Dialog
        open={Boolean(viewCommItem)}
        onOpenChange={(open) => !open && setViewCommItem(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {String(viewCommItem?.channel || "Message").toUpperCase()} —{" "}
              {viewCommItem?.subject || "Outbound Message"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sent to {viewCommItem?.to} ·{" "}
              {formatDateTime(viewCommItem?.sent_at || viewCommItem?.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div
            className="max-h-72 overflow-y-auto rounded border border-border bg-muted/20 p-3 text-xs"
            dangerouslySetInnerHTML={{
              __html: String(viewCommItem?.content || "-"),
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewCommItem(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== SHEET 1: CHANGE STAGE / STATUS ==================== */}
      <Sheet open={stageOpen} onOpenChange={setStageOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Change Lead Stage &amp; Status
            </SheetTitle>
            <SheetDescription className="text-xs">
              Update pipeline stage, status, sub-status, and next follow-up.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Pipeline Stage</Label>
              <FormSelect
                value={stageForm.stage_id}
                onChange={(e) =>
                  setStageForm({ ...stageForm, stage_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Keep current stage</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Lead Status *</Label>
              <FormSelect
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
                {master.statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Sub Status</Label>
              <FormSelect
                value={stageForm.lead_sub_status_id}
                onChange={(e) =>
                  setStageForm({
                    ...stageForm,
                    lead_sub_status_id: e.target.value,
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Sub Status</option>
                {master.subStatuses
                  .filter(
                    (ss) =>
                      !stageForm.lead_status_id ||
                      String(ss.lead_status_id) === stageForm.lead_status_id
                  )
                  .map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))}
              </FormSelect>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Next Follow-up</Label>
              <DateTimePicker
                value={stageForm.followup_date}
                onChange={(v) =>
                  setStageForm({ ...stageForm, followup_date: v })
                }
                placeholder="Pick next follow-up date & time"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Note / Remark</Label>
              <Textarea
                rows={3}
                value={stageForm.stage_note}
                onChange={(e) =>
                  setStageForm({ ...stageForm, stage_note: e.target.value })
                }
                placeholder="Enter stage transition remarks..."
                className="text-xs"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStageOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const ok = await postAction(
                  { action: "change_stage", ...stageForm },
                  "Stage & status updated!"
                )
                if (ok) setStageOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Save Stage
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET 2: UNIFIED COMMUNICATE SIDEBAR (100% IDENTICAL TO ALL LEADS) ==================== */}
      <Sheet open={commOpen} onOpenChange={setCommOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-xl flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Single Communication
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send Email, SMS, or WhatsApp messages using CRM templates.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
            <Tabs
              value={commTab}
              onValueChange={(v) => {
                setCommTab(v as "email" | "sms" | "whatsapp")
                setCommTemplateId("")
              }}
            >
              <TabsList className="h-8">
                {(["email", "sms", "whatsapp"] as const).map((ch) => (
                  <TabsTrigger key={ch} value={ch} className="text-xs uppercase">
                    {ch === "email" ? (
                      <span className="inline-flex items-center gap-1">
                        <i className="ri-mail-line" /> Email
                      </span>
                    ) : ch === "sms" ? (
                      <span className="inline-flex items-center gap-1">
                        <i className="ri-message-2-line" /> SMS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <i className="ri-whatsapp-line text-emerald-600" />{" "}
                        WhatsApp
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {commTab === "email" && (
              <div>
                <Label className="mb-1 block text-xs">From Email</Label>
                <FormSelect
                  value={commFromEmail}
                  onChange={(e) => setCommFromEmail(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value={userEmail}>{userEmail}</option>
                </FormSelect>
              </div>
            )}

            <div>
              <Label className="mb-1 block text-xs">Template</Label>
              <FormSelect
                value={commTemplateId}
                onChange={(e) => {
                  const tplId = e.target.value
                  setCommTemplateId(tplId)
                  if (!tplId) return
                  const pool =
                    commTab === "email"
                      ? master.emailTemplates || []
                      : commTab === "sms"
                        ? master.smsTemplates || []
                        : master.whatsappTemplates || []
                  const found = pool.find((t: any) => String(t.id) === tplId)
                  if (found) {
                    if (found.subject) setCommSubject(found.subject)
                    setCommMessage(found.message || found.content || "")
                  }
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Template</option>
                {(commTab === "email"
                  ? master.emailTemplates || []
                  : commTab === "sms"
                    ? master.smsTemplates || []
                    : master.whatsappTemplates || []
                ).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title || t.name || `Template #${t.id}`}
                  </option>
                ))}
              </FormSelect>
            </div>

            {commTab === "email" && (
              <div>
                <Label className="mb-1 block text-xs">Subject</Label>
                <Input
                  type="text"
                  value={commSubject}
                  onChange={(e) => setCommSubject(e.target.value)}
                  placeholder="Enter email subject"
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
                <Label className="text-xs">
                  {commTab === "email" ? "Email Body" : "Message Text"}
                </Label>
                <div className="flex flex-wrap gap-1">
                  {[
                    "{lead_name}",
                    "{lead_mobile}",
                    "{lead_email}",
                    "{application_link}",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() =>
                        setCommMessage(
                          (prev) => `${prev}${prev ? " " : ""}${token}`
                        )
                      }
                      className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>
              {commTab === "email" ? (
                <RichTextEditor
                  value={commMessage}
                  onChange={setCommMessage}
                  placeholder="Compose email content..."
                />
              ) : (
                <Textarea
                  rows={6}
                  value={commMessage}
                  onChange={(e) => setCommMessage(e.target.value)}
                  placeholder={`Enter ${commTab.toUpperCase()} message...`}
                  className="text-xs"
                />
              )}
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!commMessage.trim()) {
                  toast.warning("Please enter a message or select a template")
                  return
                }
                const ok = await postAction(
                  {
                    action: "communicate",
                    channel: commTab,
                    from_email: commFromEmail,
                    template_id: commTemplateId || undefined,
                    subject: commSubject,
                    message: commMessage,
                    application_link: applicationPortalHref
                      ? `${window.location.origin}${applicationPortalHref}`
                      : undefined,
                  },
                  `${commTab.toUpperCase()} sent to ${
                    commTab === "email" ? lead.email || lead.mobile : lead.mobile
                  }!`
                )
                if (ok) {
                  setCommMessage("")
                  setCommOpen(false)
                }
              }}
              className={`text-white ${
                commTab === "whatsapp"
                  ? "bg-[#0ab39c] hover:bg-[#099885]"
                  : "bg-[#405189] hover:bg-[#364574]"
              }`}
            >
              Send{" "}
              {commTab === "email"
                ? "Now"
                : commTab === "whatsapp"
                  ? "WhatsApp"
                  : "SMS"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET 3: EDIT PIPELINE (editPipelineCanvas) ==================== */}
      <Sheet open={editPipelineOpen} onOpenChange={setEditPipelineOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Edit Pipeline
            </SheetTitle>
            <SheetDescription className="text-xs">
              Move this lead to another admissions pipeline.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-4 text-xs">
            <Label className="mb-1.5 block text-xs">Pipeline *</Label>
            <FormSelect
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Pipeline</option>
              {master.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditPipelineOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedPipelineId}
              onClick={async () => {
                const ok = await postAction(
                  {
                    action: "update_pipeline",
                    pipeline_id: selectedPipelineId,
                  },
                  "Pipeline updated!"
                )
                if (ok) setEditPipelineOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Update Pipeline
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET 4: EDIT SOURCE (editSourceCanvas) ==================== */}
      <Sheet open={editSourceOpen} onOpenChange={setEditSourceOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Edit Lead Source
            </SheetTitle>
            <SheetDescription className="text-xs">
              Update acquisition source attribution for this lead.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-4 text-xs">
            <Label className="mb-1.5 block text-xs">Source *</Label>
            <FormSelect
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Source</option>
              {master.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditSourceOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedSourceId}
              onClick={async () => {
                const ok = await postAction(
                  { action: "update_source", source_id: selectedSourceId },
                  "Lead source updated!"
                )
                if (ok) setEditSourceOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Update Source
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== SHEET 5: ADD EVENT ==================== */}
      <Sheet open={eventOpen} onOpenChange={setEventOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">Add Event</SheetTitle>
            <SheetDescription className="text-xs">
              Schedule a phone call, video counselling session, or campus visit.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Subject *</Label>
              <Input
                value={eventForm.subject}
                onChange={(e) =>
                  setEventForm({ ...eventForm, subject: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Event Type *</Label>
              <FormSelect
                value={eventForm.event_type}
                onChange={(e) =>
                  setEventForm({ ...eventForm, event_type: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="phone_call">Phone Call</option>
                <option value="video_call">Video Call</option>
                <option value="meeting">Meeting / Campus Visit</option>
                <option value="lunch">Lunch</option>
              </FormSelect>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">From *</Label>
                <DateTimePicker
                  value={eventForm.start_at}
                  onChange={(v) => setEventForm({ ...eventForm, start_at: v })}
                  placeholder="Start date & time"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">To</Label>
                <DateTimePicker
                  value={eventForm.end_at}
                  onChange={(v) => setEventForm({ ...eventForm, end_at: v })}
                  placeholder="End date & time"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Owner *</Label>
              <FormSelect
                value={eventForm.owner_id}
                onChange={(e) =>
                  setEventForm({ ...eventForm, owner_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Current User ({userName})</option>
                {master.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Organiser *</Label>
              <Input
                value={eventForm.organiser}
                onChange={(e) =>
                  setEventForm({ ...eventForm, organiser: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Textarea
                rows={3}
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
                placeholder="Agenda or follow-up notes..."
                className="text-xs"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                const ok = await postAction(
                  { action: "add_event", ...eventForm },
                  "Event scheduled!"
                )
                if (ok) setEventOpen(false)
              }}
              className="bg-[#f7b84b] font-semibold text-slate-900 hover:bg-[#e0a642]"
            >
              Submit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== MODAL 4: RE-ASSIGN LEAD (WITH ADD OWNER | REMOVE & ADD) ==================== */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Re-assign Lead
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transfer or share ownership of {lead.name} with an admissions counsellor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <Label className="mb-1.5 block text-xs">Re-assigned to *</Label>
              <FormSelect
                value={reassignUserId}
                onChange={(e) => setReassignUserId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select User</option>
                {master.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </FormSelect>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReassignType("add_owner")}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                    reassignType === "add_owner"
                      ? "border-[#405189] bg-[#405189] text-white"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <i className="ri-user-add-line" /> Add Owner
                </button>
                <button
                  type="button"
                  onClick={() => setReassignType("remove_and_add")}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                    reassignType === "remove_and_add"
                      ? "border-[#405189] bg-[#405189] text-white"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <i className="ri-user-shared-2-line" /> Remove &amp; Add
                </button>
              </div>
            </div>
          </div>

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
              disabled={!reassignUserId}
              onClick={async () => {
                const ok = await postAction(
                  {
                    action: "reassign",
                    reassign_to: reassignUserId,
                    reassign_type: reassignType,
                  },
                  "Lead reassigned successfully!"
                )
                if (ok) setReassignOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 5: ASSIGN / CHANGE APPLICATION FORM ==================== */}
      <Dialog open={assignFormModalOpen} onOpenChange={setAssignFormModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Assign Application Form
            </DialogTitle>
            <DialogDescription className="text-xs">
              Link an admission form to {lead.name} so you or the student can fill it online.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs">
            <Label className="mb-1.5 block text-xs">Application Form *</Label>
            <FormSelect
              value={selectedAppFormId}
              onChange={(e) => setSelectedAppFormId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Application Form</option>
              {master.applicationForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} — ₹{f.fees || 0}
                </option>
              ))}
            </FormSelect>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedAppFormId}
              onClick={async () => {
                const ok = await postAction(
                  {
                    action: "assign_application_form",
                    application_form_id: selectedAppFormId,
                  },
                  "Application Form assigned!"
                )
                if (ok) setAssignFormModalOpen(false)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Assign Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 6: TAKE PAYMENT CONSOLE ==================== */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Take Application Payment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apply discount coupons and record fee payment for {lead.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Payable</span>
                <span className="font-semibold">₹{baseFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Paid</span>
                <span className="font-semibold">
                  ₹{currentPaidAmount.toLocaleString()}
                </span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between text-[#0ab39c]">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">
                    -₹{discountVal.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold">
                <span>Net Payable</span>
                <span className="text-[#0ab39c]">
                  ₹{netPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MERIT50"
                  className="h-9 text-xs uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!couponCode.trim()) return
                    const res = await postAction({
                      action: "validate_coupon",
                      code: couponCode,
                    })
                    if (res?.coupon) {
                      setAppliedCoupon(res.coupon)
                      toast.success(`Coupon ${res.coupon.code} applied!`)
                    }
                  }}
                >
                  Apply Coupon
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Payment Method</Label>
                <FormSelect
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Online / Razorpay">Online / Razorpay</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="NEFT / Bank Transfer">
                    NEFT / Bank Transfer
                  </option>
                  <option value="Cheque / DD">Cheque / DD</option>
                </FormSelect>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Final Amount (₹)</Label>
                <Input
                  type="number"
                  value={finalAmountInput || String(netPayable)}
                  onChange={(e) => setFinalAmountInput(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
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
              onClick={async () => {
                const ok = await postAction(
                  {
                    action: "mark_payment_done",
                    payment_method: paymentMethod,
                    coupon_code: appliedCoupon?.code || undefined,
                    total_fee: baseFee,
                    discount_total: discountVal,
                    final_amount: Number(finalAmountInput || netPayable),
                  },
                  "Application payment marked as PAID!"
                )
                if (ok) setPaymentModalOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Mark Payment Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 7: UPLOAD DOCUMENT ==================== */}
      <Dialog open={docModalOpen} onOpenChange={setDocModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Upload Student Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach KYC or academic documents to DocVerify.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Document Title *</Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. 12th Board Marksheet"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Document Category</Label>
              <FormSelect
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="Academic Marksheet">Academic Marksheet</option>
                <option value="Identity Proof (Aadhaar/PAN)">
                  Identity Proof (Aadhaar/PAN)
                </option>
                <option value="Entrance Scorecard">Entrance Scorecard</option>
                <option value="Passport Photograph">Passport Photograph</option>
              </FormSelect>
            </div>
          </div>
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
              onClick={async () => {
                if (!docTitle.trim()) return
                const ok = await postAction(
                  {
                    action: "upload_doc",
                    title: docTitle,
                    doc_type: docType,
                  },
                  "Document uploaded to DocVerify!"
                )
                if (ok) {
                  setDocTitle("")
                  setDocModalOpen(false)
                }
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL 8: CREATE SUPPORT TICKET ==================== */}
      <Dialog open={ticketModalOpen} onOpenChange={setTicketModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Open Student Support Ticket
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create a query ticket linked to {lead.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Subject *</Label>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g. Hostel fee installment query"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Query Description *</Label>
              <Textarea
                rows={4}
                value={ticketDesc}
                onChange={(e) => setTicketDesc(e.target.value)}
                placeholder="Describe student question..."
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTicketModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!ticketSubject.trim()) return
                const ok = await postAction(
                  {
                    action: "create_ticket",
                    subject: ticketSubject,
                    description: ticketDesc,
                  },
                  "Ticket created!"
                )
                if (ok) {
                  setTicketSubject("")
                  setTicketDesc("")
                  setTicketModalOpen(false)
                }
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== SHEET 6: WHATSAPP CHAT HISTORY ==================== */}
      <Sheet open={waChatOpen} onOpenChange={setWaChatOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border bg-[#075e54] px-4 py-3.5 text-white">
            <SheetTitle className="text-sm font-semibold text-white">
              <i className="ri-whatsapp-line mr-1.5" />
              WhatsApp History — {lead.name}
            </SheetTitle>
            <SheetDescription className="text-xs text-emerald-100">
              {lead.mobile}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#ece5dd]/50 p-4 text-xs dark:bg-muted/20">
            {commLogs.filter((c) => c.channel === "whatsapp").length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No WhatsApp messages exchanged yet. Send the first message below!
              </p>
            ) : (
              commLogs
                .filter((c) => c.channel === "whatsapp")
                .slice()
                .reverse()
                .map((w) => (
                  <div
                    key={w.id}
                    className="ml-auto max-w-[85%] rounded-lg bg-[#dcf8c6] p-2.5 text-slate-900 shadow-2xs"
                  >
                    <p>{w.content}</p>
                    <div className="mt-1 text-right text-[10px] text-slate-500">
                      {formatDateTime(w.sent_at || w.created_at)} · ✓✓
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={waQuickText}
              onChange={(e) => setWaQuickText(e.target.value)}
              placeholder="Type a WhatsApp message..."
              className="h-9 text-xs"
            />
            <Button
              type="button"
              onClick={async () => {
                if (!waQuickText.trim()) return
                await postAction(
                  {
                    action: "communicate",
                    channel: "whatsapp",
                    message: waQuickText,
                  },
                  "WhatsApp message sent!"
                )
                setWaQuickText("")
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Send
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {DeleteDialog}
    </div>
  )
}
