"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { FormSelect } from "@/components/ui/form-select"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface LeadSourceRow {
  id: string | number
  name: string
  status?: boolean | number | string | null
  lead_count?: number | null
  billing_setup_amount?: number | string | null
  computed_total?: number | null
}

function isSourceActive(status: LeadSourceRow["status"]) {
  return (
    status !== false &&
    status !== 0 &&
    status !== "0" &&
    String(status ?? "1").toLowerCase() !== "inactive"
  )
}

export default function LeadSourcesPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [items, setItems] = React.useState<LeadSourceRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])

  // Add / Edit Source Name Modal (1:1 df-laravel-crm #sourceModal)
  const [editing, setEditing] = React.useState<LeadSourceRow | null>(null)
  const [showModal, setShowModal] = React.useState(false)
  const [savingSource, setSavingSource] = React.useState(false)
  const [sourceName, setSourceName] = React.useState("")

  // View Billing Offcanvas Sheet (1:1 df-laravel-crm #billingSidebar)
  const [billingSource, setBillingSource] =
    React.useState<LeadSourceRow | null>(null)
  const [billingOpen, setBillingOpen] = React.useState(false)
  const [savingBilling, setSavingBilling] = React.useState(false)
  const [billingForm, setBillingForm] = React.useState({
    billing_setup_amount: "0",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/crm-resources?resource=sources")
      const d = await res.json()
      setItems(d.items || [])
    } catch {
      toast.error("Failed to load lead sources")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openBillingSheet = React.useCallback((src: LeadSourceRow) => {
    setBillingSource(src)
    setBillingForm({
      billing_setup_amount: String(Number(src.billing_setup_amount ?? 0)),
      status: isSourceActive(src.status) ? "1" : "0",
    })
    setBillingOpen(true)
  }, [])

  const columns = React.useMemo<ColumnDef<LeadSourceRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={items.length > 0 && selected.length === items.length}
            onCheckedChange={(checked) =>
              setSelected(checked ? items.map((x) => String(x.id)) : [])
            }
          />
        ),
        cell: ({ row }) => {
          const idStr = String(row.original.id)
          return (
            <Checkbox
              checked={selected.includes(idStr)}
              onCheckedChange={(checked) =>
                setSelected((prev) =>
                  checked ? [...prev, idStr] : prev.filter((x) => x !== idStr)
                )
              }
            />
          )
        },
      },
      {
        accessorKey: "name",
        header: "Source Name",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorFn: (s) => Number(s.lead_count || 0),
        id: "lead_count",
        header: "Lead Count",
        cell: ({ getValue }) => (
          <span className="font-mono font-medium">{String(getValue())}</span>
        ),
      },
      {
        accessorFn: (s) => Number(s.billing_setup_amount || 0),
        id: "billing_setup_amount",
        header: "Billing Amount",
        cell: ({ getValue }) => (
          <span className="font-mono">₹{Number(getValue()).toFixed(2)}</span>
        ),
      },
      {
        accessorFn: (s) =>
          Number(
            s.computed_total ??
              Number(s.lead_count || 0) * Number(s.billing_setup_amount || 0)
          ),
        id: "total",
        header: "Total",
        cell: ({ getValue }) => (
          <span className="font-mono font-semibold text-[#405189]">
            ₹{Number(getValue()).toFixed(2)}
          </span>
        ),
      },
      {
        accessorFn: (s) => (isSourceActive(s.status) ? "Active" : "Inactive"),
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          isSourceActive(row.original.status) ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
              Active
            </Badge>
          ) : (
            <Badge className="bg-rose-100 text-[10px] font-semibold text-rose-700 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
              Inactive
            </Badge>
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
                type="button"
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  openBillingSheet(s)
                }}
                className="bg-amber-500 text-[11px] font-medium text-white hover:bg-amber-600"
              >
                <i className="ri-money-rupee-circle-line mr-1" />
                View Billing
              </Button>
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(s)
                  setSourceName(s.name || "")
                  setShowModal(true)
                }}
                className="bg-[#405189]/10 text-[11px] font-medium text-[#405189] hover:bg-[#405189] hover:text-white"
              >
                <i className="ri-pencil-line mr-1" />
                Edit
              </Button>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  confirmDelete({
                    title: "Delete Lead Source?",
                    description: `Are you sure you want to permanently delete lead source "${s.name}" (${Number(s.lead_count || 0)} leads tracked)? This action cannot be undone.`,
                    confirmLabel: "Yes, Delete Source",
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "sources",
                          action: "delete",
                          id: s.id,
                        }),
                      })
                      if (res.ok) {
                        setSelected((prev) =>
                          prev.filter((id) => id !== String(s.id))
                        )
                        toast.success(`Source "${s.name}" deleted`)
                        await load()
                      } else {
                        toast.error("Failed to delete source")
                      }
                    },
                  })
                }}
                className="text-[11px]"
              >
                <i className="ri-delete-bin-line mr-1" />
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [items, selected, openBillingSheet, confirmDelete, load]
  )

  const previewLeads = Number(billingSource?.lead_count || 0)
  const previewRate = Number(billingForm.billing_setup_amount || 0)
  const previewTotal = previewLeads * previewRate

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="CRM" title="Sources" />

      {loading ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-52" />
            <Skeleton className="h-8 w-32" />
          </div>
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="gap-0 py-0 text-xs shadow-xs">
          <DataTable
            title={`Lead Sources (${items.length})`}
            columns={columns}
            data={items}
            searchPlaceholder="Search sources..."
            toolbarRight={
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      confirmDelete({
                        title: `Delete ${selected.length} Source(s)?`,
                        description: `Are you sure you want to permanently delete ${selected.length} selected lead source(s)? This action cannot be undone.`,
                        confirmLabel: `Yes, Delete (${selected.length})`,
                        onConfirm: async () => {
                          const res = await fetch("/api/crm-resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resource: "sources",
                              action: "bulk_delete",
                              ids: selected,
                            }),
                          })
                          if (res.ok) {
                            setSelected([])
                            toast.success("Selected sources deleted")
                            await load()
                          }
                        },
                      })
                    }}
                    className="h-8 text-xs"
                  >
                    <i className="ri-delete-bin-2-line mr-1" />
                    Delete ({selected.length})
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditing(null)
                    setSourceName("")
                    setShowModal(true)
                  }}
                  className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  + Add Source
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Add / Edit Source Modal (#sourceModal in df-laravel-crm) */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Source" : "Add Source"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editing
                ? "Update the lead attribution source name. Use View Billing to configure CPL billing rates and status."
                : "Create a new lead attribution source. You can configure per-lead billing rates anytime via View Billing."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSavingSource(true)
              try {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(
                    editing
                      ? {
                          resource: "sources",
                          action: "update",
                          id: editing.id,
                          name: sourceName,
                        }
                      : {
                          resource: "sources",
                          action: "create",
                          name: sourceName,
                          status: true,
                          billing_setup_amount: 0,
                        }
                  ),
                })
                if (res.ok) {
                  toast.success(
                    editing ? "Source updated!" : "Source created!"
                  )
                  setShowModal(false)
                  await load()
                } else {
                  toast.error("Failed to save source")
                }
              } finally {
                setSavingSource(false)
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Source Name *</Label>
              <Input
                required
                placeholder="e.g. Facebook Ads, Shiksha, Google Search"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="h-9 text-xs"
              />
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
                disabled={savingSource}
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                {savingSource ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Billing Offcanvas Sheet (#billingSidebar in df-laravel-crm) */}
      <Sheet open={billingOpen} onOpenChange={setBillingOpen}>
        <SheetContent side="right" className="w-full text-xs sm:max-w-md">
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle className="flex items-center gap-2 text-base font-bold text-[#405189]">
              <i className="ri-money-rupee-circle-line text-lg text-[#0ab39c]" />
              <span>Billing Setup</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Configure Cost-Per-Lead (CPL) billing amount and active status for{" "}
              <strong className="text-foreground">
                {billingSource?.name || "this source"}
              </strong>
              .
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!billingSource) return
              setSavingBilling(true)
              try {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "sources",
                    action: "billing_update",
                    id: billingSource.id,
                    billing_setup_amount: Number(
                      billingForm.billing_setup_amount || 0
                    ),
                    status: billingForm.status === "1",
                  }),
                })
                if (res.ok) {
                  toast.success(
                    `Billing updated for "${billingSource.name}"!`
                  )
                  setBillingOpen(false)
                  await load()
                } else {
                  toast.error("Failed to update billing setup")
                }
              } finally {
                setSavingBilling(false)
              }
            }}
            className="flex flex-1 flex-col justify-between gap-4 p-4"
          >
            <div className="space-y-4">
              {/* Live Billing Calculation Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source Name</span>
                  <span className="font-semibold text-foreground">
                    {billingSource?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Attributed Lead Count
                  </span>
                  <span className="font-mono font-semibold">
                    {previewLeads} Leads
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="font-medium text-foreground">
                    Total Billing Amount
                  </span>
                  <span className="font-mono text-sm font-bold text-[#0ab39c]">
                    ₹{previewTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold">
                  Billing Amount (₹ per Lead)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={billingForm.billing_setup_amount}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      billing_setup_amount: e.target.value,
                    })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="mb-1.5 block text-xs font-semibold">
                  Status
                </Label>
                <FormSelect
                  value={billingForm.status}
                  onChange={(e) =>
                    setBillingForm({
                      ...billingForm,
                      status: e.target.value,
                    })
                  }
                  className="h-9 w-full"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </FormSelect>
              </div>
            </div>

            <SheetFooter className="border-t border-border pt-3 sm:flex-col">
              <Button
                type="submit"
                disabled={savingBilling}
                className="h-9 w-full bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                {savingBilling ? "Updating..." : "Update Billing"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {DeleteDialog}
    </div>
  )
}
