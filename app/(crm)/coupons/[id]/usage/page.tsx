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
  const [loading, setLoading] = React.useState(true)
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
      .finally(() => setLoading(false))
  }, [params.id])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "#",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.id}</span>
        ),
      },
      {
        accessorKey: "coupon_code",
        header: "Coupon Code",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[#405189]">
            {row.original.coupon_code || coupon?.code || "-"}
          </span>
        ),
      },
      {
        accessorKey: "user_name",
        header: "Used By (User)",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user_name || "-"}</span>
        ),
      },
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
              #{row.original.lead_id}
              {row.original.lead_name ? ` (${row.original.lead_name})` : ""}
            </Link>
          ) : (
            "-"
          ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile || "-"}</span>
        ),
      },
      {
        accessorFn: (u) => Number(u.order_amount ?? 0),
        id: "order_amount",
        header: "Amount",
        cell: ({ row }) =>
          `₹${Number(row.original.order_amount ?? 0).toLocaleString("en-IN")}`,
      },
      {
        accessorFn: (u) => Number(u.discount_amount ?? 0),
        id: "discount_amount",
        header: "Discount",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            ₹{Number(row.original.discount_amount ?? 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "ip_address",
        header: "IP",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.ip_address || "-"}
          </span>
        ),
      },
      {
        accessorFn: (u) => u.used_at || u.created_at || "",
        id: "used_at",
        header: "Used At",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.used_at || row.original.created_at
              ? new Date(
                  row.original.used_at || row.original.created_at
                ).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
    ],
    [coupon]
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
              {coupon?.name ? (
                <span className="ml-1.5 font-normal text-muted-foreground">
                  ({coupon.name})
                </span>
              ) : null}
            </span>
          }
          columns={columns}
          data={usages}
          loading={loading}
          searchPlaceholder="Search usage logs by user, lead, mobile..."
          emptyMessage="No usage found for this coupon yet."
          toolbarRight={
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link href="/coupons">← Back to Coupons</Link>
            </Button>
          }
        />
      </Card>
    </div>
  )
}
