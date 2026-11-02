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

export function LeadIntegrationPanel({
  provider,
  title,
  description,
  fields,
}: {
  provider: "facebook" | "instagram" | "google"
  title: string
  description: string
  fields: { key: string; label: string; type?: string }[]
}) {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [creds, setCreds] = React.useState<Record<string, string>>({})
  const [origin, setOrigin] = React.useState("")
  const [lastResult, setLastResult] = React.useState<string>("")

  React.useEffect(() => {
    setOrigin(window.location.origin)
    fetch(`/api/settings-integrations?section=${provider}`)
      .then((r) => r.json())
      .then((d) => {
        setIsEnabled(Boolean(d.is_enabled))
        setCreds(d.credentials || {})
      })
  }, [provider])

  const webhookUrl = `${origin || "https://crm.domain.com"}/api/webhook/${provider}`
  const isMeta = provider === "facebook" || provider === "instagram"

  async function testHandshake() {
    const token = creds.verify_token || "df_crm_verify"
    const challenge = `CHALLENGE_${Math.floor(100000 + Math.random() * 900000)}`
    const res = await fetch(
      `/api/webhook/${provider}?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(
        token
      )}&hub.challenge=${challenge}`
    )
    const text = await res.text()
    if (res.ok && text === challenge) {
      setLastResult(`✓ GET hub.challenge handshake verified (${text})`)
      toast.success("Meta GET hub.challenge verification passed!")
    } else {
      setLastResult(`✕ Handshake failed (${res.status}): Save credentials first or check verify_token`)
      toast.error("Verify token mismatch — save your Verify Token first!")
    }
  }

  async function simulateRealPayload() {
    const randMobile = `98${Math.floor(10000000 + Math.random() * 89999999)}`
    const payload = isMeta
      ? {
          object: "page",
          entry: [
            {
              id: "1029384756",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "leadgen",
                  value: {
                    leadgen_id: `lg_${Date.now()}`,
                    form_id: "wf_meta_2026",
                    field_data: [
                      {
                        name: "full_name",
                        values: [`${provider.toUpperCase()} Lead Prospect`],
                      },
                      { name: "phone_number", values: [randMobile] },
                      {
                        name: "email",
                        values: [`${provider}.${randMobile.slice(-4)}@student.in`],
                      },
                      { name: "city", values: ["Guwahati"] },
                    ],
                  },
                },
              ],
            },
          ],
        }
      : {
          lead_id: `gleads_${Date.now()}`,
          google_key: creds.webhook_key || creds.verify_token || "google_secret",
          campaign_id: 202601,
          user_column_data: [
            {
              column_id: "FULL_NAME",
              string_value: "Google Search Ad Applicant",
            },
            { column_id: "PHONE_NUMBER", string_value: randMobile },
            {
              column_id: "EMAIL",
              string_value: `google.${randMobile.slice(-4)}@student.in`,
            },
            { column_id: "CITY", string_value: "Delhi" },
          ],
        }

    const res = await fetch(`/api/webhook/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const out = await res.json()
    if (res.ok) {
      setLastResult(
        `✓ Lead #${out.lead_id} ingested (${randMobile}) & logged to lead_webhook_logs`
      )
      toast.success(
        `${provider.toUpperCase()} Lead #${out.lead_id} created in CRM!`
      )
    } else {
      toast.error(out.error || "Webhook simulation failed")
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Lead Integrations" title={title} />
      <div className="grid grid-cols-1 gap-6 text-xs lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-3 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">{title}</h4>
              <Badge
                className={
                  isEnabled
                    ? "bg-emerald-100 text-[10px] text-emerald-700"
                    : "bg-slate-100 text-[10px] text-slate-600"
                }
              >
                {isEnabled ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {description}
            </p>

            <div className="space-y-2 rounded-md border border-[#299cdb]/30 bg-[#299cdb]/10 p-3.5">
              <div className="flex items-center justify-between">
                <strong className="text-[#299cdb]">
                  Public Webhook Callback URL
                </strong>
                <span className="font-mono text-[10px] text-muted-foreground">
                  GET + POST (No CSRF Block)
                </span>
              </div>
              <code className="block break-all rounded border border-border bg-background p-2 font-mono text-[11px]">
                {webhookUrl}
              </code>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    navigator.clipboard?.writeText(webhookUrl)
                    toast.success("Webhook URL copied!")
                  }}
                >
                  Copy URL
                </Button>
                {isMeta && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={testHandshake}
                  >
                    Test GET Handshake
                  </Button>
                )}
                <Button
                  type="button"
                  size="xs"
                  onClick={simulateRealPayload}
                  className="bg-[#0ab39c] text-white hover:bg-[#099885]"
                >
                  Simulate Live {provider.toUpperCase()} Lead
                </Button>
              </div>
              {lastResult && (
                <div className="rounded bg-background/90 px-2.5 py-1.5 font-mono text-[11px] text-emerald-700">
                  {lastResult}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button asChild size="xs" variant="outline">
                <Link href="/logs">View Webhook Logs →</Link>
              </Button>
              <Button asChild size="xs" variant="outline">
                <Link href="/leads">Open Leads Manager →</Link>
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-5 shadow-xs lg:col-span-7">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  section: provider,
                  is_enabled: isEnabled,
                  credentials: creds,
                }),
              })
              if (res.ok) toast.success(`${title} credentials saved!`)
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h5 className="text-sm font-bold capitalize">
                  {provider} API & Webhook Credentials
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Stored per-organization in <code>lead_integrations</code> &{" "}
                  <code>lead_integration_credentials</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id={`enable-${provider}`}
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label
                  htmlFor={`enable-${provider}`}
                  className="cursor-pointer text-xs font-semibold"
                >
                  Enable {provider.toUpperCase()}
                </Label>
              </div>
            </div>

            {fields.map((f) => (
              <div key={f.key}>
                <Label className="mb-1 block text-xs">{f.label}</Label>
                <Input
                  type={f.type || "text"}
                  value={creds[f.key] || ""}
                  onChange={(e) =>
                    setCreds({ ...creds, [f.key]: e.target.value })
                  }
                  placeholder={`Enter ${f.label.toLowerCase()}...`}
                  className="h-9 font-mono text-xs"
                />
              </div>
            ))}

            <Button
              type="submit"
              className="bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              Save {title}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
