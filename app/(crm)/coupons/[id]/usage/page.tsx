"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function CouponUsageLogsPage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [coupon, setCoupon] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [usages, setUsages] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch("/api/crm-resources?resource=coupons")
      .then((r) => r.json())
      .then((d) => {
        const c = (d.items || []).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (i: any) => String(i.id) === String(params.id)
        )
        setCoupon(c)
        setUsages(
          (d.usages || []).filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (u: any) => String(u.coupon_id) === String(params.id)
          )
        )
      })
  }, [params.id])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (u) => u.lead_id || "",
        id: "lead_id",
        header: "Lead ID",
        cell: ({ row }) =>
          row.original.lead_id ? (
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              Lead #{row.original.lead_id}
            </Link>
          ) : (
            "-"
          ),
      },
      {
        accessorFn: (u) => Number(u.order_amount ?? 0),
        id: "order_amount",
        header: "Order Amount",
        cell: ({ row }) => `₹${row.original.order_amount ?? 0}`,
      },
      {
        accessorFn: (u) => Number(u.discount_amount ?? 0),
        id: "discount_amount",
        header: "Discount Applied",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700">
            - ₹{row.original.discount_amount ?? 0}
          </span>
        ),
      },
      {
        accessorFn: (u) => u.used_at || u.created_at || "",
        id: "used_at",
        header: "Used At",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.used_at || row.original.created_at
              ? new Date(
                  row.original.used_at || row.original.created_at
                ).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div>
      <BreadcrumbBar parent="Coupons" title="Coupon Usage Logs" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          title={
            <span>
              Coupon Usage Logs —{" "}
              <span className="font-mono text-[#405189]">
                {coupon?.code || `#${params.id}`}
              </span>
            </span>
          }
          columns={columns}
          data={usages}
          searchPlaceholder="Search usage logs..."
          emptyMessage="No redemptions logged yet for this coupon. Apply it from Lead Detail → Coupons!"
          toolbarRight={
            <Button asChild size="xs" variant="outline">
              <Link href="/coupons">← Back to Coupons</Link>
            </Button>
          }
        />
      </Card>
    </div>
  )
}
