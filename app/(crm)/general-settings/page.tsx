"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/ui/form-select"

const CURRENCIES = [
  ["INR", "Indian Rupee"],
  ["USD", "US Dollar"],
  ["EUR", "Euro"],
  ["GBP", "British Pound"],
  ["AED", "UAE Dirham"],
  ["AUD", "Australian Dollar"],
  ["CAD", "Canadian Dollar"],
  ["SGD", "Singapore Dollar"],
  ["JPY", "Japanese Yen"],
  ["SAR", "Saudi Riyal"],
  ["QAR", "Qatari Riyal"],
]

export default function GeneralSettingsPage() {
  const [form, setForm] = React.useState({
    app_name: "LMS - Admin & Dashboard",
    currency: "INR",
    timezone: "Asia/Kolkata",
    default_payment_gateway: "razorpay",
    date_format: "d M, Y",
  })

  React.useEffect(() => {
    fetch("/api/settings-integrations")
      .then((r) => r.json())
      .then((d) => {
        if (d.general) {
          setForm({
            app_name: d.general.app_name || "LMS - Admin & Dashboard",
            currency: d.general.currency || "INR",
            timezone: d.general.timezone || "Asia/Kolkata",
            default_payment_gateway:
              d.general.default_payment_gateway || "razorpay",
            date_format: d.general.date_format || "d M, Y",
          })
        }
      })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/settings-integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "general", ...form }),
    })
    if (res.ok) toast.success("General settings saved!")
  }

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="General Settings" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 text-xs">
        <div className="space-y-2 p-2 lg:col-span-5">
          <h4 className="text-base font-bold">General</h4>
          <p className="leading-relaxed text-muted-foreground">
            Configure or define the application name, default payment gateway, date format, timezone, and currency used across the CRM user interface for your organization.
          </p>
        </div>

        <Card className="p-5 shadow-xs lg:col-span-7">
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <Label className="mb-1 block text-xs">App Name</Label>
              <Input
                value={form.app_name}
                onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Currency</Label>
              <FormSelect
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                {CURRENCIES.map(([code, label]) => (
                  <option key={code} value={code}>
                    {code} - {label}
                  </option>
                ))}
              </FormSelect>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Timezone</Label>
                <FormSelect
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({ ...form, timezone: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs">Date Format</Label>
                <FormSelect
                  value={form.date_format}
                  onChange={(e) =>
                    setForm({ ...form, date_format: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="d M, Y">27 Oct, 2026 (d M, Y)</option>
                  <option value="Y-m-d">2026-10-27 (Y-m-d)</option>
                  <option value="d/m/Y">27/10/2026 (d/m/Y)</option>
                </FormSelect>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">
                Default Payment Gateway
              </Label>
              <FormSelect
                value={form.default_payment_gateway}
                onChange={(e) =>
                  setForm({ ...form, default_payment_gateway: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="razorpay">Razorpay</option>
                <option value="payu">PayU Money</option>
                <option value="cashfree">Cashfree</option>
                <option value="stripe">Stripe</option>
              </FormSelect>
            </div>

            <Button
              type="submit"
              className="bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              Save General Settings
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
