"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { FormSelect } from "@/components/ui/form-select"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export default function CoursesProductsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewItem, setViewItem] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    sku: "",
    name: "",
    description: "",
    quantity: "60",
    price: "45000",
    program_id: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/crm-resources?resource=courses")
      const d = await r.json()
      setCourses(d.items || [])
      setPrograms(d.programs || [])
      setInstitutes(d.institutes || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const programOptions = React.useMemo(() => {
    return programs.map((p) => {
      const inst = institutes.find(
        (i) => String(i.id) === String(p.institute_id)
      )
      return {
        value: String(p.id),
        label: inst ? `${p.name} (${inst.name})` : p.name,
      }
    })
  }, [programs, institutes])

  const openEditModal = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => {
      setEditing(c)
      setForm({
        sku: c.sku || "",
        name: c.name || "",
        description: c.description || "",
        quantity: String(c.quantity ?? 60),
        price: String(c.price ?? 0),
        program_id: c.program_id ? String(c.program_id) : "",
        status: String(c.status ?? 1),
      })
      setShowModal(true)
    },
    []
  )

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "courses",
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
      }),
    })
    if (!res.ok) {
      toast.error("Failed to save course")
      return
    }
    toast.success(editing ? "Course updated" : "Course created")
    setShowModal(false)
    setEditing(null)
    load()
  }

  function handleBulkDelete() {
    if (selectedIds.length === 0) return
    confirmDelete({
      title: `Delete ${selectedIds.length} Selected Course(s)?`,
      description: `Are you sure you want to permanently delete ${selectedIds.length} selected course(s) and their inventory records? This cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch("/api/crm-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource: "courses",
            action: "bulk_delete",
            ids: selectedIds,
          }),
        })
        if (res.ok) {
          toast.success(`${selectedIds.length} course(s) deleted`)
          setSelectedIds([])
          load()
        } else {
          toast.error("Bulk delete failed")
        }
      },
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: () => (
          <Checkbox
            checked={
              courses.length > 0 && selectedIds.length === courses.length
            }
            onCheckedChange={(checked) =>
              setSelectedIds(checked ? courses.map((c) => Number(c.id)) : [])
            }
            aria-label="Select all courses"
          />
        ),
        cell: ({ row }) => {
          const id = Number(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(checked) =>
                setSelectedIds((prev) =>
                  checked ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
              aria-label={`Select ${row.original.name}`}
            />
          )
        },
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-[#405189]">
            {row.original.sku}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Course Name",
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => setViewItem(row.original)}
              className="text-left font-semibold text-foreground hover:text-[#405189] hover:underline"
            >
              {row.original.name}
            </button>
            {row.original.description && (
              <div className="max-w-xs truncate text-[11px] text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        id: "institute_program",
        header: "Institute / Program",
        accessorFn: (c) =>
          `${c.institute_name || ""} ${c.program_name || ""}`.trim(),
        cell: ({ row }) => {
          const c = row.original
          if (!c.program_name) {
            return (
              <span className="text-[11px] italic text-muted-foreground">
                Unassigned
              </span>
            )
          }
          return (
            <div>
              <div className="font-medium text-foreground">
                {c.program_name}
              </div>
              {c.institute_name && (
                <div className="text-[11px] text-muted-foreground">
                  {c.institute_name}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "quantity",
        header: "Seats / Stock",
        cell: ({ row }) => {
          const c = row.original
          return (
            <div>
              <span className="font-medium">{c.quantity ?? 0}</span>
              <span className="ml-1 text-[11px] text-muted-foreground">
                ({c.in_stock ?? c.quantity ?? 0} avail)
              </span>
            </div>
          )
        },
      },
      {
        accessorFn: (c) => Number(c.price || 0),
        id: "price",
        header: "Course Fee",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            ₹{Number(row.original.price || 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              Number(row.original.status ?? 1) === 1
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-700"
            }
          >
            {Number(row.original.status ?? 1) === 1 ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                variant="outline"
                onClick={() => setViewItem(c)}
                className="text-[11px]"
              >
                View
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openEditModal(c)}
                className="text-[11px]"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Course?",
                    description: `Are you sure you want to permanently delete "${c.name}" (SKU: ${c.sku})? This action cannot be undone.`,
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "courses",
                          action: "delete",
                          id: c.id,
                        }),
                      })
                      if (res.ok) {
                        toast.success("Course deleted")
                        load()
                      } else {
                        toast.error("Failed to delete course")
                      }
                    },
                  })
                }
                className="text-[11px]"
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    [courses, selectedIds, load, confirmDelete, openEditModal]
  )

  return (
    <div>
      <BreadcrumbBar parent="Academic" title="Courses Catalog" />

      <Card className="gap-0 py-0 shadow-xs">
        <DataTable
          title={`All Courses (${courses.length})`}
          columns={columns}
          data={courses}
          loading={loading}
          searchPlaceholder="Search courses by name, SKU, program, or institute..."
          emptyMessage="No courses added yet."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-line mr-1" />
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    sku: `CRS-${Date.now().toString().slice(-5)}`,
                    name: "",
                    description: "",
                    quantity: "60",
                    price: "45000",
                    program_id: programs[0] ? String(programs[0].id) : "",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add Course
              </Button>
            </div>
          }
        />
      </Card>

      {/* Full Course Details Modal */}
      <Dialog
        open={Boolean(viewItem)}
        onOpenChange={(o) => {
          if (!o) setViewItem(null)
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle className="text-base font-bold">
                {viewItem?.name}
              </DialogTitle>
              <Badge
                className={
                  Number(viewItem?.status ?? 1) === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }
              >
                {Number(viewItem?.status ?? 1) === 1 ? "Active" : "Inactive"}
              </Badge>
            </div>
            <DialogDescription>
              Course ID <span className="font-mono">#{viewItem?.id}</span> •
              SKU: <span className="font-mono font-semibold">{viewItem?.sku}</span>
            </DialogDescription>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-4 text-xs">
              {/* Financial & Seat Inventory KPI Cards */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
                  <div className="text-[11px] text-muted-foreground">
                    Course Fee
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{Number(viewItem.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-[11px] text-muted-foreground">
                    Total Intake
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-foreground">
                    {viewItem.quantity ?? 0} Seats
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-blue-50/60 p-3 dark:bg-blue-950/20">
                  <div className="text-[11px] text-muted-foreground">
                    In Stock
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-blue-700 dark:text-blue-400">
                    {viewItem.in_stock ?? viewItem.quantity ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-amber-50/60 p-3 dark:bg-amber-950/20">
                  <div className="text-[11px] text-muted-foreground">
                    Allocated
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-400">
                    {viewItem.allocated ?? 0}
                  </div>
                </div>
              </div>

              {/* Academic & Organization Metadata Table */}
              <div className="divide-y divide-border rounded-lg border border-border">
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Course Name
                  </span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {viewItem.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    SKU Code
                  </span>
                  <span className="col-span-2 font-mono font-semibold text-[#405189]">
                    {viewItem.sku || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Institute
                  </span>
                  <span className="col-span-2 font-medium text-foreground">
                    {viewItem.institute_name || "Not linked to an institute"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Program / Faculty
                  </span>
                  <span className="col-span-2 font-medium text-foreground">
                    {viewItem.program_name || "Unassigned / General"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Organization
                  </span>
                  <span className="col-span-2 text-foreground">
                    {viewItem.organization_name || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Created At
                  </span>
                  <span className="col-span-2 text-muted-foreground">
                    {viewItem.created_at
                      ? new Date(viewItem.created_at).toLocaleString("en-IN")
                      : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3 px-3.5 py-2.5">
                  <span className="font-medium text-muted-foreground">
                    Last Updated
                  </span>
                  <span className="col-span-2 text-muted-foreground">
                    {viewItem.updated_at
                      ? new Date(viewItem.updated_at).toLocaleString("en-IN")
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-lg border border-border bg-muted/20 p-3.5">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Course Description
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {viewItem.description ||
                    "No detailed description added for this course yet."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const item = viewItem
                setViewItem(null)
                if (item) openEditModal(item)
              }}
            >
              <i className="ri-pencil-line mr-1" />
              Edit Course
            </Button>
            <Button
              type="button"
              onClick={() => setViewItem(null)}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Course Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Course" : "Add Course"}</DialogTitle>
            <DialogDescription>
              Manage SKU, academic program assignment, intake seats, and tuition
              fees.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">
                  SKU <span className="text-rose-500">*</span>
                </Label>
                <Input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Program / Faculty</Label>
                <FormSelect
                  value={form.program_id}
                  onValueChange={(v) => setForm({ ...form, program_id: v })}
                  placeholder="-- Unassigned --"
                  options={[
                    { value: "", label: "-- Unassigned --" },
                    ...programOptions,
                  ]}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">
                Course Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. MBA Healthcare Management"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block text-xs">
                  Course Fee (₹) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  Seats / Quantity <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <FormSelect
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                  options={[
                    { value: "1", label: "Active" },
                    { value: "0", label: "Inactive" },
                  ]}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Curriculum summary, duration, eligibility..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
