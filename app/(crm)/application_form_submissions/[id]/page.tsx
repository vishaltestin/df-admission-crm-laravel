"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function ApplicationSubmissionsPage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = React.useState<any[]>([])

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=application_forms")
      .then((r) => r.json())
      .then((d) => {
        const all = d.submissions || []
        const filtered = all.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => String(s.lead_form_id) === params.id
        )
        setRows(filtered.length > 0 ? filtered : all)
      })
  }, [params.id])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorFn: (s) => `${s.lead_name || ""} #${s.lead_id}`,
        id: "lead",
        header: "Applicant / Lead",
        cell: ({ row }) => (
          <div>
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              {row.original.lead_name || `Lead #${row.original.lead_id}`}
            </Link>
            <div className="font-mono text-[10px] text-muted-foreground">
              {row.original.lead_mobile || ""}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "fill_percentage",
        header: "Fill %",
        cell: ({ row }) => (
          <Badge className="bg-sky-100 text-[10px] font-semibold text-sky-700 hover:bg-sky-200">
            {row.original.fill_percentage}%
          </Badge>
        ),
      },
      {
        accessorKey: "payment_status",
        header: "Payment Status",
        cell: ({ row }) => (
          <Badge
            className={`text-[10px] font-semibold uppercase ${
              row.original.payment_status === "paid"
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            }`}
          >
            {row.original.payment_status}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Application Status",
        cell: ({ row }) => (
          <Badge
            className={`text-[10px] font-semibold uppercase ${
              row.original.status === "approved"
                ? "bg-emerald-100 text-emerald-700"
                : row.original.status === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorFn: (s) => s.created_at || "",
        id: "created_at",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleString("en-IN")
              : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                asChild
                size="xs"
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                <Link href={`/application_submission/${s.id}`}>
                  👁 View Submission
                </Link>
              </Button>
              {s.status !== "approved" && (
                <Button
                  size="xs"
                  onClick={async () => {
                    await fetch("/api/crm-resources", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource: "application_submission",
                        action: "update_status",
                        id: s.id,
                        status: "approved",
                      }),
                    })
                    toast.success("Application approved!")
                    load()
                  }}
                  className="bg-[#0ab39c] text-[11px] text-white hover:bg-[#099885]"
                >
                  Approve
                </Button>
              )}
              <Button asChild size="xs" variant="outline" className="text-[11px]">
                <Link href={`/leads/${s.lead_id}`}>Lead Profile</Link>
              </Button>
            </div>
          )
        },
      },
    ],
    [load]
  )

  return (
    <div>
      <BreadcrumbBar
        parent="Application Forms"
        title={`Submissions for Form #${params.id}`}
      />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Application Form Submissions (${rows.length})`}
          columns={columns}
          data={rows}
          searchPlaceholder="Search applicant name, mobile, status..."
          emptyMessage="No student submissions recorded yet."
          toolbarRight={
            <Button asChild size="xs" variant="outline">
              <Link href="/application_forms">← Back to Forms</Link>
            </Button>
          }
        />
      </Card>
    </div>
  )
}
