"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const IVR_ENDPOINTS = [
  { method: "POST", path: "/click-to-call", desc: "Bridge counsellor deskphone with lead mobile" },
  { method: "POST", path: "/outbound-ivr", desc: "Trigger automated DTMF verification call (Press 1 / 2)" },
  { method: "GET", path: "/call-logs", desc: "Fetch paginated CDR call detail records" },
  { method: "GET", path: "/recording/{call_id}", desc: "Retrieve MP3/WAV call recording URL" },
  { method: "POST", path: "/agent/status", desc: "Toggle counsellor telephony availability" },
  { method: "GET", path: "/deskphones", desc: "List active virtual DID / deskphone numbers" },
  { method: "POST", path: "/audio/upload", desc: "Upload welcome / IVR prompt WAV audio" },
  { method: "POST", path: "/webhook/cdr", desc: "Inbound webhook callback for call completion" },
  { method: "GET", path: "/health", desc: "Verify IVR authcode & SIP trunk connectivity" },
]

export default function IvrSettingsPage() {
  const [form, setForm] = React.useState({
    provider: "",
    base_url: "https://ivr.smartping.live/api/v1",
    authcode: "",
    api_key: "",
    default_deskphone: "",
    caller_id: "",
    welcome_audio: "",
    status: true,
  })
  const [showNotes, setShowNotes] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/settings-integrations?type=ivr")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings
          setForm({
            provider: s.provider || "",
            base_url: s.base_url || "https://ivr.smartping.live/api/v1",
            authcode: s.authcode || "",
            api_key: s.api_key || "",
            default_deskphone: s.default_deskphone || "",
            caller_id: s.caller_id || "",
            welcome_audio: s.welcome_audio || "",
            status: Boolean(s.status ?? true),
          })
        }
      })
  }, [])

  return (
    <div>
      <BreadcrumbBar parent="Settings" title="IVR & Cloud Telephony Settings" />

      <Card className="max-w-4xl p-5 text-xs shadow-xs">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await fetch("/api/settings-integrations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "ivr", ...form }),
            })
            if (res.ok) toast.success("IVR settings saved!")
          }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h4 className="text-sm font-bold">
                Cloud Telephony & Click-to-Call Configuration
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Used by Raw Leads Automated IVR Verification and Counsellor Click-to-Call.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowNotes(true)}
                className="h-8 text-xs"
              >
                📖 API Notes (9 Endpoints)
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  const res = await fetch("/api/settings-integrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      type: "ivr",
                      action: "test_connection",
                    }),
                  })
                  const out = await res.json()
                  if (res.ok)
                    toast.success(out.message || "IVR connection verified!")
                }}
                className="h-8 bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2389c2]"
              >
                🔌 Test Connection
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Provider (Optional)</Label>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="">SmartPing / Custom Telephony</option>
                <option value="smartping">SmartPing Enterprise</option>
                <option value="knowlarity">Knowlarity SuperReceptionist</option>
                <option value="exotel">Exotel Cloud Telephony</option>
                <option value="myoperator">MyOperator</option>
                <option value="ozonetel">Ozonetel CloudAgent</option>
              </select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">API Base URL *</Label>
              <Input
                required
                placeholder="https://ivr.smartping.live/api/v1"
                value={form.base_url}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Auth Code *</Label>
              <Input
                required
                placeholder="AUTH_XXXX"
                value={form.authcode}
                onChange={(e) => setForm({ ...form, authcode: e.target.value })}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">API Key / Secret</Label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">
                Default Deskphone / DID
              </Label>
              <Input
                placeholder="+911140001234"
                value={form.default_deskphone}
                onChange={(e) =>
                  setForm({ ...form, default_deskphone: e.target.value })
                }
                className="h-9 font-mono text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Outbound Caller ID</Label>
              <Input
                placeholder="08047100000"
                value={form.caller_id}
                onChange={(e) =>
                  setForm({ ...form, caller_id: e.target.value })
                }
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs">
                Welcome Audio File ID / URL
              </Label>
              <Input
                placeholder="welcome_admission_2026.wav"
                value={form.welcome_audio}
                onChange={(e) =>
                  setForm({ ...form, welcome_audio: e.target.value })
                }
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
            <Switch
              id="ivr-status"
              checked={form.status}
              onCheckedChange={(v) => setForm({ ...form, status: v })}
            />
            <Label htmlFor="ivr-status" className="cursor-pointer text-xs">
              Enable Outbound IVR & Click-to-Call Integration
            </Label>
          </div>

          <Button
            type="submit"
            className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            Save IVR Settings
          </Button>
        </form>
      </Card>

      <Dialog open={showNotes} onOpenChange={setShowNotes}>
        <DialogContent className="text-xs sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              IVR Telephony API Endpoint Reference
            </DialogTitle>
            <DialogDescription className="text-xs">
              Supported REST endpoints relative to your configured Base URL ({form.base_url}).
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border rounded-md border border-border">
            {IVR_ENDPOINTS.map((ep, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={`font-mono text-[10px] ${
                      ep.method === "POST"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#405189] text-white"
                    }`}
                  >
                    {ep.method}
                  </Badge>
                  <code className="font-mono font-semibold">{ep.path}</code>
                </div>
                <span className="text-right text-[11px] text-muted-foreground">
                  {ep.desc}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNotes(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
