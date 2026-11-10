"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
} from "lucide-react"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"

export interface IntegrationFieldSpec {
  key: string
  label: string
  placeholder?: string
  helperText?: string
  type?: "text" | "password"
  required?: boolean
  canGenerateToken?: boolean
  advanced?: boolean
}

export function LeadIntegrationPanel({
  provider,
  title,
  description,
  setupSteps,
  fields,
}: {
  provider: "facebook" | "instagram" | "google"
  title: string
  description: string
  setupSteps: string[]
  fields: IntegrationFieldSpec[]
}) {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [creds, setCreds] = React.useState<Record<string, string>>({})
  const [revealed, setRevealed] = React.useState<Record<string, boolean>>({})
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [origin, setOrigin] = React.useState("")
  const [lastResult, setLastResult] = React.useState<string>("")

  React.useEffect(() => {
    setOrigin(window.location.origin)
    setLoading(true)
    fetch(`/api/settings-integrations?section=${provider}`)
      .then((r) => r.json())
      .then((d) => {
        setIsEnabled(Boolean(d.is_enabled))
        const loadedCreds = (d.credentials || {}) as Record<string, string>
        // Normalize legacy `webhook_key` <-> `google_key` seamlessly
        if (
          provider === "google" &&
          !loadedCreds.google_key &&
          loadedCreds.webhook_key
        ) {
          loadedCreds.google_key = loadedCreds.webhook_key
        }
        setCreds(loadedCreds)
      })
      .finally(() => setLoading(false))
  }, [provider])

  const webhookUrl = `${origin || "https://crm.domain.com"}/api/webhook/${provider}`
  const isMeta = provider === "facebook" || provider === "instagram"

  const primaryFields = React.useMemo(
    () => fields.filter((f) => !f.advanced),
    [fields]
  )
  const advancedFields = React.useMemo(
    () => fields.filter((f) => f.advanced),
    [fields]
  )

  function generateRandomSecret(prefix: string) {
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    return `${prefix}_${rand}`
  }

  async function testHandshake() {
    const token = creds.verify_token || ""
    if (!token) {
      toast.warning(
        "Enter & save your Webhook Verify Token first, then run the handshake test."
      )
      return
    }
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
      setLastResult(
        `✕ Handshake failed (${res.status}): Save credentials first so verify_token matches DB`
      )
      toast.error(
        "Verify token mismatch — click Save first so the webhook endpoint knows your token!"
      )
    }
  }

  async function simulateRealPayload() {
    const randMobile = `98${Math.floor(10000000 + Math.random() * 89999999)}`
    const payload = isMeta
      ? {
          object: "page",
          entry: [
            {
              id: creds.page_id || "1029384756",
              time: Math.floor(Date.now() / 1000),
              changes: [
                {
                  field: "leadgen",
                  value: {
                    leadgen_id: `lg_${Date.now()}`,
                    page_id: creds.page_id || "1029384756",
                    form_id: creds.form_id || "wf_meta_2026",
                    platform: provider === "instagram" ? "ig" : "fb",
                    field_data: [
                      {
                        name: "full_name",
                        values: [`${provider.toUpperCase()} Lead Prospect`],
                      },
                      { name: "phone_number", values: [`+91${randMobile}`] },
                      {
                        name: "email",
                        values: [
                          `${provider}.${randMobile.slice(-4)}@student.in`,
                        ],
                      },
                      { name: "city", values: ["Delhi"] },
                    ],
                  },
                },
              ],
            },
          ],
        }
      : {
          lead_id: `gleads_${Date.now()}`,
          api_version: "1.0",
          form_id: 99281726,
          campaign_id: 20261027,
          google_key:
            creds.google_key || creds.webhook_key || "google_test_key",
          is_test: true,
          gcl_id: "Cj0KCQjw_google_click_sample",
          user_column_data: [
            {
              column_name: "Full Name",
              column_id: "FULL_NAME",
              string_value: "Google Search Ad Applicant",
            },
            {
              column_name: "User Phone",
              column_id: "PHONE_NUMBER",
              string_value: `+91${randMobile}`,
            },
            {
              column_name: "User Email",
              column_id: "EMAIL",
              string_value: `google.${randMobile.slice(-4)}@student.in`,
            },
            {
              column_name: "City",
              column_id: "CITY",
              string_value: "Delhi",
            },
          ],
        }

    const res = await fetch(`/api/webhook/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const out = await res.json()
    if (res.ok && out.ok) {
      setLastResult(
        `✓ Lead #${out.lead_id} ingested (${randMobile}) & logged to lead_webhook_logs`
      )
      toast.success(
        `${provider.toUpperCase()} Lead #${out.lead_id} created in CRM!`
      )
    } else {
      setLastResult(
        `✕ Rejected (${res.status}): ${out.error || out.status || "Save credentials first"}`
      )
      toast.error(
        out.error ||
          "Webhook rejected — if you edited your secret key, click Save first!"
      )
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const mergedCreds = { ...creds }
      if (provider === "google" && mergedCreds.google_key) {
        // Keep legacy `webhook_key` synchronized with `google_key`
        mergedCreds.webhook_key = mergedCreds.google_key
      }
      const res = await fetch("/api/settings-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: provider,
          is_enabled: isEnabled,
          credentials: mergedCreds,
        }),
      })
      if (res.ok) {
        toast.success(`${title} saved successfully!`)
      } else {
        toast.error(`Failed to save ${title}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Skeleton className="h-[460px] w-full rounded-lg lg:col-span-5" />
          <Skeleton className="h-[460px] w-full rounded-lg lg:col-span-7" />
        </div>
      </div>
    )
  }

  const renderField = (f: IntegrationFieldSpec) => {
    const isSecret = f.type === "password"
    const isShown = Boolean(revealed[f.key])
    return (
      <div key={f.key} className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">
            {f.label}{" "}
            {f.required && <span className="text-destructive">*</span>}
          </Label>
          {f.canGenerateToken && (
            <button
              type="button"
              onClick={() => {
                const tok = generateRandomSecret(
                  provider === "google" ? "gads_key" : `${provider}_verify`
                )
                setCreds((prev) => ({ ...prev, [f.key]: tok }))
                setRevealed((prev) => ({ ...prev, [f.key]: true }))
                toast.info(
                  "Generated secure token — click Save below to activate it."
                )
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#405189] hover:underline"
            >
              <Sparkles className="size-3" /> Generate Secret
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            <Input
              required={f.required}
              type={isSecret && !isShown ? "password" : "text"}
              value={creds[f.key] || ""}
              onChange={(e) =>
                setCreds({ ...creds, [f.key]: e.target.value })
              }
              placeholder={
                f.placeholder || `Enter ${f.label.toLowerCase()}...`
              }
              className="h-9 pr-9 font-mono text-xs"
            />
            {isSecret && (
              <button
                type="button"
                onClick={() =>
                  setRevealed((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
                }
                className="absolute top-2 right-2.5 text-muted-foreground hover:text-foreground"
                title={isShown ? "Hide secret" : "Show secret"}
              >
                {isShown ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            )}
          </div>
          {creds[f.key] && (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(creds[f.key])
                toast.success(`${f.label} copied!`)
              }}
              className="h-9 px-2.5"
              title="Copy value"
            >
              <Copy className="size-3.5" />
            </Button>
          )}
        </div>

        {f.helperText && (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {f.helperText}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <BreadcrumbBar parent="Lead Integrations" title={title} />

      <div className="grid grid-cols-1 gap-6 text-xs lg:grid-cols-12">
        {/* Left Webhook & Official Setup Guide Column */}
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-3.5 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold">{title}</h4>
              <Badge
                className={
                  isEnabled
                    ? "bg-emerald-100 text-[10px] font-semibold text-emerald-700"
                    : "bg-slate-100 text-[10px] text-slate-600"
                }
              >
                {isEnabled ? "Active" : "Paused"}
              </Badge>
            </div>

            <p className="leading-relaxed text-muted-foreground">
              {description}
            </p>

            {/* Public Webhook Callback URL Box */}
            <div className="space-y-2 rounded-md border border-[#299cdb]/30 bg-[#299cdb]/10 p-3.5">
              <div className="flex items-center justify-between">
                <strong className="text-[#299cdb]">
                  Public Webhook Callback URL
                </strong>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {isMeta
                    ? "GET Challenge + POST HMAC/Graph"
                    : "POST JSON + google_key"}
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
                  <Copy className="mr-1 size-3" /> Copy URL
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

            {/* Official Platform Setup Checklist */}
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <CheckCircle2 className="size-3.5 text-[#0ab39c]" />
                Quick Setup Checklist
              </div>
              <ol className="list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
                {setupSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>

              {isMeta && (
                <div className="mt-2 rounded border border-border bg-background p-2">
                  <div className="mb-1 text-[10.5px] font-semibold text-foreground">
                    Subscribe Facebook Page to <code>leadgen</code> Webhook:
                  </div>
                  <code className="block break-all font-mono text-[10px] text-muted-foreground">
                    POST https://graph.facebook.com/v20.0/
                    {creds.page_id || "{page_id}"}
                    /subscribed_apps?subscribed_fields=leadgen&amp;access_token=
                    {"{page_access_token}"}
                  </code>
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

        {/* Right Credentials Form Card */}
        <Card className="p-5 shadow-xs lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h5 className="flex items-center gap-1.5 text-sm font-bold capitalize">
                  <KeyRound className="size-4 text-[#405189]" />
                  {provider} Webhook &amp; API Credentials
                </h5>
                <p className="text-[11px] text-muted-foreground">
                  Stored per-organization in <code>lead_integrations</code>{" "}
                  &amp; <code>lead_integration_credentials</code>.
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

            <div className="space-y-3.5">
              {primaryFields.map(renderField)}
            </div>

            {advancedFields.length > 0 && (
              <div className="rounded-md border border-border bg-muted/15 p-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex w-full items-center justify-between text-left text-xs font-semibold text-foreground"
                >
                  <span>
                    Optional / Advanced Credentials ({advancedFields.length})
                  </span>
                  {showAdvanced ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3.5 border-t border-border pt-3">
                    {advancedFields.map(renderField)}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#405189] font-semibold text-white hover:bg-[#364574]"
              >
                {saving ? "Saving..." : `Save ${title}`}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
