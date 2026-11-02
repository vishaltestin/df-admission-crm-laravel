"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const QUOTES = [
  '" Great! Clean code, clean design, easy for customization. Thanks very much! "',
  '" The theme is really great with an amazing customer support."',
  '" Streamlined admission counselling, omni-channel follow-ups, and higher conversions! "',
]

export function LoginView() {
  const router = useRouter()
  const [email, setEmail] = React.useState("admin@dfcrm.com")
  const [password, setPassword] = React.useState("Admin@123")
  const [showPassword, setShowPassword] = React.useState(false)
  const [remember, setRemember] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [slide, setSlide] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % QUOTES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials.")
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Unable to sign in right now. Please try again.")
      setLoading(false)
    }
  }

  function fillDemo(demoEmail: string, demoPass: string) {
    setEmail(demoEmail)
    setPassword(demoPass)
    setError("")
  }

  return (
    <div className="auth-bg-cover relative flex min-h-screen flex-col justify-between py-8">
      <div className="pointer-events-none absolute inset-0 bg-black/25" />

      <div className="relative z-10 mx-auto my-auto w-full max-w-5xl px-4">
        <Card className="gap-0 overflow-hidden rounded-lg border-0 bg-white py-0 shadow-2xl dark:bg-[#212529]">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Cover Column */}
            <div className="auth-one-bg relative flex flex-col justify-between p-8 text-white lg:col-span-6 lg:p-10">
              <div>
                <div className="inline-flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-md bg-[#0ab39c] text-lg font-bold text-white shadow">
                    DF
                  </div>
                  <span className="text-xl font-bold tracking-wide text-white">
                    LMS <span className="font-normal text-white/75">CRM</span>
                  </span>
                </div>
              </div>

              <div className="mt-16">
                <div className="mb-3">
                  <i className="ri-double-quotes-l text-5xl text-[#0ab39c]" />
                </div>

                <div className="min-h-[68px] text-center text-[15px] italic text-white/80 transition-all">
                  {QUOTES[slide]}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2">
                  {QUOTES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        slide === idx ? "w-7 bg-[#0ab39c]" : "w-3 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Login Form Column */}
            <div className="p-8 lg:col-span-6 lg:p-10">
              <div>
                <h5 className="text-lg font-semibold text-[#405189] dark:text-indigo-400">
                  Welcome Back !
                </h5>
                <p className="mt-0.5 text-sm text-[#878a99]">
                  Sign in to continue to LMS.
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded border border-[#f06548]/30 bg-[#f06548]/10 px-3.5 py-2.5 text-sm text-[#f06548]">
                  <i className="ri-error-warning-line mr-1.5 align-middle" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email" className="mb-1.5 block text-sm">
                    Username <span className="text-[#f06548]">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <Label htmlFor="password-input" className="block text-sm">
                      Password <span className="text-[#f06548]">*</span>
                    </Label>
                    <Link
                      href="/password/forgot"
                      className="text-xs text-[#878a99] hover:text-[#405189] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-10 pr-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-1 right-1 text-[#878a99] hover:text-foreground"
                      aria-label="Toggle password visibility"
                    >
                      <i
                        className={
                          showPassword ? "ri-eye-off-fill" : "ri-eye-fill"
                        }
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="auth-remember-check"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                    className="data-[state=checked]:border-[#405189] data-[state=checked]:bg-[#405189]"
                  />
                  <Label
                    htmlFor="auth-remember-check"
                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 h-10 w-full bg-[#0ab39c] text-sm font-medium text-white shadow-sm hover:bg-[#099885]"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              {/* Quick Demo Account Switcher */}
              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quick Demo Accounts (Click to Fill)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    onClick={() => fillDemo("admin@dfcrm.com", "Admin@123")}
                    className="cursor-pointer border-[#405189]/30 bg-[#405189]/10 px-2.5 py-1 text-xs font-medium text-[#405189] hover:bg-[#405189]/20 dark:text-indigo-300"
                  >
                    Super Admin
                  </Badge>
                  <Badge
                    variant="outline"
                    onClick={() => fillDemo("manager@dfcrm.com", "Manager@123")}
                    className="cursor-pointer border-[#299cdb]/30 bg-[#299cdb]/10 px-2.5 py-1 text-xs font-medium text-[#299cdb] hover:bg-[#299cdb]/20"
                  >
                    Manager
                  </Badge>
                  <Badge
                    variant="outline"
                    onClick={() => fillDemo("priya@dfcrm.com", "User@123")}
                    className="cursor-pointer border-[#0ab39c]/30 bg-[#0ab39c]/10 px-2.5 py-1 text-xs font-medium text-[#0ab39c] hover:bg-[#0ab39c]/20"
                  >
                    Counsellor (Priya)
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <footer className="relative z-10 mt-6 text-center text-xs text-white/80">
        {new Date().getFullYear()} LMS. Crafted with{" "}
        <i className="ri-heart-fill text-[#f06548]" /> by Digital Fueled IT Pvt.
        Ltd.
      </footer>
    </div>
  )
}
