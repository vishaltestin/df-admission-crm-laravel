"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { FormSelect } from "@/components/ui/form-select"

const ALLOWED_TYPES = [
  "text",
  "textarea",
  "email",
  "email_otp",
  "number",
  "mobile",
  "mobile_otp",
  "date",
  "time",
  "datetime-local",
  "select",
  "radio",
  "checkbox",
  "country",
  "state",
  "city",
  "institute",
  "programme",
  "course",
  "captcha",
  "terms",
]

type WebFormAttr = {
  name: string
  placeholder: string
  type: string
  is_required: boolean
  is_hidden: boolean
  sort_order: number
  options: string
  default_value: string
}

const DEFAULT_ATTRS: WebFormAttr[] = [
  {
    name: "name",
    placeholder: "Enter name",
    type: "text",
    is_required: true,
    is_hidden: false,
    sort_order: 0,
    options: "",
    default_value: "",
  },
  {
    name: "email",
    placeholder: "Enter email",
    type: "email",
    is_required: true,
    is_hidden: false,
    sort_order: 1,
    options: "",
    default_value: "",
  },
  {
    name: "mobile",
    placeholder: "Enter mobile",
    type: "mobile_otp",
    is_required: true,
    is_hidden: false,
    sort_order: 2,
    options: "",
    default_value: "",
  },
]

