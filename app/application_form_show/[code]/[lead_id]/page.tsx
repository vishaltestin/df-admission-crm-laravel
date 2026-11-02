"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function PublicApplicationFormPage() {
  const params = useParams<{ code: string; lead_id: string }>()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [form, setForm] = React.useState<any>(null)
  const [answers, setAnswers] = React.useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    qualification: "12th / Undergraduate",
    percentage: "",
    program_preference: "",
  })
  const [otpInput, setOtpInput] = React.useState("")
  const [otpSent, setOtpSent] = React.useState(false)
  const [otpVerified, setOtpVerified] = React.useState(false)
  const [couponCode, setCouponCode] = React.useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appliedCoupon, setAppliedCoupon] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submitted, setSubmitted] = React.useState<any>(null)

  React.useEffect(() => {
    setLoading(true)
    fetch(
      `/api/public-application?code=${params.code}&lead_id=${params.lead_id}`
    )
      .then((r) => r.json())
      .then((d) => {
        setForm(d.form || null)
        if (d.lead) {
          setAnswers((prev) => ({
            ...prev,
            name: d.lead.name || "",
            mobile: d.lead.mobile || "",
            email: d.lead.email || "",
            city: d.lead.city || "",
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [params.code, params.lead_id])

  const totalBase = Number(form?.total_amount || 0)
  const discount = React.useMemo(() => {
    if (!appliedCoupon) return 0
    const raw =
      appliedCoupon.type === "percent"
        ? Math.round((totalBase * Number(appliedCoupon.value)) / 100)
        : Number(appliedCoupon.value)
    return appliedCoupon.max_discount
      ? Math.min(raw, Number(appliedCoupon.max_discount))
      : raw
  }, [appliedCoupon, totalBase])
  const payable = Math.max(0, totalBase - discount)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading Admission Application Portal...
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md border-slate-200 bg-white p-6 text-center shadow-xs">
          <h2 className="text-base font-bold text-slate-800">
            Application Form Not Found
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            No active admission form matches code <code>{params.code}</code>.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <Card className="mx-auto max-w-2xl gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-md">
        <div className="bg-[#405189] px-6 py-5 text-white">
          <div className="text-xs uppercase tracking-wider opacity-80">
            Online Admission Portal • Code: {form.unique_code}
          </div>
          <h1 className="mt-1 text-xl font-bold">
            {form.title || form.form_name}
          </h1>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Application Submitted Successfully!
            </h2>
            <p className="text-xs text-slate-600">
              Application ID #{submitted.id} • Fee Paid: ₹{submitted.finalAmount}
            </p>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/public-application", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code: params.code,
                  lead_id: params.lead_id,
                  ...answers,
                  answers: { ...answers, otp_verified: otpVerified },
                  coupon_code: appliedCoupon?.code || "",
                }),
              })
              const out = await res.json()
              if (res.ok) {
                toast.success("Application submitted!")
                setSubmitted(out)
              } else {
                toast.error(out.error || "Submission failed")
              }
            }}
            className="p-6 space-y-4 text-xs text-slate-800"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  Full Name *
                </Label>
                <Input
                  required
                  value={answers.name}
                  onChange={(e) =>
                    setAnswers({ ...answers, name: e.target.value })
                  }
                  className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  Mobile Number *
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    required
                    value={answers.mobile}
                    onChange={(e) => {
                      setAnswers({ ...answers, mobile: e.target.value })
                      setOtpVerified(false)
                    }}
                    className="h-9 flex-1 border-slate-300 bg-white text-xs text-slate-900"
                  />
                  {!otpVerified && (
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!answers.mobile) {
                          toast.error("Enter mobile number first")
                          return
                        }
                        const r = await fetch("/api/otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "send",
                            type: "mobile",
                            recipient: answers.mobile,
                            organization_id: form.organization_id || 1,
                          }),
                        })
                        const d = await r.json()
                        if (r.ok) {
                          setOtpSent(true)
                          toast.success(`OTP Sent (Demo: ${d.demo_otp})`)
                        }
                      }}
                      className="h-9 bg-slate-800 px-2.5 text-[11px] font-semibold text-white hover:bg-slate-700"
                    >
                      {otpSent ? "Resend" : "Send OTP"}
                    </Button>
                  )}
                </div>
                {otpSent && !otpVerified && (
                  <div className="mt-1.5 flex gap-1.5">
                    <Input
                      placeholder="6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="h-8 flex-1 border-emerald-400 bg-white font-mono text-xs text-slate-900"
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
                            recipient: answers.mobile,
                            otp_code: otpInput,
                          }),
                        })
                        const d = await r.json()
                        if (r.ok && d.verified) {
                          setOtpVerified(true)
                          toast.success("Mobile verified!")
                        } else {
                          toast.error(d.error || "Invalid OTP")
                        }
                      }}
                      className="h-8 bg-emerald-600 px-2.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                    >
                      Verify
                    </Button>
                  </div>
                )}
                {otpVerified && (
                  <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                    ✓ Mobile Number Verified
                  </div>
                )}
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  Email *
                </Label>
                <Input
                  type="email"
                  required
                  value={answers.email}
                  onChange={(e) =>
                    setAnswers({ ...answers, email: e.target.value })
                  }
                  className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  City
                </Label>
                <Input
                  value={answers.city}
                  onChange={(e) =>
                    setAnswers({ ...answers, city: e.target.value })
                  }
                  className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  Last Qualification
                </Label>
                <Input
                  value={answers.qualification}
                  onChange={(e) =>
                    setAnswers({ ...answers, qualification: e.target.value })
                  }
                  className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-800">
                  Aggregate Marks (%)
                </Label>
                <Input
                  value={answers.percentage}
                  onChange={(e) =>
                    setAnswers({ ...answers, percentage: e.target.value })
                  }
                  placeholder="e.g. 84.5%"
                  className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span>Application Fee (incl. Tax)</span>
                <span className="font-semibold">₹{totalBase}</span>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Have Scholarship / Coupon Code? (e.g. EARLY2026)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-8 flex-1 border-slate-300 bg-white font-mono text-xs uppercase text-slate-900"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const r = await fetch(
                      `/api/public-application?code=${params.code}&coupon=${couponCode}`
                    )
                    const d = await r.json()
                    if (d.coupon) {
                      setAppliedCoupon(d.coupon)
                      toast.success(`Coupon ${d.coupon.code} applied!`)
                    } else {
                      toast.error(
                        d.couponError || "Invalid or expired coupon code"
                      )
                    }
                  }}
                  className="h-8 bg-[#0ab39c] px-3 font-semibold text-white hover:bg-[#099885]"
                >
                  Apply Coupon
                </Button>
              </div>

              {discount > 0 && (
                <div className="flex items-center justify-between font-semibold text-emerald-700">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>- ₹{discount}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                <span>Net Payable</span>
                <span className="text-[#405189]">₹{payable}</span>
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-[#405189] text-sm font-semibold text-white hover:bg-[#364574]"
            >
              Pay ₹{payable} & Submit Application
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
