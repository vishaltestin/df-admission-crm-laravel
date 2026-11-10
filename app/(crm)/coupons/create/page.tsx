"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { FormSelect } from "@/components/ui/form-select"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function CreateCouponPage() {
  const router = useRouter()
  const [form, setForm] = React.useState({
    creation_mode: "single",
    bulk_count: "10",
    code: "",
    name: "",
    type: "flat",
    value: "5000",
    min_amount: "0",
    max_discount: "",
    usage_type: "multiple",
    usage_limit: "50",
    start_at: "",
    end_at: "",
    status: "1",
  })

  return (
    <div>
      <BreadcrumbBar parent="Coupons" title="Create Coupon" />

      <Card className="max-w-2xl p-5 text-xs shadow-xs">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await fetch("/api/crm-resources", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resource: "coupons",
                action: "create",
                ...form,
              }),
            })
            if (res.ok) {
              toast.success("Coupon created!")
              router.push("/coupons")
            } else {
              toast.error("Failed to create coupon")
            }
          }}
          className="space-y-4"
        >
          <h4 className="border-b border-border pb-2 text-sm font-semibold">
            Create Coupon
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Coupon Creation Mode</Label>
              <FormSelect
                value={form.creation_mode}
                onValueChange={(v) => setForm({ ...form, creation_mode: v })}
                options={[
                  { value: "single", label: "Single Coupon" },
                  { value: "bulk", label: "Bulk Coupons" },
                ]}
              />
            </div>

            {form.creation_mode === "bulk" ? (
              <div>
                <Label className="mb-1 block text-xs">
                  Number of Coupons <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={form.bulk_count}
                  onChange={(e) =>
                    setForm({ ...form, bulk_count: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            ) : (
              <div>
                <Label className="mb-1 block text-xs">
                  Coupon Code <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="SCHOLAR50"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="h-9 font-mono text-xs uppercase"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs">
                Coupon Name (Optional)
              </Label>
              <Input
                placeholder="e.g. Merit Scholarship 2026 / Early Admission Waiver"
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
              <Label className="mb-1 block text-xs">
                Minimum Amount (₹, Optional)
              </Label>
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
              <Label className="mb-1 block text-xs">
                Max Discount (₹, Optional)
              </Label>
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

          <div className="flex justify-end gap-2 pt-2">
            <Button asChild variant="outline">
              <Link href="/coupons">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Save Coupon
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
