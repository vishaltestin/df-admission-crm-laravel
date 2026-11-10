"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { FormSelect } from "@/components/ui/form-select"

export default function SmsSettingsPage() {
  const [form, setForm] = React.useState({
    provider: "",
    provider_url: "https://api.msg91.com/api/v2/sendsms",
    api_key: "",
    sender_id: "ADTUUN",
    route: "transactional",
    status: true,
  })
  const [testPhone, setTestPhone] = React.useState("9876543210")

  React.useEffect(() => {
    fetch("/api/settings-integrations?type=sms")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings
          setForm({
            provider: s.provider || "",
            provider_url:
              s.provider_url || "https://api.msg91.com/api/v2/sendsms",
            api_key: s.api_key || "",
            sender_id: s.sender_id || "ADTUUN",
            route: s.route || "transactional",
            status: Boolean(s.status ?? true),
          })
        }
      })
  }, [])

  return (
    <div>
      <BreadcrumbBar parent="Settings" title="SMS Gateway Settings" />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        {/* Left 4 Columns: DLT & Gateway Parameter Reference */}
        <Card className="h-fit space-y-3 p-5 shadow-xs lg:col-span-4">
          <h4 className="border-b border-border pb-2 text-sm font-bold text-[#405189]">
            DLT & SMS Gateway Notes
          </h4>
          <p className="text-muted-foreground">
            Ensure your 6-character alphabetic <strong>Sender ID</strong> and message templates are registered on your TRAI DLT portal (Jio / Airtel / Vi / BSNL).
          </p>
          <div className="space-y-1.5 rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px]">
            <div>
              <strong>sender</strong> = <span>{form.sender_id || "ADTUUN"}</span>
            </div>
            <div>
              <strong>route</strong> = <span>{form.route}</span>
            </div>
            <div>
              <strong>mobiles</strong> = <span>91XXXXXXXXXX</span>
            </div>
            <div>
              <strong>authkey</strong> = <span>••••••••</span>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <Label className="block text-xs font-semibold">
              Send Test DLT SMS
            </Label>
            <Input
              placeholder="10-digit Mobile"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="h-8 font-mono text-xs"
            />
            <Button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/settings-integrations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: "sms",
                    action: "test_sms",
                    phone: testPhone,
                  }),
                })
                const out = await res.json()
                if (res.ok) toast.success(out.message || "Test SMS sent!")
              }}
              className="w-full bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              Send Test SMS
            </Button>
          </div>
        </Card>

        {/* Right 8 Columns: SMS Gateway Credentials */}
        <Card className="p-5 shadow-xs lg:col-span-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "sms", ...form }),
              })
              if (res.ok) toast.success("SMS gateway settings saved!")
            }}
            className="space-y-4"
          >
            <h4 className="border-b border-border pb-2 text-sm font-bold">
              SMS Gateway Configuration
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  Provider (Optional)
                </Label>
                <FormSelect
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select / Custom Gateway</option>
                  <option value="msg91">MSG91</option>
                  <option value="textlocal">TextLocal</option>
                  <option value="fast2sms">Fast2SMS</option>
                  <option value="gupshup">Gupshup Enterprise</option>
                  <option value="twilio">Twilio SMS</option>
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs">SMS Route *</Label>
                <FormSelect
                  value={form.route}
                  onChange={(e) => setForm({ ...form, route: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="transactional">Transactional (Route 4)</option>
                  <option value="otp">OTP Priority</option>
                  <option value="promotional">Promotional (Route 1)</option>
                </FormSelect>
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">
                  Provider API Endpoint URL *
                </Label>
                <Input
                  required
                  placeholder="https://api.msg91.com/api/v2/sendsms"
                  value={form.provider_url}
                  onChange={(e) =>
                    setForm({ ...form, provider_url: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  API Key / Auth Token *
                </Label>
                <Input
                  type="password"
                  required
                  value={form.api_key}
                  onChange={(e) =>
                    setForm({ ...form, api_key: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  DLT Sender ID (6 Characters) *
                </Label>
                <Input
                  required
                  maxLength={11}
                  placeholder="ADTUUN"
                  value={form.sender_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sender_id: e.target.value.toUpperCase(),
                    })
                  }
                  className="h-9 font-mono uppercase text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
              <Switch
                id="sms-status"
                checked={form.status}
                onCheckedChange={(v) => setForm({ ...form, status: v })}
              />
              <Label htmlFor="sms-status" className="cursor-pointer text-xs">
                Enable SMS Gateway Active Status
              </Label>
            </div>

            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Save SMS Settings
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
