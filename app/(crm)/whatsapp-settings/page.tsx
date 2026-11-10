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

export default function WhatsappSettingsPage() {
  const [form, setForm] = React.useState({
    provider: "",
    provider_url: "https://www.digitalfueled.in/api/whatsapp.php",
    username: "",
    password: "",
    status: true,
  })
  const [testPhone, setTestPhone] = React.useState("9876543210")

  React.useEffect(() => {
    fetch("/api/settings-integrations?type=whatsapp")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings
          setForm({
            provider: s.provider || "",
            provider_url:
              s.provider_url || "https://www.digitalfueled.in/api/whatsapp.php",
            username: s.username || "",
            password: s.password || "",
            status: Boolean(s.status ?? true),
          })
        }
      })
  }, [])

  return (
    <div>
      <BreadcrumbBar parent="Settings" title="WhatsApp API Settings" />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        {/* Left 4 Columns: df-laravel-crm API Parameter Reference Card */}
        <Card className="h-fit space-y-3 p-5 shadow-xs lg:col-span-4">
          <h4 className="border-b border-border pb-2 text-sm font-bold text-[#0ab39c]">
            WhatsApp HTTP API Reference
          </h4>
          <p className="text-muted-foreground">
            Your CRM dispatches outbound WhatsApp messages & OTPs using these standard gateway query parameters:
          </p>
          <div className="space-y-1.5 rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px]">
            <div>
              <strong>user</strong> = <span>{form.username || "df001#"}</span>
            </div>
            <div>
              <strong>pass</strong> = <span>••••••••</span>
            </div>
            <div>
              <strong>sender</strong> = <span>WhatsApp Business ID</span>
            </div>
            <div>
              <strong>phone</strong> = <span>10-digit Lead Mobile</span>
            </div>
            <div>
              <strong>text</strong> = <span>URL-encoded Template Body</span>
            </div>
            <div>
              <strong>priority</strong> = <span>wa</span>
            </div>
            <div>
              <strong>stype</strong> = <span>normal</span>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <Label className="block text-xs font-semibold">
              Send Test WhatsApp Message
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
                    type: "whatsapp",
                    action: "test_whatsapp",
                    phone: testPhone,
                  }),
                })
                const out = await res.json()
                if (res.ok)
                  toast.success(out.message || "Test WhatsApp message sent!")
              }}
              className="w-full bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              Send Test WhatsApp
            </Button>
          </div>
        </Card>

        {/* Right 8 Columns: Gateway Credentials Form */}
        <Card className="p-5 shadow-xs lg:col-span-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "whatsapp", ...form }),
              })
              if (res.ok) toast.success("WhatsApp gateway settings saved!")
            }}
            className="space-y-4"
          >
            <h4 className="border-b border-border pb-2 text-sm font-bold">
              WhatsApp Gateway Credentials
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
                  <option value="">DigitalFueled WhatsApp Gateway</option>
                  <option value="meta_cloud">Meta WhatsApp Cloud API</option>
                  <option value="wati">WATI</option>
                  <option value="interakt">Interakt</option>
                  <option value="aisensy">AiSensy</option>
                  <option value="custom">Custom HTTP Gateway</option>
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  API Provider Endpoint URL *
                </Label>
                <Input
                  required
                  placeholder="https://www.digitalfueled.in/api/whatsapp.php"
                  value={form.provider_url}
                  onChange={(e) =>
                    setForm({ ...form, provider_url: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  API Username / Account ID *
                </Label>
                <Input
                  required
                  placeholder="df001#"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">
                  API Password / Auth Token *
                </Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-3">
              <Switch
                id="wa-status"
                checked={form.status}
                onCheckedChange={(v) => setForm({ ...form, status: v })}
              />
              <Label htmlFor="wa-status" className="cursor-pointer text-xs">
                Enable WhatsApp Gateway Active Status
              </Label>
            </div>

            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Save WhatsApp Settings
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
