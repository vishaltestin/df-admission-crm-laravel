"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function EmailSettingsPage() {
  const [form, setForm] = React.useState({
    provider: "",
    mail_mailer: "smtp",
    mail_host: "",
    mail_port: "587",
    mail_username: "",
    mail_password: "",
    mail_encryption: "tls",
    mail_from_address: "",
    mail_from_name: "",
    mail_validatessl: true,
    status: true,
  })
  const [testEmail, setTestEmail] = React.useState("admin@dfcrm.com")

  React.useEffect(() => {
    fetch("/api/settings-integrations?type=email")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings
          setForm({
            provider: s.provider || "",
            mail_mailer: s.mail_mailer || "smtp",
            mail_host: s.mail_host || "",
            mail_port: s.mail_port || "587",
            mail_username: s.mail_username || "",
            mail_password: s.mail_password || "",
            mail_encryption: s.mail_encryption || "tls",
            mail_from_address: s.mail_from_address || "",
            mail_from_name: s.mail_from_name || "",
            mail_validatessl: Boolean(s.mail_validatessl ?? true),
            status: Boolean(s.status ?? true),
          })
        }
      })
  }, [])

  return (
    <div>
      <BreadcrumbBar parent="Settings" title="Email SMTP Settings" />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        <Card className="p-5 shadow-xs lg:col-span-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "email", ...form }),
              })
              if (res.ok) toast.success("Email SMTP settings saved!")
            }}
            className="space-y-4"
          >
            <h4 className="border-b border-border pb-2 text-sm font-bold">
              Outbound SMTP & Mail Provider Configuration
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label className="mb-1 block text-xs">
                  Provider (Optional)
                </Label>
                <select
                  value={form.provider}
                  onChange={(e) =>
                    setForm({ ...form, provider: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Custom SMTP</option>
                  <option value="aws_ses">Amazon SES</option>
                  <option value="sendgrid">Twilio SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                  <option value="postmark">Postmark</option>
                  <option value="gmail">Google Workspace SMTP</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Mail Driver *</Label>
                <select
                  value={form.mail_mailer}
                  onChange={(e) =>
                    setForm({ ...form, mail_mailer: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendmail">Sendmail</option>
                  <option value="ses">SES</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Encryption</Label>
                <select
                  value={form.mail_encryption}
                  onChange={(e) =>
                    setForm({ ...form, mail_encryption: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="tls">TLS (Recommended)</option>
                  <option value="ssl">SSL</option>
                  <option value="">None</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label className="mb-1 block text-xs">SMTP Host *</Label>
                <Input
                  required
                  placeholder="smtp.hostinger.com / email-smtp.ap-south-1.amazonaws.com"
                  value={form.mail_host}
                  onChange={(e) =>
                    setForm({ ...form, mail_host: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">SMTP Port *</Label>
                <Input
                  required
                  placeholder="587"
                  value={form.mail_port}
                  onChange={(e) =>
                    setForm({ ...form, mail_port: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">SMTP Username *</Label>
                <Input
                  required
                  value={form.mail_username}
                  onChange={(e) =>
                    setForm({ ...form, mail_username: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">SMTP Password *</Label>
                <Input
                  type="password"
                  required
                  value={form.mail_password}
                  onChange={(e) =>
                    setForm({ ...form, mail_password: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">From Name *</Label>
                <Input
                  required
                  placeholder="ADTU Admissions Desk"
                  value={form.mail_from_name}
                  onChange={(e) =>
                    setForm({ ...form, mail_from_name: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="mb-1 block text-xs">From Email Address *</Label>
                <Input
                  type="email"
                  required
                  placeholder="admissions@university.edu.in"
                  value={form.mail_from_address}
                  onChange={(e) =>
                    setForm({ ...form, mail_from_address: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 rounded-md border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="ssl-val"
                  checked={form.mail_validatessl}
                  onCheckedChange={(v) =>
                    setForm({ ...form, mail_validatessl: v })
                  }
                />
                <Label htmlFor="ssl-val" className="cursor-pointer text-xs">
                  Validate SSL Certificate
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="smtp-status"
                  checked={form.status}
                  onCheckedChange={(v) => setForm({ ...form, status: v })}
                />
                <Label htmlFor="smtp-status" className="cursor-pointer text-xs">
                  Enable Outbound Email Service
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Save Email Settings
            </Button>
          </form>
        </Card>

        <Card className="h-fit space-y-3 p-5 shadow-xs lg:col-span-4">
          <h4 className="border-b border-border pb-2 text-sm font-bold">
            Test SMTP Delivery
          </h4>
          <p className="text-muted-foreground">
            Verify your configured SMTP host, credentials, and TLS handshake before running campaigns.
          </p>
          <div>
            <Label className="mb-1 block text-xs">Recipient Test Email</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <Button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "email",
                  action: "test_email",
                  recipient: testEmail,
                }),
              })
              const out = await res.json()
              if (res.ok) toast.success(out.message || "Test email dispatched!")
            }}
            className="w-full bg-[#405189] font-semibold text-white hover:bg-[#364574]"
          >
            Send Test Email
          </Button>
        </Card>
      </div>
    </div>
  )
}
