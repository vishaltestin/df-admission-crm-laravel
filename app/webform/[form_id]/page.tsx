"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PublicWebFormPage() {
  const params = useParams<{ form_id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attrs, setAttrs] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lookups, setLookups] = React.useState<any>({
    countries: [],
    states: [],
    cities: [],
    institutes: [],
    programs: [],
    courses: [],
  })
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [otpInput, setOtpInput] = React.useState("")
  const [otpSent, setOtpSent] = React.useState(false)
  const [otpVerified, setOtpVerified] = React.useState(false)
  const [captchaCode] = React.useState(() =>
    Math.random().toString(36).substring(2, 7).toUpperCase()
  )
  const [captchaInput, setCaptchaInput] = React.useState("")
  const [termsChecked, setTermsChecked] = React.useState(true)
  const [doneMsg, setDoneMsg] = React.useState("")

  React.useEffect(() => {
    fetch(`/api/public-webform?form_id=${params.form_id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm(d.form)
        const list =
          d.attributes && d.attributes.length > 0
            ? d.attributes
            : [
                { name: "name", placeholder: "Enter name", type: "text", is_required: true },
                { name: "email", placeholder: "Enter email", type: "email", is_required: true },
                { name: "mobile", placeholder: "Enter mobile", type: "mobile_otp", is_required: true },
                { name: "city", placeholder: "Enter city", type: "text", is_required: false },
              ]
        setAttrs(list)
        setLookups({
          countries: d.countries || [],
          states: d.states || [],
          cities: d.cities || [],
          institutes: d.institutes || [],
          programs: d.programs || [],
          courses: d.courses || [],
        })
        const defaults: Record<string, string> = {}
        for (const a of list) {
          if (a.default_value) defaults[a.name] = String(a.default_value)
        }
        setValues(defaults)
      })
  }, [params.form_id])

  const setVal = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hasCaptcha = attrs.some((a) => a.type === "captcha" && !a.is_hidden)
    if (
      hasCaptcha &&
      captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()
    ) {
      toast.error("Please enter the matching security captcha code.")
      return
    }
    const res = await fetch("/api/public-webform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form_id: params.form_id,
        name: values.name || "",
        mobile: values.mobile || "",
        email: values.email || "",
        city: values.city || "",
        state: values.state || "",
        country: values.country || "",
        extra: values,
        otp_verified: otpVerified,
      }),
    })
    const out = await res.json()
    if (res.ok) {
      if (
        form?.submit_success_action === "redirect" &&
        form?.submit_success_content?.startsWith("http")
      ) {
        window.location.href = form.submit_success_content
        return
      }
      setDoneMsg(out.message)
      toast.success("Form submitted!")
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: form?.background_color || "#f7f8f9" }}
    >
      <Card
        className="w-full max-w-md border-slate-200 p-6 text-xs text-slate-800 shadow-md"
        style={{ backgroundColor: form?.form_background_color || "#ffffff" }}
      >
        <div className="mb-2 border-b border-slate-100 pb-3">
          <span className="font-mono text-[10px] text-slate-400">
            Form #{params.form_id}
          </span>
          <h2
            className="text-base font-bold"
            style={{ color: form?.form_title_color || "#263238" }}
          >
            {form?.title || "Student Admission Enquiry Form"}
          </h2>
          {form?.description && (
            <p className="mt-1 text-slate-500">{form.description}</p>
          )}
        </div>

        {doneMsg ? (
          <div className="py-6 text-center font-semibold text-[#0ab39c]">
            {doneMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {attrs
              .filter((a) => !a.is_hidden)
              .map((a, idx) => {
                const labelText = a.name.replace(/_/g, " ")
                const val = values[a.name] || ""

                if (a.type === "terms") {
                  return (
                    <label
                      key={idx}
                      className="flex items-start gap-2 pt-1 text-[11px] leading-snug text-slate-600"
                    >
                      <input
                        type="checkbox"
                        required={Boolean(a.is_required)}
                        checked={termsChecked}
                        onChange={(e) => setTermsChecked(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        {a.placeholder ||
                          "I agree to receive admission updates via Email, SMS & WhatsApp."}
                      </span>
                    </label>
                  )
                }

                if (a.type === "captcha") {
                  return (
                    <div key={idx} className="space-y-1">
                      <label
                        className="block text-[11px] font-medium"
                        style={{ color: form?.attribute_label_color || "#546e7a" }}
                      >
                        Security Captcha *
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="select-none rounded border border-slate-300 bg-slate-100 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-slate-800">
                          {captchaCode}
                        </div>
                        <Input
                          required
                          placeholder="Enter code"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          className="h-9 flex-1 border-slate-300 bg-white font-mono uppercase text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  )
                }

                if (a.type === "mobile_otp") {
                  return (
                    <div key={idx} className="space-y-1.5">
                      <label
                        className="block text-[11px] font-medium capitalize"
                        style={{ color: form?.attribute_label_color || "#546e7a" }}
                      >
                        {labelText} {a.is_required ? "*" : ""}
                      </label>
                      <div className="flex gap-1.5">
                        <Input
                          required={Boolean(a.is_required)}
                          placeholder={a.placeholder || "Enter mobile"}
                          value={val}
                          onChange={(e) => setVal(a.name, e.target.value)}
                          className="h-9 flex-1 border-slate-300 bg-white text-xs text-slate-900"
                        />
                        {!otpVerified ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              if (!val) {
                                toast.error("Enter mobile number first")
                                return
                              }
                              const r = await fetch("/api/otp", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "send",
                                  type: "mobile",
                                  recipient: val,
                                }),
                              })
                              const d = await r.json()
                              if (r.ok) {
                                setOtpSent(true)
                                setOtpInput(d.demo_otp || "")
                                toast.success(d.message)
                              }
                            }}
                            className="h-9 border-slate-300 bg-slate-100 px-2.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-200"
                          >
                            Send OTP
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-100 px-2.5 text-[11px] font-semibold text-emerald-700">
                            Verified ✓
                          </Badge>
                        )}
                      </div>
                      {otpSent && !otpVerified && (
                        <div className="flex gap-1.5">
                          <Input
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="6-digit OTP"
                            className="h-8 flex-1 border-slate-300 bg-white font-mono text-xs text-slate-900"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={async () => {
                              const r = await fetch("/api/otp", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "verify",
                                  recipient: val,
                                  otp_code: otpInput,
                                }),
                              })
                              if (r.ok) {
                                setOtpVerified(true)
                                toast.success("Mobile OTP verified!")
                              } else {
                                toast.error("Invalid OTP")
                              }
                            }}
                            className="h-8 bg-[#0ab39c] px-3 text-[11px] font-semibold text-white hover:bg-[#099885]"
                          >
                            Verify OTP
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                }

                if (
                  ["country", "state", "city", "institute", "programme", "course", "select"].includes(
                    a.type
                  )
                ) {
                   
                  let opts: { value: string; label: string }[] = []
                  if (a.type === "country") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.countries.map((c: any) => ({
                      value: c.name,
                      label: c.name,
                    }))
                  } else if (a.type === "state") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.states.map((s: any) => ({
                      value: s.name,
                      label: s.name,
                    }))
                  } else if (a.type === "city") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.cities.map((c: any) => ({
                      value: c.name,
                      label: c.name,
                    }))
                  } else if (a.type === "institute") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.institutes.map((i: any) => ({
                      value: String(i.id),
                      label: i.name,
                    }))
                  } else if (a.type === "programme") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.programs.map((p: any) => ({
                      value: String(p.id),
                      label: p.name,
                    }))
                  } else if (a.type === "course") {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    opts = lookups.courses.map((c: any) => ({
                      value: c.name,
                      label: c.name,
                    }))
                  } else {
                    opts = String(a.options || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((s) => ({ value: s, label: s }))
                  }

                  return (
                    <div key={idx}>
                      <label
                        className="mb-1 block text-[11px] font-medium capitalize"
                        style={{ color: form?.attribute_label_color || "#546e7a" }}
                      >
                        {labelText} {a.is_required ? "*" : ""}
                      </label>
                      <select
                        required={Boolean(a.is_required)}
                        value={val}
                        onChange={(e) => setVal(a.name, e.target.value)}
                        className="h-9 w-full rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-900"
                      >
                        <option value="">Select {labelText}</option>
                        {opts.map((o, oi) => (
                          <option key={oi} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (a.type === "textarea") {
                  return (
                    <div key={idx}>
                      <label
                        className="mb-1 block text-[11px] font-medium capitalize"
                        style={{ color: form?.attribute_label_color || "#546e7a" }}
                      >
                        {labelText} {a.is_required ? "*" : ""}
                      </label>
                      <Textarea
                        rows={2}
                        required={Boolean(a.is_required)}
                        placeholder={a.placeholder || ""}
                        value={val}
                        onChange={(e) => setVal(a.name, e.target.value)}
                        className="border-slate-300 bg-white text-xs text-slate-900"
                      />
                    </div>
                  )
                }

                return (
                  <div key={idx}>
                    <label
                      className="mb-1 block text-[11px] font-medium capitalize"
                      style={{ color: form?.attribute_label_color || "#546e7a" }}
                    >
                      {labelText} {a.is_required ? "*" : ""}
                    </label>
                    <Input
                      required={Boolean(a.is_required)}
                      type={
                        a.type === "email" || a.type === "email_otp"
                          ? "email"
                          : a.type === "number"
                            ? "number"
                            : a.type === "date"
                              ? "date"
                              : "text"
                      }
                      placeholder={a.placeholder || `Enter ${labelText}`}
                      value={val}
                      onChange={(e) => setVal(a.name, e.target.value)}
                      className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                    />
                  </div>
                )
              })}

            <Button
              type="submit"
              style={{
                backgroundColor: form?.form_submit_button_color || "#0e90d9",
              }}
              className="h-9 w-full font-semibold text-white hover:opacity-90"
            >
              {form?.submit_button_label || "Submit"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
