"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function toLocalInput(dt?: string | null): string {
  if (!dt) return ""
  const d = new Date(dt)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export default function EditCouponPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [form, setForm] = React.useState({
    code: "",
    type: "flat",
    value: "500",
    min_amount: "0",
    max_discount: "",
    usage_type: "multiple",
    usage_limit: "100",
    start_at: "",
    end_at: "",
    status: "1",
  })

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=coupons")
      .then((r) => r.json())
      .then((d) => {
        const c = (d.items || []).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => String(item.id) === String(params.id)
        )
        if (c) {
          setForm({
            code: c.code || "",
            type: c.type || "flat",
            value: String(c.value ?? 0),
            min_amount: String(c.min_amount ?? 0),
            max_discount: c.max_discount ? String(c.max_discount) : "",
            usage_type: c.usage_type || "multiple",
            usage_limit: c.usage_limit ? String(c.usage_limit) : "",
            start_at: toLocalInput(c.start_at),
            end_at: toLocalInput(c.end_at),
            status: String(c.status ?? 1),
          })
        }
      })
  }, [params.id])

  return (
    <div>
      <BreadcrumbBar parent="Coupons" title="Edit Coupon" />
      <Card className="max-w-2xl p-5 text-xs shadow-xs">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await fetch("/api/crm-resources", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resource: "coupons",
                action: "update",
                id: params.id,
                ...form,
              }),
            })
            if (res.ok) {
              toast.success("Coupon updated!")
              router.push("/coupons")
            }
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Coupon Code *</Label>
              <Input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="h-9 font-mono uppercase text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Discount Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="flat">Flat Amount (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Discount Value *</Label>
              <Input
                type="number"
                required
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Min Order Amount (₹)</Label>
              <Input
                type="number"
                value={form.min_amount}
                onChange={(e) =>
                  setForm({ ...form, min_amount: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Max Discount (₹)</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={form.max_discount}
                onChange={(e) =>
                  setForm({ ...form, max_discount: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Usage Type</Label>
              <select
                value={form.usage_type}
                onChange={(e) =>
                  setForm({ ...form, usage_type: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="single">Single Use</option>
                <option value="multiple">Multiple Use</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Usage Limit</Label>
              <Input
                type="number"
                disabled={form.usage_type === "single"}
                value={form.usage_type === "single" ? "1" : form.usage_limit}
                onChange={(e) =>
                  setForm({ ...form, usage_limit: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Status</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Start Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">End Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="bg-[#405189] font-semibold text-white hover:bg-[#364574]"
            >
              Update Coupon
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/coupons")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
