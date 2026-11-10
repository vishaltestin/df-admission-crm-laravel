"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

export default function ApplicationFormsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forms, setForms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countries, setCountries] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [showModal, setShowModal] = React.useState(false)
  const [countrySearch, setCountrySearch] = React.useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    fees: "1000",
    tax: "18",
    gateway: "razorpay",
    form_name: "form1",
    status: "1",
    allowed_countries: ["80"] as string[],
    allowed_institutes: [] as string[],
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=application_forms")
      .then((r) => r.json())
      .then((d) => {
        setForms(d.appForms || d.items || [])
        setInstitutes(d.institutes || [])
        setCountries(d.countries || [])
      })
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const feesNum = Number(form.fees || 0)
  const taxPct = Number(form.tax || 0)
  const taxAmt = +((feesNum * taxPct) / 100).toFixed(2)
  const totalAmt = +(feesNum + taxAmt).toFixed(2)

  function toggleArr(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
  }

  const allChecked = forms.length > 0 && selectedIds.length === forms.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? forms.map((f) => String(f.id)) : [])
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  function openEditModal(f: Record<string, unknown>) {
    let ac: string[] = []
    let ai: string[] = []
    try {
      const rawAc = f.allowed_countries
      ac = Array.isArray(rawAc)
        ? rawAc.map(String)
        : JSON.parse(String(rawAc || "[]")).map(String)
    } catch {
      ac = ["80"]
    }
    try {
      const rawAi = f.allowed_institutes
      ai = Array.isArray(rawAi)
        ? rawAi.map(String)
        : JSON.parse(String(rawAi || "[]")).map(String)
    } catch {
      ai = []
    }
    setEditing(f)
    setCountrySearch("")
    setForm({
      title: String(f.title || ""),
      description: String(f.description || ""),
      fees: String(Number(f.fees ?? 0)),
      tax: String(Math.round(Number(f.tax ?? 0))),
      gateway: String(f.gateway || "razorpay"),
      form_name: String(f.form_name || "form1"),
      status:
        f.status === "inactive" || f.status === "0" || f.status === 0
          ? "0"
          : "1",
      allowed_countries: ac.length > 0 ? ac : ["80"],
      allowed_institutes: ai,
    })
    setShowModal(true)
  }

  const filteredCountries = React.useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    if (!q) return countries
    return countries.filter((c) => String(c.name || "").toLowerCase().includes(q))
  }, [countries, countrySearch])

  // Exact columns from df-laravel-crm resources/views/FrontEnd/application/index.blade.php:
  // [Checkbox] | Title | Unique Code | Fees / Total | Status | Total Submissions | Actions
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
            aria-label="Select all application forms"
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(v) => toggleOne(id, Boolean(v))}
              aria-label={`Select ${row.original.title}`}
            />
          )
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const f = row.original
          return (
            <div>
              <div className="font-semibold">{f.title}</div>
              {f.description ? (
                <div className="max-w-xs truncate text-[10px] text-muted-foreground">
                  {f.description}
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground">
                  Template: <code>{f.form_name || "form1"}</code> • Gateway:{" "}
                  <span className="uppercase">{f.gateway || "razorpay"}</span>
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "unique_code",
        header: "Unique Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[#405189]">
            {row.original.unique_code}
          </span>
        ),
      },
      {
        id: "fee_summary",
        header: "Fees / Total",
        accessorFn: (f) => Number(f.total_amount ?? f.fees ?? 0),
        cell: ({ row }) => {
          const fees = Number(row.original.fees ?? 0)
          const tax = Number(row.original.tax ?? 0)
          const total = Number(
            row.original.total_amount ?? fees + (fees * tax) / 100
          )
          return (
            <div>
              <div className="font-semibold text-emerald-700">
                ₹{total.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Base ₹{fees.toLocaleString("en-IN")} + {tax}% Tax
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isActive =
            row.original.status !== "inactive" &&
            row.original.status !== "0" &&
            row.original.status !== 0
          return (
            <Badge
              className={`border-0 text-[10px] font-semibold ${
                isActive
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-rose-100 text-rose-700 hover:bg-rose-200"
              }`}
            >
              {isActive ? "Active" : "Deactive"}
            </Badge>
          )
        },
      },
      {
        accessorFn: (f) => Number(f.responses_count ?? 0),
        id: "responses_count",
        header: "Total Submissions",
        cell: ({ row }) => (
          <Badge className="bg-slate-900 font-mono text-[11px] text-white">
            {row.original.responses_count ?? 0}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const f = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                asChild
                size="xs"
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                <Link href={`/application_form_submissions/${f.id}`}>
                  View Submissions
                </Link>
              </Button>
              <Button
                size="xs"
                onClick={() => openEditModal(f)}
                className="bg-[#405189] text-[11px] text-white hover:bg-[#364574]"
              >
                <i className="ri-pencil-line mr-1" /> Edit
              </Button>
              <Button
                asChild
                size="xs"
                variant="outline"
                title="Open Public Application Portal"
                className="text-[11px]"
              >
                <Link
                  href={`/application_form_show/${f.unique_code}/1`}
                  target="_blank"
                >
                  Portal ↗
                </Link>
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Application Form?",
                    description: `Are you sure you want to delete "${f.title}" (${f.unique_code})? All ${f.responses_count ?? 0} linked submission response(s) will also be removed.`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "application_forms",
                          action: "delete",
                          id: f.id,
                        }),
                      })
                      toast.success("Application form deleted")
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
          title="Applications Form"
          columns={columns}
          data={forms}
          loading={loading}
          searchPlaceholder="Search for..."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: `Delete ${selectedIds.length} Application Form(s)?`,
                      description: `Are you sure you want to permanently delete ${selectedIds.length} selected application form(s)?`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "application_forms",
                            action: "bulk_delete",
                            ids: selectedIds,
                          }),
                        })
                        toast.success(
                          `Deleted ${selectedIds.length} application form(s)`
                        )
                        setSelectedIds([])
                        load()
                      },
                    })
                  }
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-2-line mr-1" /> Delete (
                  {selectedIds.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setCountrySearch("")
                  setForm({
                    title: "",
                    description: "",
                    fees: "1000",
                    tax: "18",
                    gateway: "razorpay",
                    form_name: "form1",
                    status: "1",
                    allowed_countries: ["80"],
                    allowed_institutes: institutes.map((i) => String(i.id)),
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                + Add Application Form
              </Button>
            </div>
          }
        />
      </Card>

      {/* FULL CREATE / EDIT APPLICATION FORM DIALOG (1:1 WITH application/create.blade.php & edit.blade.php) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 text-xs sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-5 py-3.5">
            <DialogTitle className="text-sm font-bold">
              {editing
                ? `Edit Application Form — ${editing.title}`
                : "Create Application Form"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure form details, allowed countries &amp; institutes, fee + tax calculation, payment gateway, and template.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (form.allowed_countries.length === 0) {
                toast.warning("Select at least one Allowed Country")
                return
              }
              if (form.allowed_institutes.length === 0 && institutes.length > 0) {
                toast.warning("Select at least one Allowed Institute")
                return
              }
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "application_forms",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  title: form.title,
                  description: form.description,
                  fees: feesNum,
                  tax: taxPct,
                  total_amount: totalAmt,
                  gateway: form.gateway,
                  form_name: form.form_name,
                  status: form.status,
                  allowed_countries: form.allowed_countries,
                  allowed_institutes: form.allowed_institutes,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing
                    ? "Form Updated Successfully"
                    : "Form Created Successfully"
                )
                setShowModal(false)
                load()
              } else {
                toast.error("Failed to save application form")
              }
            }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Title & Description */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label className="mb-1 block text-xs font-semibold">
                    Form Title *
                  </Label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Admission Application Form 2026-27"
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-semibold">
                    Status
                  </Label>
                  <FormSelect
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="1">Active</option>
                    <option value="0">Deactive</option>
                  </FormSelect>
                </div>
              </div>

              <div>
                <Label className="mb-1 block text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Instructions or subtitle shown on the student application portal..."
                  className="text-xs"
                />
              </div>

              <div className="border-t border-border pt-3">
                <h5 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[#405189]">
                  Form Configuration
                </h5>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Allowed Countries */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Allowed Countries * ({form.allowed_countries.length})
                      </Label>
                      <div className="flex gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              allowed_countries: countries.map((c) =>
                                String(c.id)
                              ),
                            })
                          }
                          className="text-[#405189] hover:underline"
                        >
                          Select All
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, allowed_countries: ["80"] })
                          }
                          className="text-muted-foreground hover:underline"
                        >
                          India Only
                        </button>
                      </div>
                    </div>
                    <Input
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Filter countries..."
                      className="mb-1.5 h-7 text-xs"
                    />
                    <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-md border border-input p-2.5">
                      {filteredCountries.map((c) => {
                        const cid = String(c.id)
                        return (
                          <label
                            key={cid}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={form.allowed_countries.includes(cid)}
                              onCheckedChange={() =>
                                setForm({
                                  ...form,
                                  allowed_countries: toggleArr(
                                    form.allowed_countries,
                                    cid
                                  ),
                                })
                              }
                            />
                            <span>{c.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Only selected countries will be available when filling the form.
                    </p>
                  </div>

                  {/* Allowed Institutes */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <Label className="text-xs font-semibold">
                        Allowed Institutes * ({form.allowed_institutes.length})
                      </Label>
                      <div className="flex gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({
                              ...form,
                              allowed_institutes: institutes.map((i) =>
                                String(i.id)
                              ),
                            })
                          }
                          className="text-[#405189] hover:underline"
                        >
                          Select All
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, allowed_institutes: [] })
                          }
                          className="text-muted-foreground hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-md border border-input p-2.5">
                      {institutes.map((inst) => {
                        const sid = String(inst.id)
                        return (
                          <label
                            key={sid}
                            className="flex cursor-pointer items-center gap-2 text-xs"
                          >
                            <Checkbox
                              checked={form.allowed_institutes.includes(sid)}
                              onCheckedChange={() =>
                                setForm({
                                  ...form,
                                  allowed_institutes: toggleArr(
                                    form.allowed_institutes,
                                    sid
                                  ),
                                })
                              }
                            />
                            <span>{inst.name}</span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Programs &amp; courses of selected institutes will be displayed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fees, Tax %, Total Amount, Payment Gateway */}
              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <Label className="mb-1 block text-xs font-semibold">
                      Fees (₹)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.fees}
                      onChange={(e) =>
                        setForm({ ...form, fees: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-semibold">
                      Tax (%)
                    </Label>
                    <FormSelect
                      value={form.tax}
                      onChange={(e) =>
                        setForm({ ...form, tax: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="18">18%</option>
                    </FormSelect>
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-semibold">
                      Total Amount (₹)
                    </Label>
                    <Input
                      type="number"
                      readOnly
                      value={totalAmt}
                      className="h-9 bg-muted font-semibold text-emerald-700 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs font-semibold">
                      Payment Gateway
                    </Label>
                    <FormSelect
                      value={form.gateway}
                      onChange={(e) =>
                        setForm({ ...form, gateway: e.target.value })
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="razorpay">Razorpay</option>
                      <option value="cashfree">Cashfree</option>
                      <option value="stripe">Stripe</option>
                    </FormSelect>
                  </div>
                </div>

                <div className="mt-2.5 rounded-md bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  Fee Calculation: Base ₹{feesNum.toLocaleString("en-IN")} + Tax (
                  {taxPct}% = ₹{taxAmt.toLocaleString("en-IN")}) = Total Payable{" "}
                  <strong>₹{totalAmt.toLocaleString("en-IN")}</strong> via{" "}
                  <span className="uppercase">{form.gateway}</span>
                </div>
              </div>

              {/* Form Name */}
              <div className="border-t border-border pt-3">
                <Label className="mb-1 block text-xs font-semibold">
                  Form Name *
                </Label>
                <Input
                  required
                  value={form.form_name}
                  onChange={(e) =>
                    setForm({ ...form, form_name: e.target.value })
                  }
                  placeholder="form1"
                  className="h-9 text-xs font-mono"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Example: <code>form1</code> → Standard Multi-Step University Admission Application Template
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-border px-5 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={
                  editing
                    ? "bg-amber-500 font-semibold text-white hover:bg-amber-600"
                    : "bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
                }
              >
                {editing ? "Update Form" : "Save Form"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
