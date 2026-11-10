"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FormSelect } from "@/components/ui/form-select"

export default function TestLeadApiPage() {
  const [form, setForm] = React.useState({
    name: "Siddharth Kulkarni",
    mobile: "9810990011",
    alternate_mobile: "",
    email: "siddharth.k@student.in",
    city: "Delhi",
    state: "Delhi",
    country: "80",
    organization_id: "1",
    institute_id: "1",
    programme_id: "1",
    faculty_id: "1",
    lead_source_id: "1",
    lead_campaign_id: "1",
    pipeline_id: "1",
    stage_id: "1",
    lead_status_id: "1",
    lead_assign_to: "0",
    upload_via: "partner_api",
    source_type: "api_direct",
  })
  const [responseJson, setResponseJson] = React.useState("")

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Test Lead API" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 text-xs">
        <Card className="p-5 shadow-xs lg:col-span-7">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/leads/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
              })
              const out = await res.json()
              setResponseJson(JSON.stringify(out, null, 2))
              if (res.ok) toast.success("Lead ingested via /api/leads/add!")
            }}
            className="space-y-4"
          >
            <h4 className="text-sm font-bold">
              Full Lead API Testing Form (<code>POST /api/leads/add</code>)
            </h4>

            <div>
              <h6 className="mb-2 font-semibold text-[#405189]">Basic Info</h6>
              <div className="grid grid-cols-2 gap-2.5">
                <Input
                  required
                  placeholder="Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
                <Input
                  required
                  placeholder="Mobile *"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <h6 className="mb-2 font-semibold text-[#405189]">
                Academic, Marketing & Pipeline IDs
              </h6>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <Input
                  placeholder="Institute ID"
                  value={form.institute_id}
                  onChange={(e) =>
                    setForm({ ...form, institute_id: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Programme ID"
                  value={form.programme_id}
                  onChange={(e) =>
                    setForm({ ...form, programme_id: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Course / Faculty ID"
                  value={form.faculty_id}
                  onChange={(e) =>
                    setForm({ ...form, faculty_id: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Lead Source ID"
                  value={form.lead_source_id}
                  onChange={(e) =>
                    setForm({ ...form, lead_source_id: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Pipeline ID"
                  value={form.pipeline_id}
                  onChange={(e) =>
                    setForm({ ...form, pipeline_id: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  placeholder="Assign User ID (0 = Pool)"
                  value={form.lead_assign_to}
                  onChange={(e) =>
                    setForm({ ...form, lead_assign_to: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <FormSelect
                value={form.upload_via}
                onChange={(e) =>
                  setForm({ ...form, upload_via: e.target.value })
                }
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="mobile">Mobile</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="google_ads">Google Ads</option>
                <option value="partner_api">Partner API</option>
              </FormSelect>
              <FormSelect
                value={form.source_type}
                onChange={(e) =>
                  setForm({ ...form, source_type: e.target.value })
                }
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs"
              >
                <option value="api_direct">API Direct</option>
                <option value="bulk_cron">Bulk Cron</option>
                <option value="google_ads">Google Ads</option>
                <option value="partner_api">Partner API</option>
              </FormSelect>
            </div>

            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Submit Lead Payload
            </Button>
          </form>
        </Card>

        <Card className="gap-3 p-5 shadow-xs lg:col-span-5">
          <h5 className="text-sm font-bold">API Response Inspector</h5>
          <pre className="min-h-64 overflow-auto rounded-md bg-slate-950 p-3 font-mono text-[11px] text-emerald-400">
            {responseJson ||
              "// Click 'Submit Lead Payload' to inspect live JSON response"}
          </pre>
        </Card>
      </div>
    </div>
  )
}
