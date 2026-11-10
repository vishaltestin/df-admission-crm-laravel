"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  BookOpen,
  CheckCircle2,
  Copy,
  PhoneCall,
  PlugZap,
  Search,
  ShieldCheck,
  Webhook,
} from "lucide-react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FormSelect } from "@/components/ui/form-select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface IvrEndpointSpec {
  name: string
  method: "GET" | "POST" | "POST (multipart)"
  path: string
  auth: "Header: authcode" | "Query: ?authcode=" | "Body: email + password"
  requiredParams: string
  optionalParams?: string
  description: string
}

interface IvrCategorySpec {
  id: string
  title: string
  summary: string
  endpoints: IvrEndpointSpec[]
}

const IVR_API_CATEGORIES: IvrCategorySpec[] = [
  {
    id: "contacts",
    title: "1) Contacts / CRM Sync",
    summary:
      "Synchronize student leads and counsellor caller-ID directories with your cloud telephony phonebook so incoming calls display student names on agent softphones.",
    endpoints: [
      {
        name: "Add Contact",
        method: "POST",
        path: "/api/savecontact_v2",
        auth: "Header: authcode",
        requiredParams: "name, mobile (10-digit or E.164)",
        optionalParams: "email, company, custom_field_1 (lead_id), assign_agent",
        description:
          "Creates a student contact record in the IVR directory and links CRM Lead ID for automatic CDR matching.",
      },
      {
        name: "Edit Contact",
        method: "POST",
        path: "/api/editContact_v2",
        auth: "Header: authcode",
        requiredParams: "contact_id, name, mobile",
        optionalParams: "email, notes, tags",
        description:
          "Updates existing contact name, alternate mobile number, or assigned counsellor extension.",
      },
      {
        name: "Delete Contact",
        method: "POST",
        path: "/api/deleteContact",
        auth: "Header: authcode",
        requiredParams: "contact_id (or mobile)",
        description:
          "Removes a contact record from the cloud telephony directory.",
      },
      {
        name: "Contact List",
        method: "POST",
        path: "/api/contact_list_v2",
        auth: "Header: authcode",
        requiredParams: "page (default 1), limit (default 50)",
        optionalParams: "search, from_date, to_date",
        description:
          "Paginated fetch of synced contacts stored on the telephony tenant.",
      },
    ],
  },
  {
    id: "members",
    title: "2) Team / Members (Counsellor Agents)",
    summary:
      "Provision admission counsellors as telephony agents, manage their SIP/mobile deskphones, and pull agent call productivity analytics.",
    endpoints: [
      {
        name: "Add Member (Agent)",
        method: "POST",
        path: "/api/addmember_v2",
        auth: "Header: authcode",
        requiredParams: "member_name, member_mobile, email",
        optionalParams: "ext_no, role (agent|tl), active (1|0), sticky_agent (1|0)",
        description:
          "Registers a CRM counsellor as an active call-taking/outbound member with mobile or SIP extension.",
      },
      {
        name: "Update Member",
        method: "POST",
        path: "/api/updatemember_v2",
        auth: "Header: authcode",
        requiredParams: "member_id",
        optionalParams: "member_name, member_mobile, active (1|0), call_limit",
        description:
          "Updates counsellor mobile forwarding number or toggles online/offline availability.",
      },
      {
        name: "Delete Member",
        method: "POST",
        path: "/api/deletemember_v2",
        auth: "Header: authcode",
        requiredParams: "member_id",
        description:
          "Deprovisions an agent extension and detaches them from active ring groups.",
      },
      {
        name: "Member List",
        method: "POST",
        path: "/api/getmemberlist_V2",
        auth: "Header: authcode",
        requiredParams: "None (JSON body `{}`)",
        optionalParams: "status (1=active, 0=inactive)",
        description:
          "Returns all configured agents with their `member_id`, extension, mobile number, and live availability state.",
      },
      {
        name: "Member Analysis",
        method: "POST",
        path: "/api/member_analysis_v2",
        auth: "Header: authcode",
        requiredParams: "from_date (YYYY-MM-DD), to_date (YYYY-MM-DD)",
        optionalParams: "member_id",
        description:
          "Aggregates counsellor talk-time, answered vs missed calls, average handle time (AHT), and outbound pickup rate.",
      },
    ],
  },
  {
    id: "groups",
    title: "3) Call Groups & Ring Schedules",
    summary:
      "Configure department/institute ring groups (e.g., Engineering Admissions, MBA Helpline) with round-robin, sequential, or simultaneous ring strategies.",
    endpoints: [
      {
        name: "Create Call Group",
        method: "POST",
        path: "/api/createcallgroup",
        auth: "Header: authcode",
        requiredParams: "group_name, ring_strategy (round_robin|simultaneous|serial), members[]",
        optionalParams: "ring_timeout (sec), sticky_agent (1|0), hold_music_id",
        description:
          "Creates a multi-agent ring group for IVR keypress routing (e.g., Press 1 -> Admissions Queue).",
      },
      {
        name: "Update Group",
        method: "POST",
        path: "/api/updategroup_v2",
        auth: "Header: authcode",
        requiredParams: "group_id, group_name, members[]",
        optionalParams: "ring_strategy, ring_timeout, fallback_number",
        description:
          "Updates agent roster, ring order, or overflow fallback deskphone for an existing call group.",
      },
      {
        name: "Delete Group",
        method: "POST",
        path: "/api/deletegroup",
        auth: "Header: authcode",
        requiredParams: "group_id",
        description: "Deletes a call group (must not be bound to an active DID).",
      },
      {
        name: "Group List",
        method: "POST",
        path: "/api/getgrouplist_v2",
        auth: "Header: authcode",
        requiredParams: "None (`{}`)",
        description:
          "Lists all call groups, member counts, and assigned virtual DIDs.",
      },
      {
        name: "Group By ID",
        method: "POST",
        path: "/api/getgroupbyid_v2",
        auth: "Header: authcode",
        requiredParams: "group_id",
        description:
          "Fetches full member priority list and sticky-agent rules for one group.",
      },
      {
        name: "Group Business Schedule",
        method: "POST",
        path: "/api/getgroupschedule",
        auth: "Header: authcode",
        requiredParams: "group_id",
        description:
          "Retrieves working hours (e.g., Mon–Sat 09:00–19:00 IST) and after-hours voicemail audio configuration.",
      },
    ],
  },
  {
    id: "calling",
    title: "4) Calling, Routing & Live Calls",
    summary:
      "Pull historical Call Detail Records (CDRs) with MP3 recording URLs, inspect DID routing trees, and monitor active live calls in real time.",
    endpoints: [
      {
        name: "Call Logs (CDR History)",
        method: "POST",
        path: "/api/call_list_v2",
        auth: "Header: authcode",
        requiredParams: "from_date (YYYY-MM-DD HH:mm:ss), to_date (YYYY-MM-DD HH:mm:ss)",
        optionalParams: "page, limit, call_type (inbound|outbound|missed), caller_number, agent_number",
        description:
          "Returns CDR entries including `call_id`, `duration`, `billsec`, `disposition` (`ANSWERED`/`NO ANSWER`/`BUSY`), `dtmf`, and `recording_url`.",
      },
      {
        name: "Routing Details",
        method: "POST",
        path: "/api/getroutingdetail_V2",
        auth: "Header: authcode",
        requiredParams: "did_number (Caller ID / Deskphone)",
        description:
          "Inspects IVR welcome prompt, DTMF menu branches (`1`–`9`), and assigned call groups for a virtual DID.",
      },
      {
        name: "Live Calls Monitor",
        method: "GET",
        path: "/api/live_call_v2",
        auth: "Query: ?authcode=",
        requiredParams: "authcode (query param)",
        optionalParams: "group_name, agent_number",
        description:
          "Real-time snapshot of currently ringing and connected calls with live call duration and channel state.",
      },
    ],
  },
  {
    id: "click2call",
    title: "5) Click2Call (Outgoing Bridge)",
    summary:
      "Initiates instant two-leg bridged calls from Lead Detail (`Call Now`) — rings counsellor first (or student first in v3), then bridges the second party showing Organization Caller ID.",
    endpoints: [
      {
        name: "Normal Click2Call (Agent → Student)",
        method: "GET",
        path: "/api/click_to_call_v2",
        auth: "Query: ?authcode=",
        requiredParams: "authcode, agent_number, customer_number",
        optionalParams: "caller_id (DID), deskphone, ref_id (lead_id), callback_url",
        description:
          "Leg 1 dials `agent_number`; once counsellor answers, Leg 2 dials `customer_number` masking caller ID with `caller_id`.",
      },
      {
        name: "Click2Call With Call Group",
        method: "GET",
        path: "/api/click_to_call_v2",
        auth: "Query: ?authcode=",
        requiredParams: "authcode, group_name, customer_number",
        optionalParams: "caller_id, ref_id (lead_id)",
        description:
          "Hunts for the first free counsellor inside `group_name` and bridges them to the student.",
      },
      {
        name: "Reverse Click2Call (Student → Queue)",
        method: "GET",
        path: "/api/click_to_call_v3",
        auth: "Query: ?authcode=",
        requiredParams: "authcode, customer_number, agent_number (or group_name)",
        optionalParams: "caller_id, welcome_audio, ref_id",
        description:
          "Dials student first (ideal for instant 'Request Callback' web forms), plays welcome prompt, and connects to available counsellor.",
      },
    ],
  },
  {
    id: "obd",
    title: "6) Voice Broadcast (OBD & Automated Raw-Lead IVR)",
    summary:
      "Powers `/raw-data/automation` automated outbound IVR qualification blasts (`Press 1 if interested in admission, Press 2 to opt out`).",
    endpoints: [
      {
        name: "Create OBD Campaign",
        method: "POST (multipart)",
        path: "/api/create_obd_campaign_v2",
        auth: "Header: authcode",
        requiredParams: "campaign_name, caller_id, numbers_csv (or numbers[]), audio_file (WAV/MP3 8kHz mono)",
        optionalParams: "dtmf_enabled (1|0), retry_count (0-3), retry_interval_min, schedule_at",
        description:
          "Launches bulk voice broadcast with interactive DTMF capture (`dtmf=1` marks Raw Data as `Verified` in CRM).",
      },
      {
        name: "Broadcast (OBD) Logs",
        method: "POST",
        path: "/api/obdlogs_v2",
        auth: "Header: authcode",
        requiredParams: "campaign_id (or from_date + to_date)",
        optionalParams: "dtmf_filter, status, page",
        description:
          "Fetches per-recipient OBD delivery status, listen duration, and pressed DTMF digit (`0`–`9`).",
      },
    ],
  },
  {
    id: "security",
    title: "7) Security / DND & Spam Blocking",
    summary:
      "Blacklist abusive or spam callers at the carrier trunk level so they cannot consume counsellor queue capacity.",
    endpoints: [
      {
        name: "Block Number",
        method: "POST",
        path: "/api/block_number",
        auth: "Header: authcode",
        requiredParams: "mobile_number",
        optionalParams: "reason, direction (inbound|both)",
        description:
          "Adds a phone number to the organization's telephony blocklist.",
      },
      {
        name: "Unblock Number",
        method: "POST",
        path: "/api/unblock_number",
        auth: "Header: authcode",
        requiredParams: "mobile_number",
        description:
          "Removes a previously blocked phone number and restores normal call routing.",
      },
    ],
  },
  {
    id: "profile",
    title: "8) Account Signin & Profile Billing",
    summary:
      "Generate/rotate `authcode` tokens programmatically and verify account balance, channel concurrency, and DID validity (`Test Connection` uses `/api/profile_billing_v2`).",
    endpoints: [
      {
        name: "Account Signin",
        method: "POST",
        path: "/api_v2/signin",
        auth: "Body: email + password",
        requiredParams: "email, password",
        description:
          "Authenticates tenant credentials and returns active `authcode`, assigned DIDs, and plan metadata.",
      },
      {
        name: "Profile & Billing Health Check",
        method: "POST",
        path: "/api/profile_billing_v2",
        auth: "Header: authcode",
        requiredParams: "None (`{}`)",
        description:
          "Used by LMS CRM's `Test Connection` button — returns available voice credits, plan expiry, and active concurrent channels.",
      },
    ],
  },
  {
    id: "otp",
    title: "9) Voice OTP Verification",
    summary:
      "Deliver fallback 4–6 digit spoken OTP calls when student mobile numbers have DND SMS delays on application forms or landing pages.",
    endpoints: [
      {
        name: "OTP On Call",
        method: "GET",
        path: "/api/otp_on_call_v2",
        auth: "Query: ?authcode=",
        requiredParams: "authcode, mobile, otp (4-8 digits)",
        optionalParams: "caller_id, language (en|hi), repeat (1|2)",
        description:
          "Places an automated TTS voice call reading out `otp` twice with instant hangup confirmation.",
      },
    ],
  },
]

