"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function CreateLeadPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [master, setMaster] = React.useState<any>(null)
  const [saving, setSaving] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    country: "101",
    state: "",
    city: "",
    institute_id: "",
    programme_id: "",
    faculty_id: "",
    application_form_id: "",
    source: "",
    medium: "",
    campaign: "",
    lead_marketing_event: "",
    pipeline_id: "",
    lead_status_id: "",
    lead_assign_to: "",
    description: "",
  })

  React.useEffect(() => {
    fetch("/api/master-data")
      .then((r) => r.json())
      .then(setMaster)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      toast.success("Lead created successfully!")
      router.push(`/leads/${data.id}`)
    } else {
      toast.error(data.error || "Failed to create lead")
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Leads" title="Add New Lead" />

      <Card className="p-5 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h4 className="text-sm font-semibold">
              Student Inquiry Registration
            </h4>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/leads">
                <i className="ri-arrow-left-line mr-1" /> Back to Leads
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
            <div>
              <Label className="mb-1 block text-xs">Student Full Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter student name"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Primary Mobile *</Label>
              <Input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="10-digit mobile"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Alternate Mobile</Label>
              <Input
                value={form.alternate_mobile}
                onChange={(e) =>
                  setForm({ ...form, alternate_mobile: e.target.value })
                }
                placeholder="Optional alternate phone"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@example.com"
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">State</Label>
              <select
                value={form.state}
                onChange={(e) =>
                  setForm({ ...form, state: e.target.value, city: "" })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select State</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.states?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">City</Label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select City</option>
                {master?.cities
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ?.filter((c: any) => !form.state || String(c.state_id) === String(form.state))
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Institute</Label>
              <select
                value={form.institute_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    institute_id: e.target.value,
                    programme_id: "",
                    faculty_id: "",
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Institute</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.institutes?.map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Program</Label>
              <select
                value={form.programme_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    programme_id: e.target.value,
                    faculty_id: "",
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Program</option>
                {master?.programs
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ?.filter((p: any) => !form.institute_id || String(p.institute_id) === String(form.institute_id))
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Course</Label>
              <select
                value={form.faculty_id}
                onChange={(e) =>
                  setForm({ ...form, faculty_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Course</option>
                {master?.courses
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ?.filter((c: any) => !form.programme_id || String(c.program_id) === String(form.programme_id))
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Lead Source</Label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Source</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.sources?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Lead Medium / Type</Label>
              <select
                value={form.medium}
                onChange={(e) => setForm({ ...form, medium: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Medium</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.leadTypes?.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Assign Counsellor</Label>
              <select
                value={form.lead_assign_to}
                onChange={(e) =>
                  setForm({ ...form, lead_assign_to: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Assign to Current User</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.users?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs">
            <Label className="mb-1 block text-xs">
              Remarks / Inquiry Notes
            </Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Student academic background, course preferences, scholarship query..."
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button asChild variant="outline">
              <Link href="/leads">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              {saving ? "Creating Lead..." : "Save & Open Lead"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
