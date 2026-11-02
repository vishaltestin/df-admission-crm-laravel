"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

export default function ApplicationFormsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forms, setForms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countries, setCountries] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    title: "",
    amount: "1000",
    tax_type: "exclude",
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
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const baseAmt = Number(form.amount || 0)
  const taxAmt = form.tax_type === "exclude" ? +(baseAmt * 0.18).toFixed(2) : 0
  const totalAmt = +(baseAmt + taxAmt).toFixed(2)

  function toggleArr(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
  }

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
        accessorKey: "unique_code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-[#405189]">
            {row.original.unique_code}
          </span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.title}</span>
        ),
      },
      {
        accessorFn: (f) => Number(f.amount || 0),
        id: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span>₹{Number(row.original.amount || 0).toLocaleString("en-IN")}</span>
        ),
      },
      {
        accessorFn: (f) => Number(f.tax_amount || 0),
        id: "tax_amount",
        header: "Tax (18%)",
        cell: ({ row }) => (
          <span>
            ₹{Number(row.original.tax_amount || 0).toLocaleString("en-IN")} (
            {row.original.tax_type})
          </span>
        ),
      },
      {
        accessorFn: (f) => Number(f.total_amount || 0),
        id: "total_amount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700">
            ₹{Number(row.original.total_amount || 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const active =
            row.original.status === "active" || row.original.status === "1"
          return (
            <Badge
              className={`text-[10px] font-semibold uppercase ${
                active
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const f = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  let ac: string[] = []
                  let ai: string[] = []
                  try {
                    ac = JSON.parse(f.allowed_countries || "[]").map(String)
                  } catch {
                    ac = []
                  }
                  try {
                    ai = JSON.parse(f.allowed_institutes || "[]").map(String)
                  } catch {
                    ai = []
                  }
                  setEditing(f)
                  setForm({
                    title: f.title || "",
                    amount: String(f.amount || 0),
                    tax_type: f.tax_type || "exclude",
                    status:
                      f.status === "inactive" || f.status === "0" ? "0" : "1",
                    allowed_countries: ac,
                    allowed_institutes: ai,
                  })
                  setShowModal(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                asChild
                size="xs"
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                <Link href={`/application_form_submissions/${f.id}`}>
                  Submissions
                </Link>
              </Button>
              <Button
                asChild
                size="xs"
                variant="outline"
                className="text-[11px]"
              >
                <Link
                  href={`/application_form_show/${f.unique_code}/1`}
                  target="_blank"
                >
                  View ↗
                </Link>
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={async () => {
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
                }}
                className="text-[11px]"
              >
                Delete
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
      <BreadcrumbBar parent="FormDesk" title="Application Forms" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Application Forms"
          columns={columns}
          data={forms}
          searchPlaceholder="Search application forms..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  title: "",
                  amount: "1000",
                  tax_type: "exclude",
                  status: "1",
                  allowed_countries: ["80"],
                  allowed_institutes: institutes.map((i) => String(i.id)),
                })
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Add Application Form
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Application Form" : "Create Application Form"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure application fee, GST calculation, allowed institutes, and countries.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "application_forms",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing
                    ? "Application form updated!"
                    : "Application form created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Form Title *</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Application Form 2026-27"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <Label className="mb-1 block text-xs">Amount (₹) *</Label>
                <Input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Tax Type</Label>
                <select
                  value={form.tax_type}
                  onChange={(e) =>
                    setForm({ ...form, tax_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="exclude">Exclude (+18% GST)</option>
                  <option value="include">Include GST</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>

            <div className="rounded-md bg-emerald-50 p-2.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
              Fee Summary: Base ₹{baseAmt} + GST ₹{taxAmt} = Total Payable ₹
              {totalAmt}
            </div>

            <div>
              <Label className="mb-1 block text-xs">Allowed Institutes</Label>
              <div className="max-h-28 space-y-1.5 overflow-y-auto rounded-md border border-input p-2.5">
                {institutes.map((inst) => {
                  const sid = String(inst.id)
                  return (
                    <label
                      key={sid}
                      className="flex items-center gap-2 text-xs"
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
            </div>

            <div>
              <Label className="mb-1 block text-xs">Allowed Countries</Label>
              <div className="grid max-h-28 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-input p-2.5">
                {countries.map((c) => {
                  const cid = String(c.id)
                  return (
                    <label
                      key={cid}
                      className="flex items-center gap-2 text-xs"
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
                      <span className="truncate">{c.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Form
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
