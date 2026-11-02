"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [resetUrl, setResetUrl] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email }),
    })
    const out = await res.json()
    setLoading(false)
    if (res.ok) {
      setResetUrl(out.resetUrl)
      toast.success("Password reset token generated!")
    } else {
      toast.error(out.error || "Unable to generate reset link")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f9] px-4">
      <Card className="w-full max-w-md border-slate-200 bg-white p-6 shadow-md text-xs text-slate-800 gap-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-[#405189]">Forgot Password?</h2>
          <p className="text-slate-500">
            Enter your registered LMS CRM email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs font-semibold">
              Email Address
            </Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dfcrm.com"
              className="h-9 text-xs"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-9 w-full bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {resetUrl && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-1.5">
            <div className="font-semibold text-emerald-800">
              Reset Link Generated:
            </div>
            <Link
              href={resetUrl}
              className="block break-all font-mono text-[#405189] underline"
            >
              {resetUrl}
            </Link>
          </div>
        )}

        <div className="text-center pt-1">
          <Link href="/login" className="font-semibold text-[#405189]">
            ← Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  )
}