export function WebFormStudio({ editId }: { editId?: string }) {
  const router = useRouter()
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [meta, setMeta] = React.useState<any>({
    leadSources: [],
    campaigns: [],
    pipelines: [],
    leadTypes: [],
    appForms: [],
  })

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    submit_button_label: "Submit",
    submit_success_action: "message",
    submit_success_content:
      "Thanks for your time. Our team will contact you soon.",
    create_lead: true,
    background_color: "#f7f8f9",
    form_background_color: "#ffffff",
    form_title_color: "#263238",
    form_submit_button_color: "#0e90d9",
    attribute_label_color: "#546e7a",
    lead_source_id: "",
    lead_campaign_id: "",
    pipeline_id: "",
    type_id: "",
    application_form_id: "",
  })

  const [attributes, setAttributes] = React.useState<WebFormAttr[]>(DEFAULT_ATTRS)

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=web_forms")
      .then((r) => r.json())
      .then((d) => {
        setMeta({
          leadSources: d.leadSources || [],
          campaigns: d.campaigns || [],
          pipelines: d.pipelines || [],
          leadTypes: d.leadTypes || [],
          appForms: d.appForms || [],
        })
        if (editId) {
           
          const found = (d.webforms || d.items || []).find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (wf: any) => String(wf.id) === String(editId)
          )
          if (found) {
            setForm({
              title: found.title || "",
              description: found.description || "",
              submit_button_label: found.submit_button_label || "Submit",
              submit_success_action: found.submit_success_action || "message",
              submit_success_content:
                found.submit_success_content ||
                "Thanks for your time. Our team will contact you soon.",
              create_lead: found.create_lead !== false,
              background_color: found.background_color || "#f7f8f9",
              form_background_color: found.form_background_color || "#ffffff",
              form_title_color: found.form_title_color || "#263238",
              form_submit_button_color:
                found.form_submit_button_color || "#0e90d9",
              attribute_label_color: found.attribute_label_color || "#546e7a",
              lead_source_id: found.lead_source_id
                ? String(found.lead_source_id)
                : "",
              lead_campaign_id: found.lead_campaign_id
                ? String(found.lead_campaign_id)
                : "",
              pipeline_id: found.pipeline_id ? String(found.pipeline_id) : "",
              type_id: found.type_id ? String(found.type_id) : "",
              application_form_id: found.application_form_id
                ? String(found.application_form_id)
                : "",
            })
            if (Array.isArray(found.attributes) && found.attributes.length > 0) {
              setAttributes(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                found.attributes.map((a: any, idx: number) => ({
                  name: a.name || "",
                  placeholder: a.placeholder || "",
                  type: a.type || "text",
                  is_required: Boolean(a.is_required),
                  is_hidden: Boolean(a.is_hidden),
                  sort_order: Number(a.sort_order ?? idx),
                  options: a.options || "",
                  default_value: a.default_value || "",
                }))
              )
            }
          }
        }
      })
  }, [editId])

  function updateAttr(idx: number, patch: Partial<WebFormAttr>) {
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    )
  }

  function moveAttr(idx: number, dir: -1 | 1) {
    setAttributes((prev) => {
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const copy = [...prev]
      const [moved] = copy.splice(idx, 1)
      copy.splice(target, 0, moved)
      return copy.map((a, i) => ({ ...a, sort_order: i }))
    })
  }

  function removeAttr(idx: number) {
    const lower = attributes[idx]?.name.toLowerCase()
    if (["name", "email", "mobile"].includes(lower)) {
      toast.warning("Name, Email and Mobile are mandatory lead fields.")
      return
    }
    setAttributes((prev) =>
      prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, sort_order: i }))
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "web_forms",
        action: editId ? "update" : "create",
        id: editId,
        ...form,
        attributes,
      }),
    })
    if (res.ok) {
      toast.success(editId ? "WebForm updated!" : "WebForm created!")
      router.push("/webforms")
    }
  }

  return (
    <div>
      <BreadcrumbBar
        parent="Web Forms"
        title={editId ? "Edit Web Form" : "Create Web Form"}
      />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        <Card className="p-5 shadow-xs lg:col-span-8">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h4 className="text-sm font-bold">
                {editId ? "Edit Webform" : "Create Webform"}
              </h4>
              <Button asChild size="xs" variant="outline">
                <Link href="/webforms">← Back to WebForms</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Title *</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Admission 2026-27"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  Submit Button Label *
                </Label>
                <Input
                  required
                  value={form.submit_button_label}
                  onChange={(e) =>
                    setForm({ ...form, submit_button_label: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  Submit Success Action *
                </Label>
                <FormSelect
                  value={form.submit_success_action}
                  onChange={(e) =>
                    setForm({ ...form, submit_success_action: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="message">Display custom message</option>
                  <option value="redirect">Redirect To Url</option>
                </FormSelect>
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  {form.submit_success_action === "redirect"
                    ? "Redirect URL *"
                    : "Message to display *"}
                </Label>
                <Input
                  required
                  value={form.submit_success_content}
                  onChange={(e) =>
                    setForm({ ...form, submit_success_content: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="wf-create-lead"
                checked={form.create_lead}
                onCheckedChange={(v) => setForm({ ...form, create_lead: v })}
              />
              <Label htmlFor="wf-create-lead" className="cursor-pointer text-xs">
                Create Lead Automatically on Submission
              </Label>
            </div>

            {/* Customize Webform Colors */}
            <div className="border-t border-border pt-3">
              <h5 className="mb-2 text-xs font-bold text-[#405189]">
                Customize Webform Colors
              </h5>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { key: "background_color", label: "Background Color" },
                  { key: "form_background_color", label: "Form Bg Color" },
                  { key: "form_title_color", label: "Form Title Color" },
                  { key: "form_submit_button_color", label: "Button Color" },
                  { key: "attribute_label_color", label: "Label Color" },
                ].map((c) => (
                  <div key={c.key}>
                    <Label className="mb-1 block text-[11px]">{c.label}</Label>
                    <input
                      type="color"
                      value={String(
                        (form as Record<string, unknown>)[c.key] || "#000000"
                      )}
                      onChange={(e) =>
                        setForm({ ...form, [c.key]: e.target.value })
                      }
                      className="h-8 w-full cursor-pointer rounded border border-input p-0.5"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Lead Configuration */}
            <div className="border-t border-border pt-3">
              <h5 className="mb-2 text-xs font-bold text-[#405189]">
                Lead Configuration
              </h5>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs">Lead Source</Label>
                  <FormSelect
                    value={form.lead_source_id}
                    onChange={(e) =>
                      setForm({ ...form, lead_source_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Source</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meta.leadSources.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Campaign</Label>
                  <FormSelect
                    value={form.lead_campaign_id}
                    onChange={(e) =>
                      setForm({ ...form, lead_campaign_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Campaign</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meta.campaigns.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Pipeline</Label>
                  <FormSelect
                    value={form.pipeline_id}
                    onChange={(e) =>
                      setForm({ ...form, pipeline_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Pipeline</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meta.pipelines.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Lead Type</Label>
                  <FormSelect
                    value={form.type_id}
                    onChange={(e) =>
                      setForm({ ...form, type_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Lead Type</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meta.leadTypes.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </FormSelect>
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1 block text-xs">
                    Application Form
                  </Label>
                  <FormSelect
                    value={form.application_form_id}
                    onChange={(e) =>
                      setForm({ ...form, application_form_id: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                  >
                    <option value="">Select Application Form</option>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meta.appForms.map((af: any) => (
                      <option key={af.id} value={af.id}>
                        {af.title} ({af.unique_code})
                      </option>
                    ))}
                  </FormSelect>
                </div>
              </div>
            </div>

            {/* Dynamic Attributes Builder */}
            <div className="border-t border-border pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#405189]">
                    Attributes ({attributes.length})
                  </h5>
                  <p className="text-[11px] text-muted-foreground">
                    Add custom attributes to the form. Name, Email and Mobile must be present and required.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setAttributes((prev) => [
                      ...prev,
                      {
                        name: `field_${prev.length + 1}`,
                        placeholder: "Enter value",
                        type: "text",
                        is_required: false,
                        is_hidden: false,
                        sort_order: prev.length,
                        options: "",
                        default_value: "",
                      },
                    ])
                  }
                  className="bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  + Add Attribute
                </Button>
              </div>

              <div className="space-y-2">
                {attributes.map((attr, idx) => {
                  const isCore = ["name", "email", "mobile"].includes(
                    attr.name.toLowerCase()
                  )
                  const showOptions = ["select", "radio", "checkbox"].includes(
                    attr.type
                  )
                  const showDefault = [
                    "country",
                    "state",
                    "city",
                    "institute",
                    "programme",
                    "course",
                  ].includes(attr.type)
                  return (
                    <div
                      key={idx}
                      className="rounded-md border border-border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-semibold capitalize">
                          #{idx + 1} — {attr.name || "Attribute"}
                        </strong>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => moveAttr(idx, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => moveAttr(idx, 1)}
                          >
                            ↓
                          </Button>
                          {!isCore && (
                            <Button
                              type="button"
                              size="xs"
                              variant="destructive"
                              onClick={() =>
                                confirmDelete({
                                  title: "Remove Form Field?",
                                  description: `Are you sure you want to remove field "${attr.name || attr.placeholder || `#${idx + 1}`}" from this web form?`,
                                  confirmLabel: "Yes, Remove Field",
                                  onConfirm: () => removeAttr(idx),
                                })
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div>
                          <Label className="mb-1 block text-[11px]">
                            Name *
                          </Label>
                          <Input
                            required
                            readOnly={isCore}
                            value={attr.name}
                            onChange={(e) =>
                              updateAttr(idx, { name: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px]">
                            Placeholder / Label
                          </Label>
                          <Input
                            value={attr.placeholder}
                            onChange={(e) =>
                              updateAttr(idx, { placeholder: e.target.value })
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="mb-1 block text-[11px]">Type</Label>
                          <FormSelect
                            value={attr.type}
                            onChange={(e) =>
                              updateAttr(idx, { type: e.target.value })
                            }
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                          >
                            {ALLOWED_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </FormSelect>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <label className="flex items-center gap-1.5">
                          <Checkbox
                            checked={attr.is_required}
                            disabled={isCore}
                            onCheckedChange={(v) =>
                              updateAttr(idx, { is_required: Boolean(v) })
                            }
                          />
                          <span>Required</span>
                        </label>
                        <label className="flex items-center gap-1.5">
                          <Checkbox
                            checked={attr.is_hidden}
                            onCheckedChange={(v) =>
                              updateAttr(idx, { is_hidden: Boolean(v) })
                            }
                          />
                          <span>Hidden</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">Order:</span>
                          <Input
                            type="number"
                            value={attr.sort_order}
                            onChange={(e) =>
                              updateAttr(idx, {
                                sort_order: Number(e.target.value || 0),
                              })
                            }
                            className="h-7 w-16 text-xs"
                          />
                        </div>
                      </div>

                      {showOptions && (
                        <div>
                          <Label className="mb-1 block text-[11px]">
                            Options (comma separated)
                          </Label>
                          <Input
                            value={attr.options}
                            onChange={(e) =>
                              updateAttr(idx, { options: e.target.value })
                            }
                            placeholder="Option 1, Option 2, Option 3"
                            className="h-8 text-xs"
                          />
                        </div>
                      )}

                      {showDefault && (
                        <div>
                          <Label className="mb-1 block text-[11px]">
                            Default ID / Value (e.g. 80 for India, 1 for Institute)
                          </Label>
                          <Input
                            value={attr.default_value}
                            onChange={(e) =>
                              updateAttr(idx, { default_value: e.target.value })
                            }
                            placeholder="e.g. 1"
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              {editId ? "Update Webform" : "Save Webform"}
            </Button>
          </form>
        </Card>

        {/* Live Preview */}
        <Card
          className="h-fit p-5 shadow-xs lg:sticky lg:top-20 lg:col-span-4"
          style={{ backgroundColor: form.background_color }}
        >
          <div
            className="w-full rounded-lg border border-slate-200 p-4 shadow-md space-y-2.5"
            style={{ backgroundColor: form.form_background_color }}
          >
            <div className="text-[10px] uppercase tracking-wider text-slate-400">
              Live Preview
            </div>
            <h3
              className="text-base font-bold"
              style={{ color: form.form_title_color }}
            >
              {form.title || "Admission Enquiry Form"}
            </h3>
            {form.description && (
              <p className="text-slate-500">{form.description}</p>
            )}

            {attributes
              .filter((a) => !a.is_hidden)
              .map((a, idx) => (
                <div key={idx}>
                  {a.type === "terms" ? (
                    <label className="flex items-start gap-2 text-[11px] text-slate-600">
                      <input type="checkbox" disabled checked className="mt-0.5" />
                      <span>
                        {a.placeholder ||
                          "I agree to receive admissions updates via Email, SMS & WhatsApp."}
                      </span>
                    </label>
                  ) : a.type === "captcha" ? (
                    <div className="flex items-center gap-2 rounded border border-dashed border-slate-300 bg-slate-50 p-2 text-[11px] text-slate-600">
                      <span className="rounded bg-slate-200 px-2 py-1 font-mono font-bold tracking-widest">
                        7 K 9 P 2
                      </span>
                      <input
                        disabled
                        placeholder="Enter Captcha *"
                        className="h-7 flex-1 rounded border border-slate-300 bg-white px-2"
                      />
                    </div>
                  ) : (
                    <div>
                      <label
                        className="mb-1 block text-[11px] font-medium capitalize"
                        style={{ color: form.attribute_label_color }}
                      >
                        {a.name.replace(/_/g, " ")}
                        {a.is_required ? " *" : ""}
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          disabled
                          placeholder={
                            a.placeholder ||
                            `Select / Enter ${a.name.replace(/_/g, " ")}`
                          }
                          className="h-8 flex-1 rounded border border-slate-300 bg-white px-2.5 text-slate-800"
                        />
                        {(a.type === "mobile_otp" || a.type === "email_otp") && (
                          <span className="flex items-center rounded bg-slate-200 px-2 text-[10px] font-semibold text-slate-700">
                            Send OTP
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            <button
              type="button"
              style={{ backgroundColor: form.form_submit_button_color }}
              className="mt-2 h-9 w-full rounded font-semibold text-white"
            >
              {form.submit_button_label || "Submit"}
            </button>
          </div>
        </Card>
      </div>
      {DeleteDialog}
    </div>
  )
}
