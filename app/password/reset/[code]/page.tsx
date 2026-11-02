"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reset",
        code: params.code,
        password,
      }),
    })
    const out = await res.json()
    if (res.ok) {
      toast.success("Password updated! Please sign in.")
      router.push("/login")
    } else {
      toast.error(out.error || "Invalid or expired reset token")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f3f9] px-4">
      <Card className="w-full max-w-md border-slate-200 bg-white p-6 shadow-md text-xs text-slate-800 gap-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-[#405189]">
            Create New Password
          </h2>
          <p className="font-mono text-[11px] text-slate-500">
            Token: {params.code}
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-3">
          <div>
            <Label className="mb-1 block text-xs font-semibold">
              New Password *
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold">
              Confirm Password *
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <Button
            type="submit"
            className="h-9 w-full bg-[#405189] font-semibold text-white hover:bg-[#364574]"
          >
            Reset Password
          </Button>
        </form>

        <div className="text-center">
          <Link href="/login" className="font-semibold text-[#405189]">
            ← Return to Login
          </Link>
        </div>
      </Card>
    </div>
  )
}
