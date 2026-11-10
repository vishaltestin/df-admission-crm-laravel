"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { FormSelect } from "@/components/ui/form-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
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
    name: "",
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
            name: c.name || "",
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
            } else {
              toast.error("Failed to update coupon")
            }
          }}
          className="space-y-3.5"
        >
          <h4 className="border-b border-border pb-2 text-sm font-semibold">
            Edit Coupon
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">
                Coupon Code <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="h-9 font-mono text-xs uppercase"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">
                Coupon Name (Optional)
              </Label>
              <Input
                placeholder="e.g. Merit Scholarship 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Discount Type</Label>
              <FormSelect
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
                options={[
                  { value: "flat", label: "Flat Amount (₹)" },
                  { value: "percent", label: "Percentage (%)" },
                ]}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">
                Discount Value <span className="text-rose-500">*</span>
              </Label>
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
              <FormSelect
                value={form.usage_type}
                onValueChange={(v) => setForm({ ...form, usage_type: v })}
                options={[
                  { value: "single", label: "Single Use" },
                  { value: "multiple", label: "Multiple Use" },
                ]}
              />
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
              <Label className="mb-1 block text-xs">Start Date & Time</Label>
              <DateTimePicker
                value={form.start_at}
                onChange={(v) => setForm({ ...form, start_at: v })}
                placeholder="Pick start date & time"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">End Date & Time</Label>
              <DateTimePicker
                value={form.end_at}
                onChange={(v) => setForm({ ...form, end_at: v })}
                placeholder="Pick expiry date & time"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Status</Label>
              <FormSelect
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
                options={[
                  { value: "1", label: "Active" },
                  { value: "0", label: "Inactive" },
                ]}
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
