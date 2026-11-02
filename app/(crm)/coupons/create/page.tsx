"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
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
            }
          }}
          className="space-y-4"
        >
          <h4 className="border-b border-border pb-2 text-sm font-semibold">
            New Fee Waiver / Discount Coupon
          </h4>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1 block text-xs">Creation Mode</Label>
              <select
                value={form.creation_mode}
                onChange={(e) =>
                  setForm({ ...form, creation_mode: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="single">Single Coupon</option>
                <option value="bulk">Bulk Generate</option>
              </select>
            </div>
            {form.creation_mode === "bulk" ? (
              <div>
                <Label className="mb-1 block text-xs">Number of Coupons *</Label>
                <Input
                  type="number"
                  min={2}
                  max={100}
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
                <Label className="mb-1 block text-xs">Coupon Code *</Label>
                <Input
                  required
                  placeholder="SCHOLAR50"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="h-9 font-mono uppercase text-xs"
                />
              </div>
            )}
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button asChild variant="outline">
              <Link href="/coupons">Cancel</Link>
            </Button>
            <Button
              type="submit"
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              Create Coupon
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