export default function IvrSettingsPage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [origin, setOrigin] = React.useState("")
  const [form, setForm] = React.useState({
    provider: "telephony",
    base_url: "https://ivr.smartping.live",
    authcode: "",
    api_key: "",
    api_secret: "",
    default_deskphone: "",
    caller_id: "",
    welcome_audio: "",
    status: true,
  })

  const [showNotes, setShowNotes] = React.useState(false)
  const [notesTab, setNotesTab] = React.useState<
    "endpoints" | "payloads" | "webhooks" | "errors"
  >("endpoints")
  const [endpointSearch, setEndpointSearch] = React.useState("")

  React.useEffect(() => {
    setOrigin(window.location.origin)
    fetch("/api/settings-integrations?section=ivr")
      .then((r) => r.json())
      .then((d) => {
        if (d.ivr) {
          setForm({
            provider: d.ivr.provider || "telephony",
            base_url: d.ivr.base_url || "https://ivr.smartping.live",
            authcode: d.ivr.authcode || "",
            api_key: d.ivr.api_key || "",
            api_secret: d.ivr.api_secret || "",
            default_deskphone: d.ivr.default_deskphone || "",
            caller_id: d.ivr.caller_id || "",
            welcome_audio: d.ivr.welcome_audio || "",
            status: Number(d.ivr.status ?? 1) === 1,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const cleanBaseUrl = (form.base_url || "https://ivr.smartping.live").replace(
    /\/+$/,
    ""
  )
  const displayAuth = form.authcode || "<YOUR_AUTHCODE>"
  const cdrWebhookUrl = `${origin || "https://crm.domain.com"}/api/ivr-call`

  const filteredCategories = React.useMemo(() => {
    const q = endpointSearch.trim().toLowerCase()
    if (!q) return IVR_API_CATEGORIES
    return IVR_API_CATEGORIES.map((cat) => ({
      ...cat,
      endpoints: cat.endpoints.filter(
        (ep) =>
          ep.name.toLowerCase().includes(q) ||
          ep.path.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.requiredParams.toLowerCase().includes(q) ||
          cat.title.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.endpoints.length > 0)
  }, [endpointSearch])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "ivr",
          ...form,
          status: form.status ? 1 : 0,
        }),
      })
      const out = await res.json()
      if (res.ok) {
        toast.success(out.message || "IVR settings updated!")
      } else {
        toast.error(out.error || "Failed to save IVR settings")
      }
    } finally {
      setSaving(false)
    }
  }

  async function testIvr() {
    if (!form.base_url.trim() || !form.authcode.trim()) {
      toast.warning("Base URL and Authcode are required for testing.")
      return
    }
    setTesting(true)
    try {
      const res = await fetch("/api/settings-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "ivr",
          action: "test",
          base_url: form.base_url,
          authcode: form.authcode,
        }),
      })
      const out = await res.json()
      if (res.ok) {
        toast.success(out.message || "Cloud Telephony connection verified!")
      } else {
        toast.error(out.error || "Connection test failed")
      }
    } finally {
      setTesting(false)
    }
  }

  function copyText(value: string, label = "Copied to clipboard") {
    navigator.clipboard?.writeText(value)
    toast.success(label)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-[460px] w-full rounded-lg lg:col-span-5" />
          <Skeleton className="h-[460px] w-full rounded-lg lg:col-span-7" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="IVR Settings" />

      <div className="grid grid-cols-1 gap-6 text-xs lg:grid-cols-12">
        {/* Left Info & Quick Integration Architecture Column */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-3.5 p-5 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="flex items-center gap-2 text-base font-bold">
                  <PhoneCall className="size-4 text-[#405189]" />
                  IVR & Cloud Telephony
                </h4>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Configure your organization-wise Cloud Telephony credentials
                  for Click-to-Call bridging, Automated Raw-Lead OBD IVR
                  qualification, Call Recordings (CDR), and Counsellor Queue
                  routing.
                </p>
              </div>
              <Badge
                className={
                  form.status
                    ? "bg-emerald-100 text-[10px] font-semibold text-emerald-700"
                    : "bg-slate-100 text-[10px] text-slate-600"
                }
              >
                {form.status ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2 rounded-md border border-[#299cdb]/30 bg-[#299cdb]/5 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#299cdb]">
                  Active Provider Endpoint Summary
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  REST v2 (`authcode`)
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2.5 py-1.5">
                  <span className="text-muted-foreground">Base URL:</span>
                  <code className="truncate font-mono font-semibold">
                    {cleanBaseUrl}
                  </code>
                </div>
                <div className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2.5 py-1.5">
                  <span className="text-muted-foreground">Auth Header:</span>
                  <code className="font-mono">
                    authcode:{" "}
                    {form.authcode
                      ? `${form.authcode.slice(0, 6)}••••`
                      : "(not set)"}
                  </code>
                </div>
                <div className="rounded border border-border bg-background px-2.5 py-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-muted-foreground">
                      CRM CDR / DTMF Callback URL:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(cdrWebhookUrl, "CDR Callback URL copied!")
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#405189] hover:underline"
                    >
                      <Copy className="size-3" /> Copy
                    </button>
                  </div>
                  <code className="block break-all font-mono text-[10.5px]">
                    {cdrWebhookUrl}
                  </code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  Supported Cloud Telephony Modules (9 Suites · 24 Endpoints)
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {IVR_API_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setNotesTab("endpoints")
                      setEndpointSearch(cat.title.split(")")[1]?.trim() || "")
                      setShowNotes(true)
                    }}
                    className="flex items-center justify-between rounded border border-border bg-muted/20 px-2.5 py-1.5 text-left text-[11px] transition hover:border-[#405189]/40 hover:bg-muted/50"
                  >
                    <span className="truncate font-medium">{cat.title}</span>
                    <Badge variant="secondary" className="ml-1.5 text-[10px]">
                      {cat.endpoints.length}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEndpointSearch("")
                setShowNotes(true)
              }}
              className="w-full border-[#299cdb]/40 text-[#299cdb] hover:bg-[#299cdb]/10"
            >
              <BookOpen className="mr-1.5 size-3.5" />
              Open Full Cloud Telephony API Documentation & Payloads
            </Button>
          </Card>
        </div>

        {/* Right Form Card (1:1 with df-laravel-crm ivr/form.blade.php) */}
        <Card className="p-6 shadow-xs lg:col-span-7">
          <form onSubmit={save} className="space-y-4">
            <div className="border-b border-border pb-3">
              <h5 className="text-sm font-bold">
                Organization IVR Credentials
              </h5>
              <p className="text-[11px] text-muted-foreground">
                Stored per organization in <code>ivr_settings</code>. Always
                save <code>Base URL</code> and <code>Authcode</code> before
                triggering Click-to-Call or OBD blasts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  Provider (Optional)
                </Label>
                <Input
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                  placeholder="ex: telephony / smartping / myoperator"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <FormSelect
                  value={form.status ? "1" : "0"}
                  onValueChange={(v) => setForm({ ...form, status: v === "1" })}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">
                  Base URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.base_url}
                  onChange={(e) =>
                    setForm({ ...form, base_url: e.target.value })
                  }
                  placeholder="https://ivr.smartping.live"
                  className="h-9 font-mono text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">
                  Authcode <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.authcode}
                  onChange={(e) =>
                    setForm({ ...form, authcode: e.target.value })
                  }
                  placeholder="Unique cloud telephony authcode header token"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Default Deskphone (Optional)
                </Label>
                <Input
                  value={form.default_deskphone}
                  onChange={(e) =>
                    setForm({ ...form, default_deskphone: e.target.value })
                  }
                  placeholder="0120xxxxxx"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Caller ID / Outbound DID (Optional)
                </Label>
                <Input
                  value={form.caller_id}
                  onChange={(e) =>
                    setForm({ ...form, caller_id: e.target.value })
                  }
                  placeholder="0120xxxxxx"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">API Key (Optional)</Label>
                <Input
                  value={form.api_key}
                  onChange={(e) =>
                    setForm({ ...form, api_key: e.target.value })
                  }
                  placeholder="Optional secondary API key"
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  Welcome Audio File / ID (Optional)
                </Label>
                <Input
                  value={form.welcome_audio}
                  onChange={(e) =>
                    setForm({ ...form, welcome_audio: e.target.value })
                  }
                  placeholder="welcome_prompt_v1.wav"
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={testing}
                onClick={testIvr}
              >
                <PlugZap className="mr-1.5 size-3.5" />
                {testing ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEndpointSearch("")
                  setShowNotes(true)
                }}
                className="bg-[#299cdb] text-white hover:bg-[#2389c2]"
              >
                📌 API Notes
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Detailed Cloud Telephony API Notes Modal */}
      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-[#299cdb]" />
              Cloud Telephony & IVR Integration Reference (v2 Specification)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete endpoint specification, authentication headers, JSON/cURL
              request &amp; response payloads, and inbound CDR/DTMF webhook
              contracts for <code>{cleanBaseUrl}</code>.
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-2.5 text-xs">
            {[
              {
                id: "endpoints",
                label: "1. All 9 Endpoint Suites (24 APIs)",
                icon: BookOpen,
              },
              {
                id: "payloads",
                label: "2. Request / Response Payloads & cURL",
                icon: PlugZap,
              },
              {
                id: "webhooks",
                label: "3. Inbound CDR & DTMF Webhooks",
                icon: Webhook,
              },
              {
                id: "errors",
                label: "4. Auth, Formats & Status Codes",
                icon: ShieldCheck,
              },
            ].map((t) => {
              const Icon = t.icon
              const active = notesTab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setNotesTab(
                      t.id as "endpoints" | "payloads" | "webhooks" | "errors"
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-semibold transition ${
                    active
                      ? "bg-[#405189] text-white"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* TAB 1: ALL 9 ENDPOINT CATEGORIES */}
          {notesTab === "endpoints" && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3">
                <div className="space-y-0.5">
                  <div>
                    <strong>Base URL:</strong>{" "}
                    <code className="rounded bg-background px-1.5 py-0.5 font-mono">
                      {cleanBaseUrl}
                    </code>
                  </div>
                  <div>
                    <strong>Default Auth:</strong>{" "}
                    <code className="rounded bg-background px-1.5 py-0.5 font-mono">
                      Header → authcode: {displayAuth}
                    </code>{" "}
                    <span className="text-muted-foreground">
                      (GET endpoints pass <code>?authcode=...</code> in query
                      string)
                    </span>
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    value={endpointSearch}
                    onChange={(e) => setEndpointSearch(e.target.value)}
                    placeholder="Filter endpoints, e.g. click_to_call..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <div className="border-b border-border bg-muted/40 px-3.5 py-2.5">
                      <h5 className="font-bold text-foreground">{cat.title}</h5>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {cat.summary}
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {cat.endpoints.map((ep) => (
                        <div
                          key={`${cat.id}-${ep.name}-${ep.path}`}
                          className="space-y-1.5 p-3 hover:bg-muted/15"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                className={
                                  ep.method.startsWith("GET")
                                    ? "bg-sky-100 font-mono text-[10px] text-sky-700"
                                    : "bg-emerald-100 font-mono text-[10px] text-emerald-700"
                                }
                              >
                                {ep.method}
                              </Badge>
                              <span className="font-semibold">{ep.name}</span>
                              <code className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-[#405189]">
                                {ep.path}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {ep.auth}
                              </span>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  copyText(
                                    `${cleanBaseUrl}${ep.path}`,
                                    `Copied ${ep.path}`
                                  )
                                }
                                className="h-6 text-[10px]"
                              >
                                <Copy className="mr-1 size-2.5" /> Copy URL
                              </Button>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {ep.description}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            <span>
                              <strong className="text-foreground">
                                Required:
                              </strong>{" "}
                              <code className="font-mono">
                                {ep.requiredParams}
                              </code>
                            </span>
                            {ep.optionalParams && (
                              <span className="text-muted-foreground">
                                <strong>Optional:</strong>{" "}
                                <code className="font-mono">
                                  {ep.optionalParams}
                                </code>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REQUEST / RESPONSE PAYLOADS & CURL */}
          {notesTab === "payloads" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-lg border border-border p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="font-bold">
                    A) Outgoing Click-to-Call Bridge (`GET /api/click_to_call_v2`)
                  </h5>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      copyText(
                        `curl -X GET "${cleanBaseUrl}/api/click_to_call_v2?authcode=${displayAuth}&agent_number=9876543210&customer_number=9811223344&caller_id=${form.caller_id || "01204567890"}&ref_id=lead_1042"`,
                        "Click-to-Call cURL copied!"
                      )
                    }
                  >
                    <Copy className="mr-1 size-3" /> Copy cURL
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[11px] text-slate-100">
{`# Request (GET)
GET ${cleanBaseUrl}/api/click_to_call_v2?authcode=${displayAuth}&agent_number=9876543210&customer_number=9811223344&caller_id=${form.caller_id || "01204567890"}&ref_id=lead_1042

# Successful Response (200 OK)
{
  "status": "success",
  "call_id": "cdr_20261027_884920",
  "message": "Call initiated to agent 9876543210; customer 9811223344 will bridge on pickup.",
  "caller_id": "${form.caller_id || "01204567890"}",
  "ref_id": "lead_1042"
}`}
                </pre>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="font-bold">
                    B) Automated Raw-Lead OBD IVR Blast (`POST /api/create_obd_campaign_v2`)
                  </h5>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      copyText(
                        `curl -X POST "${cleanBaseUrl}/api/create_obd_campaign_v2" -H "authcode: ${displayAuth}" -F "campaign_name=Admission_Qualification_Batch_1" -F "caller_id=${form.caller_id || "01204567890"}" -F "dtmf_enabled=1" -F "numbers=9811223344,9822334455" -F "audio_file=@welcome_admission.wav"`,
                        "OBD Campaign cURL copied!"
                      )
                    }
                  >
                    <Copy className="mr-1 size-3" /> Copy cURL
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[11px] text-slate-100">
{`# Request (POST multipart/form-data)
POST ${cleanBaseUrl}/api/create_obd_campaign_v2
Headers:
  authcode: ${displayAuth}
Form-Data:
  campaign_name: "Admission_Qualification_Batch_1"
  caller_id: "${form.caller_id || "01204567890"}"
  dtmf_enabled: "1"               # Captures student keypress (1 = Interested, 2 = Not Interested)
  retry_count: "2"
  numbers: "9811223344,9822334455"
  audio_file: @welcome_admission.wav

# Successful Response (200 OK)
{
  "status": "success",
  "campaign_id": "obd_99412",
  "queued_numbers": 2,
  "estimated_credits": 2
}`}
                </pre>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <h5 className="mb-2 font-bold">
                  C) Fetch Call Logs / CDRs (`POST /api/call_list_v2`) & Connection Test (`POST /api/profile_billing_v2`)
                </h5>
                <pre className="overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[11px] text-slate-100">
{`# 1. Fetch CDR Call Logs
POST ${cleanBaseUrl}/api/call_list_v2
Headers: { "authcode": "${displayAuth}", "Content-Type": "application/json" }
Body:
{
  "from_date": "2026-10-01 00:00:00",
  "to_date": "2026-10-27 23:59:59",
  "call_type": "all",
  "page": 1,
  "limit": 50
}

# Response:
{
  "status": "success",
  "total": 128,
  "data": [
    {
      "call_id": "cdr_20261027_884920",
      "caller_number": "9811223344",
      "agent_number": "9876543210",
      "did_number": "${form.caller_id || "01204567890"}",
      "direction": "outbound",
      "disposition": "ANSWERED",
      "duration": 142,
      "dtmf": "1",
      "recording_url": "https://cdn.telephony.example/rec/cdr_20261027_884920.mp3",
      "start_time": "2026-10-27 11:18:04"
    }
  ]
}

# 2. Test Connection / Profile Billing (used by "Test Connection" button)
POST ${cleanBaseUrl}/api/profile_billing_v2
Headers: { "authcode": "${displayAuth}" }
Response: { "status": "success", "balance_credits": 14850, "concurrent_channels": 30, "plan_status": "ACTIVE" }`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: INBOUND CDR & DTMF WEBHOOKS */}
          {notesTab === "webhooks" && (
            <div className="space-y-4 text-xs">
              <div className="rounded-md border border-[#299cdb]/30 bg-[#299cdb]/10 p-3.5">
                <div className="flex items-center justify-between">
                  <strong className="text-[#299cdb]">
                    Configure This Post-Call CDR Webhook in Your Provider Panel
                  </strong>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => copyText(cdrWebhookUrl, "Webhook URL copied!")}
                  >
                    <Copy className="mr-1 size-3" /> Copy URL
                  </Button>
                </div>
                <code className="mt-1.5 block rounded border border-border bg-background p-2 font-mono text-[11px]">
                  POST {cdrWebhookUrl}
                </code>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  When a call ends (inbound, Click-to-Call, or OBD broadcast),
                  your telephony provider sends a JSON <code>POST</code> to this
                  endpoint. LMS CRM automatically logs the call in{" "}
                  <code>ivr_logs</code> &amp; <code>lead_calls</code>, attaches
                  the MP3 recording to the Lead Timeline, and updates Raw Data
                  DTMF qualification status.
                </p>
              </div>

              <div className="rounded-lg border border-border p-3.5">
                <h5 className="mb-2 font-bold">
                  Expected Inbound CDR / DTMF Webhook Payload
                </h5>
                <pre className="overflow-x-auto rounded bg-slate-950 p-3 font-mono text-[11px] text-slate-100">
{`{
  "call_id": "cdr_20261027_884920",
  "organization_id": 1,
  "caller_number": "9811223344",
  "agent_number": "9876543210",
  "did_number": "${form.caller_id || "01204567890"}",
  "direction": "outbound",         // "inbound" | "outbound" | "obd"
  "status": "ANSWERED",            // "ANSWERED" | "NO_ANSWER" | "BUSY" | "FAILED"
  "duration": 96,                  // Total billable seconds
  "dtmf": "1",                     // Key pressed by student (VarChar(10))
  "recording_url": "https://cdn.telephony.example/rec/cdr_20261027_884920.mp3",
  "ref_id": "lead_1042"
}`}
                </pre>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="font-bold text-emerald-800">
                    DTMF `1` — Interested / Verified
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Marks Raw Data row as <code>Verified</code>, boosts Lead
                    Score, and routes student to active Lead Distribution Rule.
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3">
                  <div className="font-bold text-amber-800">
                    DTMF `2` — Not Interested
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700">
                    Marks Raw Data row as <code>Unverified</code> /{" "}
                    <code>Cold</code> and suppresses further automated OBD
                    retries.
                  </p>
                </div>
                <div className="rounded-md border border-sky-200 bg-sky-50/60 p-3">
                  <div className="font-bold text-sky-800">
                    DTMF `0` / `9` — Live Counsellor
                  </div>
                  <p className="mt-1 text-[11px] text-sky-700">
                    Transfers live call directly into the configured{" "}
                    <code>Default Deskphone</code> or Admissions Call Group.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTH, NUMBER FORMATS & STATUS CODES */}
          {notesTab === "errors" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-lg border border-border p-3.5">
                  <h5 className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Authentication & Header Rules
                  </h5>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                    <li>
                      All <code>POST</code> v2 endpoints require HTTP header{" "}
                      <code>authcode: &lt;authcode&gt;</code>.
                    </li>
                    <li>
                      <code>GET</code> endpoints (<code>click_to_call_v2</code>,{" "}
                      <code>live_call_v2</code>, <code>otp_on_call_v2</code>)
                      accept <code>?authcode=&lt;authcode&gt;</code> in the URL.
                    </li>
                    <li>
                      Strip trailing slashes from <code>base_url</code> (CRM
                      normalizes this automatically on save).
                    </li>
                    <li>
                      OBD audio uploads must be <strong>8000 Hz, 16-bit Mono WAV</strong>{" "}
                      or <strong>128 kbps MP3</strong> under 5 MB.
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5 rounded-lg border border-border p-3.5">
                  <h5 className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Phone & DID Formatting Standards
                  </h5>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                    <li>
                      <strong>Student / Agent Mobile:</strong> Pass 10-digit
                      Indian mobile (<code>9811223344</code>) or E.164 without{" "}
                      <code>+</code> (<code>919811223344</code>).
                    </li>
                    <li>
                      <strong>Caller ID / Virtual DID:</strong> Landline/PRI DID
                      with STD prefix (e.g., <code>01204567890</code> or{" "}
                      <code>08045678900</code>).
                    </li>
                    <li>
                      <strong>Default Deskphone:</strong> Fallback hunt number
                      used when an agent has no extension mapped.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 font-semibold">HTTP / Code</th>
                      <th className="px-3 py-2 font-semibold">Meaning</th>
                      <th className="px-3 py-2 font-semibold">
                        Resolution in LMS CRM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-2 font-mono font-semibold text-emerald-700">
                        200 OK
                      </td>
                      <td className="px-3 py-2">Request accepted</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        Inspect JSON <code>status === &quot;success&quot;</code>{" "}
                        and store <code>call_id</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-semibold text-amber-700">
                        401 / 403
                      </td>
                      <td className="px-3 py-2">
                        Invalid <code>authcode</code> or IP not whitelisted
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        Regenerate token via <code>/api_v2/signin</code> or
                        whitelist server IP in telephony panel.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-semibold text-amber-700">
                        422 Unprocessable
                      </td>
                      <td className="px-3 py-2">
                        Invalid DID / unverified agent mobile / DND block
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        Verify <code>Caller ID</code> belongs to active trunk
                        and agent exists in <code>/api/getmemberlist_V2</code>.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-semibold text-rose-700">
                        429 / 503
                      </td>
                      <td className="px-3 py-2">
                        Concurrent channel limit reached
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        Throttle OBD batch concurrency or upgrade PRI/SIP
                        channels via <code>/api/profile_billing_v2</code>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowNotes(false)}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Close API Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
