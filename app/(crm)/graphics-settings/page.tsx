"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const THEME_PRESETS = [
  {
    name: "Velzon Indigo (Default)",
    primary: "#405189",
    secondary: "#0ab39c",
    sidebar: "#405189",
    topbar: "#ffffff",
  },
  {
    name: "Emerald Campus",
    primary: "#059669",
    secondary: "#0284c7",
    sidebar: "#064e3b",
    topbar: "#ffffff",
  },
  {
    name: "Royal University Navy",
    primary: "#1e3a8a",
    secondary: "#d97706",
    sidebar: "#172554",
    topbar: "#ffffff",
  },
  {
    name: "Crimson Heritage",
    primary: "#9f1239",
    secondary: "#0f766e",
    sidebar: "#4c0519",
    topbar: "#ffffff",
  },
  {
    name: "Midnight Slate",
    primary: "#334155",
    secondary: "#10b981",
    sidebar: "#0f172a",
    topbar: "#f8fafc",
  },
]

export default function GraphicsSettingsPage() {
  const [form, setForm] = React.useState({
    primary_color: "#405189",
    secondary_color: "#0ab39c",
    sidebar_color: "#405189",
    topbar_color: "#ffffff",
    logo_path: "",
    favicon_path: "",
    login_bg_path: "",
    custom_footer_text:
      "© 2026 Digital Fueled IT Pvt. Ltd. — Admissions & LMS CRM",
  })

  React.useEffect(() => {
    fetch("/api/settings-integrations?type=graphics")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          const s = d.settings
          setForm({
            primary_color: s.primary_color || "#405189",
            secondary_color: s.secondary_color || "#0ab39c",
            sidebar_color: s.sidebar_color || "#405189",
            topbar_color: s.topbar_color || "#ffffff",
            logo_path: s.logo_path || "",
            favicon_path: s.favicon_path || "",
            login_bg_path: s.login_bg_path || "",
            custom_footer_text:
              s.custom_footer_text ||
              "© 2026 Digital Fueled IT Pvt. Ltd. — Admissions & LMS CRM",
          })
        }
      })
  }, [])

  function handleImageUpload(
    key: "logo_path" | "favicon_path" | "login_bg_path",
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, [key]: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <BreadcrumbBar parent="Settings" title="Graphics & Branding Settings" />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        <Card className="p-5 shadow-xs lg:col-span-8">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/settings-integrations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "graphics", ...form }),
              })
              if (res.ok)
                toast.success("Graphics & branding theme saved!")
            }}
            className="space-y-4"
          >
            <h4 className="border-b border-border pb-2 text-sm font-bold">
              Theme Palette, Brand Logos & Login Background
            </h4>

            {/* Quick Presets */}
            <div>
              <Label className="mb-1.5 block text-xs font-semibold">
                1-Click Theme Presets
              </Label>
              <div className="flex flex-wrap gap-2">
                {THEME_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        primary_color: p.primary,
                        secondary_color: p.secondary,
                        sidebar_color: p.sidebar,
                        topbar_color: p.topbar,
                      })
                    }
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium hover:bg-muted"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: p.secondary }}
                    />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "primary_color", label: "Primary Brand Color" },
                { key: "secondary_color", label: "Accent / Action Color" },
                { key: "sidebar_color", label: "Sidebar Background" },
                { key: "topbar_color", label: "Topbar Background" },
              ].map((c) => (
                <div key={c.key}>
                  <Label className="mb-1 block text-xs">{c.label}</Label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={(form as Record<string, string>)[c.key]}
                      onChange={(e) =>
                        setForm({ ...form, [c.key]: e.target.value })
                      }
                      className="h-9 w-11 cursor-pointer rounded border border-input p-0.5"
                    />
                    <Input
                      value={(form as Record<string, string>)[c.key]}
                      onChange={(e) =>
                        setForm({ ...form, [c.key]: e.target.value })
                      }
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Brand Asset Uploads */}
            <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-3">
              <div className="rounded-md border border-border p-3 space-y-2">
                <Label className="block text-xs font-semibold">
                  Main Brand Logo
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("logo_path", e)}
                  className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-[#405189] file:px-2 file:py-1 file:text-[11px] file:text-white"
                />
                {form.logo_path && form.logo_path.startsWith("data:image") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logo_path}
                    alt="Logo"
                    className="h-10 rounded border border-border bg-white object-contain p-1"
                  />
                )}
              </div>

              <div className="rounded-md border border-border p-3 space-y-2">
                <Label className="block text-xs font-semibold">
                  Browser Favicon
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("favicon_path", e)}
                  className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-[#405189] file:px-2 file:py-1 file:text-[11px] file:text-white"
                />
                {form.favicon_path &&
                  form.favicon_path.startsWith("data:image") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.favicon_path}
                      alt="Favicon"
                      className="h-8 w-8 rounded border border-border bg-white object-contain p-1"
                    />
                  )}
              </div>

              <div className="rounded-md border border-border p-3 space-y-2">
                <Label className="block text-xs font-semibold">
                  Login Page Banner
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("login_bg_path", e)}
                  className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-[#405189] file:px-2 file:py-1 file:text-[11px] file:text-white"
                />
                {form.login_bg_path &&
                  form.login_bg_path.startsWith("data:image") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.login_bg_path}
                      alt="Login Bg"
                      className="h-10 w-full rounded border border-border object-cover"
                    />
                  )}
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">
                Custom Footer Copyright Text
              </Label>
              <Input
                value={form.custom_footer_text}
                onChange={(e) =>
                  setForm({ ...form, custom_footer_text: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
              >
                Save Graphics & Branding
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, ...THEME_PRESETS[0] }))}
              >
                Reset Default Colors
              </Button>
            </div>
          </form>
        </Card>

        {/* Live Theme Shell Preview */}
        <Card className="h-fit space-y-3 p-5 shadow-xs lg:col-span-4">
          <h4 className="border-b border-border pb-2 text-sm font-bold">
            Live Shell Preview
          </h4>
          <div className="overflow-hidden rounded-lg border border-border shadow-sm">
            <div className="flex h-48">
              <div
                className="w-16 p-2 text-white space-y-2"
                style={{ backgroundColor: form.sidebar_color }}
              >
                <div className="rounded bg-white/20 py-1 text-center font-bold text-[10px]">
                  DF
                </div>
                <div className="h-2 rounded bg-white/40" />
                <div className="h-2 rounded bg-white/25" />
                <div className="h-2 rounded bg-white/25" />
              </div>
              <div className="flex flex-1 flex-col bg-slate-50">
                <div
                  className="flex h-8 items-center justify-between border-b border-slate-200 px-3"
                  style={{ backgroundColor: form.topbar_color }}
                >
                  <span className="h-2 w-16 rounded bg-slate-300" />
                  <span
                    className="rounded px-2 py-0.5 text-[9px] font-bold text-white"
                    style={{ backgroundColor: form.secondary_color }}
                  >
                    + Add Lead
                  </span>
                </div>
                <div className="flex-1 p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="rounded p-2 text-white"
                      style={{ backgroundColor: form.primary_color }}
                    >
                      <div className="text-[9px] opacity-80">Total Leads</div>
                      <div className="text-sm font-bold">1,248</div>
                    </div>
                    <div
                      className="rounded p-2 text-white"
                      style={{ backgroundColor: form.secondary_color }}
                    >
                      <div className="text-[9px] opacity-80">Converted</div>
                      <div className="text-sm font-bold">312</div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-400 truncate">
                  {form.custom_footer_text}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
