"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function ApplicationSubmissionsPage() {
  const params = useParams<{ id: string }>()
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formMeta, setFormMeta] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=application_forms")
      .then((r) => r.json())
      .then((d) => {
        const allForms = d.appForms || []
        const foundForm = allForms.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (f: any) => String(f.id) === params.id
        )
        if (foundForm) setFormMeta(foundForm)

        const all = d.submissions || []
        const filtered = all.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => String(s.lead_form_id) === params.id
        )
        setRows(filtered)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  React.useEffect(() => {
    load()
  }, [load])

  const allChecked = rows.length > 0 && selectedIds.length === rows.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? rows.map((r) => String(r.id)) : [])
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  // Exact columns from df-laravel-crm resources/views/FrontEnd/application/submissions.blade.php:
  // [Checkbox] | Lead | Mobile | Email | Fill % | Email Verified | OTP Verified | Payment | Status | Submitted At | Action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={(v) => toggleAll(Boolean(v))}
            aria-label="Select all submissions"
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(v) => toggleOne(id, Boolean(v))}
              aria-label={`Select submission #${id}`}
            />
          )
        },
      },
      {
        accessorFn: (s) => s.lead_name || "-",
        id: "lead_name",
        header: "Lead",
        cell: ({ row }) =>
          row.original.lead_id ? (
            <Link
              href={`/leads/${row.original.lead_id}`}
              className="font-semibold text-[#405189] hover:underline"
            >
              {row.original.lead_name || `Lead #${row.original.lead_id}`}
            </Link>
          ) : (
            <span className="font-medium">{row.original.lead_name || "-"}</span>
          ),
      },
      {
        accessorFn: (s) => s.lead_mobile || "-",
        id: "lead_mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.lead_mobile || "-"}</span>
        ),
      },
      {
        accessorFn: (s) => s.lead_email || "-",
        id: "lead_email",
        header: "Email",
      },
      {
        accessorFn: (s) =>
          Number(s.application_score ?? s.fill_percentage ?? 0),
        id: "fill_percentage",
        header: "Fill %",
        cell: ({ row }) => {
          const pct = Number(
            row.original.application_score ?? row.original.fill_percentage ?? 0
          )
          return (
            <Badge className="border-0 bg-sky-100 font-semibold text-[10px] text-sky-700">
              {pct}%
            </Badge>
          )
        },
      },
      {
        id: "email_verified",
        header: "Email Verified",
        accessorFn: (s) => (Number(s.email_verified) === 1 ? "Yes" : "No"),
        cell: ({ row }) =>
          Number(row.original.email_verified) === 1 ? (
            <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
              Yes
            </Badge>
          ) : (
            <span className="text-muted-foreground">No</span>
          ),
      },
      {
        id: "otp_verified",
        header: "OTP Verified",
        accessorFn: (s) => (Number(s.otp_verified) === 1 ? "Yes" : "No"),
        cell: ({ row }) =>
          Number(row.original.otp_verified) === 1 ? (
            <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
              Yes
            </Badge>
          ) : (
            <span className="text-muted-foreground">No</span>
          ),
      },
      {
        id: "payment",
        header: "Payment",
        accessorFn: (s) => Number(s.payment_amount ?? 0),
        cell: ({ row }) => {
          const s = row.original
          return (
            <div>
              <div className="font-semibold">
                ₹{Number(s.payment_amount ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {s.app_payment_method || "-"} |{" "}
                <span
                  className={
                    s.payment_status === "paid"
                      ? "font-semibold text-emerald-600 uppercase"
                      : "text-amber-600 uppercase"
                  }
                >
                  {s.app_payment_status || s.payment_status || "pending"}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorFn: (s) => s.status || "submitted",
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const st = String(row.original.status || "submitted")
          return (
            <Badge
              className={`border-0 text-[10px] font-semibold uppercase ${
                st === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : st === "rejected"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {st}
            </Badge>
          )
        },
      },
      {
        accessorFn: (s) => s.created_at || "",
        id: "created_at",
        header: "Submitted At",
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
                className="bg-[#405189] text-[11px] text-white hover:bg-[#364574]"
              >
                <Link href={`/application_submission/${s.id}`}>View</Link>
              </Button>
              <Button
                size="xs"
                variant="destructive"
                title="Delete Submission"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Application Submission?",
                    description: `Are you sure you want to permanently delete submission #${s.id} for "${s.lead_name || "Applicant"}"?`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "application_submission",
                          action: "delete",
                          id: s.id,
                        }),
                      })
                      toast.success("Submission deleted")
                      load()
                    },
                  })
                }
                className="text-[11px]"
              >
                <i className="ri-delete-bin-line" />
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChecked, selectedIds, load, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Applications Form" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Application Submissions (${rows.length})`}
          columns={columns}
          data={rows}
          loading={loading}
          searchPlaceholder="Search for..."
          emptyMessage="No submissions found."
          toolbarRight={
            <div className="flex flex-wrap items-center gap-3">
              {formMeta && (
                <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs">
                  <span>
                    <strong>Form:</strong> {formMeta.title}
                  </span>
                  <span>
                    <strong>Form ID:</strong>{" "}
                    <code className="font-mono font-bold text-[#405189]">
                      {formMeta.unique_code}
                    </code>
                  </span>
                </div>
              )}
              {selectedIds.length > 0 && (
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: `Delete ${selectedIds.length} Submission(s)?`,
                      description: `Are you sure you want to permanently delete ${selectedIds.length} selected application submission(s)?`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "application_submission",
                            action: "bulk_delete",
                            ids: selectedIds,
                          }),
                        })
                        toast.success(
                          `Deleted ${selectedIds.length} submission(s)`
                        )
                        setSelectedIds([])
                        load()
                      },
                    })
                  }
                >
                  <i className="ri-delete-bin-2-line mr-1" /> Delete (
                  {selectedIds.length})
                </Button>
              )}
              <Button asChild size="xs" variant="outline">
                <Link href="/application_forms">← Back to Forms</Link>
              </Button>
            </div>
          }
        />
      </Card>

      {DeleteDialog}
    </div>
  )
}
