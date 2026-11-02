"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ProfilePage() {
  const [form, setForm] = React.useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    role: "",
    organization: "",
    new_password: "",
  })

  React.useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setForm((prev) => ({ ...prev, ...d })))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast.success("Profile updated successfully!")
      setForm((prev) => ({ ...prev, new_password: "" }))
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Account" title="My Profile" />
      <Card className="max-w-2xl p-5 shadow-xs text-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 border-b border-border pb-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-[#405189] text-lg font-bold text-white">
                {form.first_name?.slice(0, 1)}
                {form.last_name?.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-base font-bold">
                {form.first_name} {form.last_name}
              </h4>
              <p className="text-muted-foreground">
                {form.role} • {form.organization}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm({ ...form, first_name: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm({ ...form, last_name: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Email (Login ID)</Label>
              <Input
                disabled
                value={form.email}
                className="h-9 bg-muted text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Mobile Number</Label>
              <Input
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-1 block text-xs">
                Change Password (leave blank to keep current)
              </Label>
              <Input
                type="password"
                value={form.new_password}
                onChange={(e) =>
                  setForm({ ...form, new_password: e.target.value })
                }
                placeholder="Enter new password"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            Update Profile
          </Button>
        </form>
      </Card>
    </div>
  )
}
