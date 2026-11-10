"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/serialize"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ApplicationSubmissionViewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { confirmDelete, DeleteDialog } = useConfirmDelete()

  const [initialLoading, setInitialLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [payload, setPayload] = React.useState<any>(null)

  const load = React.useCallback(
    (silent = false) => {
      if (!silent) setInitialLoading(true)
      fetch(`/api/crm-resources?resource=application_submission&id=${params.id}`)
        .then((r) => r.json())
        .then((d) => setPayload(d))
        .finally(() => setInitialLoading(false))
    },
    [params.id]
  )

  React.useEffect(() => {
    load(false)
  }, [load])

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
      load(true)
    }
  }

  if (initialLoading && !payload) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-44" />
        <Card className="gap-4 p-5 shadow-xs">
          <Skeleton className="h-6 w-72" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        </Card>
        <Card className="gap-3 p-5 shadow-xs">
          <Skeleton className="h-5 w-48" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </Card>
      </div>
    )
  }

  const submission = payload?.submission
  const formMeta = payload?.form
  const lead = payload?.lead
  const documents = payload?.documents || []
  const counsellor = payload?.assignedCounsellor
  const lookups = payload?.lookups || {}

  if (!submission) {
    return (
      <Card className="p-8 text-center shadow-xs">
        <h3 className="text-sm font-semibold">Submission Not Found</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          This application submission may have been removed.
        </p>
        <div className="mt-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/application_forms">Back to Application Forms</Link>
          </Button>
        </div>
      </Card>
    )
  }

  // Resolve IDs in response_json to human-readable Country, State, City, Institute, Programme, Course names
  const resolveValue = (key: string, val: unknown): string => {
    if (val === null || val === undefined || String(val).trim() === "") {
      return "-"
    }
    if (typeof val === "object") {
      return JSON.stringify(val, null, 2)
    }
    const raw = String(val)
    const lowerKey = key.toLowerCase()

    const matchById = (list: Array<{ id: number | string; name: string }> = []) => {
      const found = list.find((item) => String(item.id) === raw)
      return found ? `${found.name} (ID: ${raw})` : raw
    }

    if (lowerKey === "country" || lowerKey === "country_id") {
      return matchById(lookups.countries)
    }
    if (lowerKey === "state" || lowerKey === "state_id") {
      return matchById(lookups.states)
    }
    if (lowerKey === "city" || lowerKey === "city_id") {
      return matchById(lookups.cities)
    }
    if (lowerKey === "institute" || lowerKey === "institute_id") {
      return matchById(lookups.institutes)
    }
    if (
      lowerKey === "programme" ||
      lowerKey === "program" ||
      lowerKey === "programme_id" ||
      lowerKey === "program_id"
    ) {
      return matchById(lookups.programs)
    }
    if (
      lowerKey === "course" ||
      lowerKey === "faculty" ||
      lowerKey === "course_id" ||
      lowerKey === "faculty_id"
    ) {
      return matchById(lookups.courses)
    }
    return raw
  }

  let parsedObj: Record<string, unknown> = {}
  try {
    parsedObj =
      typeof submission.response_json === "string"
        ? JSON.parse(submission.response_json)
        : submission.response_json || {}
  } catch {
    parsedObj = { raw_response: submission.response_json }
  }

  const filledEntries = Object.entries(parsedObj).filter(
    ([k, v]) => !(k.toLowerCase() === "captcha" && (v === null || v === ""))
  )

  const formFees = Number(formMeta?.fees ?? 0)
  const formTax = Number(formMeta?.tax ?? 0)
  const formTotal = Number(
    formMeta?.total_amount ?? formFees + (formFees * formTax) / 100
  )
  const paidAmount = Number(submission.payment_amount ?? 0)
  const fillPct = Number(submission.fill_percentage ?? 0)

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Submission View" />

      <div className="space-y-4 text-xs">
        {/* TOP ACTION & HEADER CARD */}
        <Card className="gap-4 p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3.5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold">
                  Submission Details — #{submission.id}
                </h3>
                <Badge
                  className={`border-0 text-[10px] uppercase ${
                    submission.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : submission.status === "rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-[#405189]/10 text-[#405189]"
                  }`}
                >
                  {submission.status || "submitted"}
                </Badge>
                <Badge
                  className={`border-0 text-[10px] uppercase ${
                    submission.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  Payment: {submission.payment_status || "unpaid"}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                Form:{" "}
                <strong>{formMeta?.title || `Form #${submission.lead_form_id}`}</strong>{" "}
                ({formMeta?.unique_code || "-"}) • Applicant:{" "}
                <strong>
                  {lead?.name ||
                    String(parsedObj.name || `Lead #${submission.lead_id}`)}
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="xs" variant="outline">
                <Link
                  href={`/application_form_submissions/${submission.lead_form_id}`}
                >
                  ← Back to Submissions
                </Link>
              </Button>
              {submission.lead_id > 0 && (
                <Button
                  asChild
                  size="xs"
                  className="bg-[#405189] text-white hover:bg-[#364574]"
                >
                  <Link href={`/leads/${submission.lead_id}`}>
                    <i className="ri-user-3-line mr-1" /> Lead Profile
                  </Link>
                </Button>
              )}
              {formMeta?.unique_code && submission.lead_id > 0 && (
                <Button asChild size="xs" variant="outline">
                  <a
                    href={`/application_form_show/${formMeta.unique_code}/${submission.lead_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="ri-external-link-line mr-1" /> Open Form Portal
                  </a>
                </Button>
              )}
              <Button
                size="xs"
                variant="outline"
                onClick={() => window.print()}
              >
                <i className="ri-printer-line mr-1" /> Print
              </Button>
              {submission.payment_status !== "paid" && (
                <Button
                  size="xs"
                  onClick={() => updateSubmission({ payment_status: "paid" })}
                  className="bg-[#299cdb] text-white hover:bg-[#2389c2]"
                >
                  <i className="ri-bank-card-line mr-1" /> Mark Fee Paid
                </Button>
              )}
              <Button
                size="xs"
                onClick={() => updateSubmission({ status: "approved" })}
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                <i className="ri-check-line mr-1" /> Approve
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => updateSubmission({ status: "rejected" })}
                className="border-rose-300 text-rose-600 hover:bg-rose-50"
              >
                <i className="ri-close-line mr-1" /> Reject
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Application Submission?",
                    description: `Are you sure you want to permanently delete Submission #${submission.id}? This action cannot be undone.`,
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "application_submission",
                          action: "delete",
                          id: submission.id,
                        }),
                      })
                      if (res.ok) {
                        toast.success("Application submission deleted")
                        router.push(
                          `/application_form_submissions/${submission.lead_form_id}`
                        )
                      }
                    },
                  })
                }
              >
                <i className="ri-delete-bin-line mr-1" /> Delete
              </Button>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                Application Progress (Step{" "}
                <strong>{submission.current_step || 1}</strong>)
              </span>
              <span className="font-bold text-[#0ab39c]">
                {fillPct}% Completed
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[#0ab39c] transition-all"
                style={{ width: `${Math.min(100, fillPct)}%` }}
              />
            </div>
          </div>

          {/* 2-COLUMN SUMMARY GRID: METADATA + PAYMENT */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Submission & Verification Metadata */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5">
              <h4 className="mb-2.5 border-b border-border pb-1.5 text-xs font-bold uppercase tracking-wide text-[#405189]">
                Submission &amp; Verification Info
              </h4>
              <div className="space-y-1.5">
                {[
                  ["Submission ID", `#${submission.id}`],
                  [
                    "Form ID & Code",
                    `#${submission.lead_form_id} (${formMeta?.unique_code || "-"})`,
                  ],
                  [
                    "Lead ID",
                    submission.lead_id ? `#${submission.lead_id}` : "-",
                  ],
                  [
                    "Applicant Contact",
                    `${lead?.mobile || parsedObj.mobile || "-"} • ${lead?.email || parsedObj.email || "-"}`,
                  ],
                  [
                    "Email Verified",
                    Number(submission.email_verified) === 1 ? "Yes ✓" : "No",
                  ],
                  [
                    "Mobile OTP Verified",
                    Number(submission.otp_verified) === 1 ? "Yes ✓" : "No",
                  ],
                  [
                    "Assigned Counsellor",
                    counsellor
                      ? `${counsellor.first_name || ""} ${counsellor.last_name || ""} (${counsellor.email})`.trim()
                      : "Unassigned",
                  ],
                  ["Submitted At", formatDateTime(submission.created_at)],
                  ["Last Updated", formatDateTime(submission.updated_at)],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 border-b border-border/40 py-1 last:border-0"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fee & Payment Summary */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5">
              <h4 className="mb-2.5 border-b border-border pb-1.5 text-xs font-bold uppercase tracking-wide text-[#0ab39c]">
                Fee &amp; Payment Breakdown
              </h4>
              <div className="space-y-1.5">
                {[
                  [
                    "Form Template",
                    `${formMeta?.title || "-"} (${formMeta?.form_name || "form1"})`,
                  ],
                  ["Base Application Fee", `₹${formFees.toLocaleString("en-IN")}`],
                  ["Applicable Tax", `${formTax}%`],
                  [
                    "Total Form Amount",
                    `₹${formTotal.toLocaleString("en-IN")}`,
                  ],
                  [
                    "Configured Gateway",
                    String(formMeta?.gateway || "razorpay").toUpperCase(),
                  ],
                  [
                    "Payment Method Used",
                    submission.payment_method || "-",
                  ],
                  [
                    "Amount Paid",
                    `₹${paidAmount.toLocaleString("en-IN")}`,
                  ],
                  [
                    "Payment Status",
                    String(submission.payment_status || "unpaid").toUpperCase(),
                  ],
                  [
                    "Application Score",
                    `${submission.application_score ?? fillPct}%`,
                  ],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 border-b border-border/40 py-1 last:border-0"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* FILLED DATA TABLE (WITH RESOLVED MASTER NAMES) */}
        <Card className="gap-0 overflow-hidden p-0 shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h4 className="text-sm font-bold">Filled Data</h4>
              <p className="text-[11px] text-muted-foreground">
                Complete applicant responses with resolved Country, State, City, Institute, Programme, and Course names.
              </p>
            </div>
            <Badge variant="secondary">{filledEntries.length} Fields</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[35%] px-5">Field</TableHead>
                <TableHead className="px-5">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filledEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                filledEntries.map(([key, value]) => {
                  const label = key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (ch) => ch.toUpperCase())
                  const isObj = typeof value === "object" && value !== null
                  return (
                    <TableRow key={key}>
                      <TableCell className="px-5 font-semibold text-foreground">
                        {label}
                      </TableCell>
                      <TableCell className="px-5">
                        {isObj ? (
                          <pre className="rounded bg-muted/60 p-2 font-mono text-[11px]">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          <span className="font-medium">
                            {resolveValue(key, value)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* LINKED STUDENT DOCUMENTS (IF ANY) */}
        {documents.length > 0 && (
          <Card className="gap-3 p-5 shadow-xs">
            <h4 className="text-sm font-bold">
              Uploaded Documents ({documents.length})
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <div className="font-semibold">
                      {doc.doc_name || "Applicant Document"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {doc.doc_type || "Academic / KYC"} •{" "}
                      {formatDateTime(doc.created_at)}
                    </div>
                  </div>
                  <Badge
                    className={`border-0 text-[10px] uppercase ${
                      doc.status === 1
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.status === 2
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doc.status === 1
                      ? "Approved"
                      : doc.status === 2
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {DeleteDialog}
    </div>
  )
}
