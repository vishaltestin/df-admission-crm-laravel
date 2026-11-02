"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
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

export default function CoursesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewing, setViewing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    sku: "",
    price: "",
    quantity: "60",
    program_id: "",
    description: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch("/api/crm-resources?resource=courses").then((r) => r.json()),
      fetch("/api/crm-resources?resource=programs").then((r) => r.json()),
    ])
    setCourses(r1.items || [])
    setPrograms(r2.items || [])
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const progMap = React.useMemo(() => {
    const m: Record<string, string> = {}
    for (const p of programs) m[String(p.id)] = p.name
    return m
  }, [programs])

  const allChecked =
    courses.length > 0 && selectedIds.length === courses.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={(v) =>
              setSelectedIds(Boolean(v) ? courses.map((c) => String(c.id)) : [])
            }
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(v) =>
                setSelectedIds((prev) =>
                  Boolean(v) ? [...prev, id] : prev.filter((x) => x !== id)
                )
              }
            />
          )
        },
      },
      {
        accessorKey: "id",
        header: "Course ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.name}</div>
            {row.original.description && (
              <div className="max-w-xs truncate text-[10px] text-muted-foreground">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.sku}</span>
        ),
      },
      {
        accessorFn: (c) => progMap[String(c.program_id)] || "-",
        id: "program",
        header: "Program",
      },
      {
        accessorFn: (c) => Number(c.price || 0),
        id: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-700">
            ₹{Number(row.original.price || 0).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorFn: (c) => Number(c.quantity ?? 1),
        id: "quantity",
        header: "Quantity",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          Number(row.original.status ?? 1) === 1 ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Inactive
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
                onClick={() => setViewing(c)}
                className="text-[11px]"
              >
                View
              </Button>
              <Button
                size="xs"
                onClick={() => {
                  setEditing(c)
                  setForm({
                    name: c.name || "",
                    sku: c.sku || "",
                    price: String(c.price ?? 0),
                    quantity: String(c.quantity ?? 1),
                    program_id: c.program_id ? String(c.program_id) : "",
                    description: c.description || "",
                    status: String(c.status ?? 1),
                  })
                  setShowModal(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={async () => {
                  await fetch("/api/crm-resources", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "courses",
                      action: "delete",
                      id: c.id,
                    }),
                  })
                  toast.success("Course deleted")
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
    [allChecked, courses, selectedIds, progMap, load]
  )

  return (
    <div>
      <BreadcrumbBar parent="Academic Setup" title="Courses" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`All Courses (${courses.length})`}
          columns={columns}
          data={courses}
          searchPlaceholder="Search courses, SKU, program..."
          toolbarRight={
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await fetch("/api/crm-resources", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        resource: "courses",
                        action: "bulk_delete",
                        ids: selectedIds,
                      }),
                    })
                    toast.success(`Deleted ${selectedIds.length} courses`)
                    setSelectedIds([])
                    load()
                  }}
                  className="h-8 text-xs"
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                <Link href="/institute-manager">Institute Manager</Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    sku: "",
                    price: "",
                    quantity: "60",
                    program_id: programs[0] ? String(programs[0].id) : "",
                    description: "",
                    status: "1",
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Add Course
              </Button>
            </div>
          }
        />
      </Card>

      {/* Add / Edit Course Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Course #${editing.id}` : "Add New Course"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure course name, SKU, fee, seat intake, program mapping, and status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
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
              if (res.ok) {
                toast.success(editing ? "Course updated!" : "Course created!")
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Course Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="B.Tech Computer Science"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">SKU *</Label>
                <Input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="BTECH-CSE-01"
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Price / Fee (₹) *</Label>
                <Input
                  type="number"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Quantity / Seats *</Label>
                <Input
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Academic Program</Label>
                <select
                  value={form.program_id}
                  onChange={(e) =>
                    setForm({ ...form, program_id: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">-- Select Program --</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
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
                placeholder="Course syllabus overview or specialization highlights..."
                className="text-xs"
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
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                {editing ? "Update Course" : "Create Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Course Details Dialog */}
      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {viewing?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              SKU: {viewing?.sku} • Program:{" "}
              {progMap[String(viewing?.program_id)] || "-"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md bg-muted/40 p-3">
            <div>
              <strong>Course Fee:</strong> ₹
              {Number(viewing?.price || 0).toLocaleString("en-IN")}
            </div>
            <div>
              <strong>Available Seats:</strong> {viewing?.quantity ?? 1}
            </div>
            <div>
              <strong>Description:</strong>{" "}
              {viewing?.description || "No description provided."}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
