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

type FieldRow = {
  field: string
  value: string
}

export default function ApplicationSubmissionViewPage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [submission, setSubmission] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formMeta, setFormMeta] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = React.useState<any>(null)

  const load = React.useCallback(() => {
    fetch(`/api/crm-resources?resource=application_submission&id=${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setSubmission(d.submission)
        setFormMeta(d.form)
        setLead(d.lead)
      })
  }, [params.id])

  React.useEffect(() => {
    load()
  }, [load])

  const fieldRows = React.useMemo<FieldRow[]>(() => {
    if (!submission?.response_json) return []
    try {
      const parsed =
        typeof submission.response_json === "string"
          ? JSON.parse(submission.response_json)
          : submission.response_json
      return Object.entries(parsed || {}).map(([k, v]) => ({
        field: k
          .replace(/_/g, " ")
          .replace(/\b\w/g, (ch) => ch.toUpperCase()),
        value:
          typeof v === "object" && v !== null
            ? JSON.stringify(v)
            : String(v ?? "-"),
      }))
    } catch {
      return [{ field: "Raw Response", value: String(submission.response_json) }]
    }
  }, [submission])

  const columns = React.useMemo<ColumnDef<FieldRow>[]>(
    () => [
      {
        accessorKey: "field",
        header: "Field",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.field}
          </span>
        ),
      },
      {
        accessorKey: "value",
        header: "Submitted Value",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.value}</span>
        ),
      },
    ],
    []
  )

  async function updateSubmission(patch: {
    status?: string
    payment_status?: string
  }) {
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "application_submission",
        action: "update_status",
        id: params.id,
        ...patch,
      }),
    })
    if (res.ok) {
      toast.success("Application submission updated!")
      load()
    }
  }

  return (
    <div>
      <BreadcrumbBar
        parent="Application Submissions"
        title={`Submission #${params.id}`}
      />

      <div className="space-y-4 text-xs">
        <Card className="p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold">
                {formMeta?.title || "Application Submission"} — #{params.id}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Applicant:{" "}
                <strong>{lead?.name || `Lead #${submission?.lead_id || "-"}`}</strong>{" "}
                • {lead?.mobile || ""} {lead?.email ? `• ${lead.email}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {submission?.lead_form_id && (
                <Button asChild size="xs" variant="outline">
                  <Link
                    href={`/application_form_submissions/${submission.lead_form_id}`}
                  >
                    ← Back to Submissions
                  </Link>
                </Button>
              )}
              {submission?.lead_id && (
                <Button
                  asChild
                  size="xs"
                  className="bg-[#405189] text-white hover:bg-[#364574]"
                >
                  <Link href={`/leads/${submission.lead_id}`}>
                    👤 Open Lead Profile
                  </Link>
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                onClick={() => window.print()}
              >
                🖨 Print Application
              </Button>
              {submission?.payment_status !== "paid" && (
                <Button
                  size="xs"
                  onClick={() => updateSubmission({ payment_status: "paid" })}
                  className="bg-[#299cdb] text-white hover:bg-[#2389c2]"
                >
                  💳 Mark Fee Paid
                </Button>
              )}
              <Button
                size="xs"
                onClick={() => updateSubmission({ status: "approved" })}
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                ✓ Approve Application
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() => updateSubmission({ status: "rejected" })}
              >
                ✕ Reject
              </Button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-[10px] text-muted-foreground">Form Code</div>
              <div className="font-mono font-bold">
                {formMeta?.unique_code || "-"}
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-[10px] text-muted-foreground">
                Completion
              </div>
              <div className="font-bold">
                {submission?.fill_percentage ?? 100}%
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-[10px] text-muted-foreground">
                Application Fee
              </div>
              <div className="font-bold text-emerald-700">
                ₹{Number(formMeta?.total_amount || 0).toLocaleString("en-IN")}
              </div>
            </div>
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-[10px] text-muted-foreground">
                Payment Status
              </div>
              <Badge
                className={`mt-0.5 text-[10px] uppercase ${
                  submission?.payment_status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {submission?.payment_status || "unpaid"}
              </Badge>
            </div>
            <div className="rounded-md bg-muted/40 p-2.5">
              <div className="text-[10px] text-muted-foreground">
                Review Status
              </div>
              <Badge
                className={`mt-0.5 text-[10px] uppercase ${
                  submission?.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : submission?.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {submission?.status || "submitted"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="gap-0 py-0 shadow-xs">
          <DataTable
            title="Submitted Form Fields & Responses"
            columns={columns}
            data={fieldRows}
            searchPlaceholder="Search field or value..."
            emptyMessage="No response payload recorded."
          />
        </Card>
      </div>
    </div>
  )
}
