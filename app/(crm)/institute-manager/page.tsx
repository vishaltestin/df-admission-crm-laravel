"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { FormSelect } from "@/components/ui/form-select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function InstituteManagerPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [loading, setLoading] = React.useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = React.useState<any[]>([])

  const [selectedInstId, setSelectedInstId] = React.useState<string>("")
  const [selectedProgId, setSelectedProgId] = React.useState<string>("")
  const [courseFilterMode, setCourseFilterMode] = React.useState<
    "program" | "unassigned" | "all"
  >("program")

  const [modal, setModal] = React.useState<
    null | "institute" | "program" | "course"
  >(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewCourse, setViewCourse] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    code: "",
    sku: "",
    address: "",
    description: "",
    price: "45000",
    quantity: "60",
    status: "1",
    institute_id: "",
    program_id: "",
  })

  const load = React.useCallback(async () => {
    try {
      const r = await fetch("/api/crm-resources?resource=institutes")
      const d = await r.json()
      const insts = d.institutes || []
      const progs = d.programs || []
      setInstitutes(insts)
      setPrograms(progs)
      setCourses(d.courses || [])

      setSelectedInstId((prev) => {
        if (
          prev &&
          insts.some((i: { id: string | number }) => String(i.id) === prev)
        ) {
          return prev
        }
        return insts[0] ? String(insts[0].id) : ""
      })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const filteredPrograms = React.useMemo(
    () =>
      programs.filter((p) => String(p.institute_id) === String(selectedInstId)),
    [programs, selectedInstId]
  )

  React.useEffect(() => {
    if (
      filteredPrograms.length > 0 &&
      !filteredPrograms.some((p) => String(p.id) === String(selectedProgId))
    ) {
      setSelectedProgId(String(filteredPrograms[0].id))
    } else if (filteredPrograms.length === 0) {
      setSelectedProgId("")
    }
  }, [filteredPrograms, selectedProgId])

  const unassignedCourses = React.useMemo(
    () => courses.filter((c) => !c.program_id),
    [courses]
  )

  const displayedCourses = React.useMemo(() => {
    if (courseFilterMode === "unassigned") return unassignedCourses
    if (courseFilterMode === "all") return courses
    if (!selectedProgId) return []
    return courses.filter(
      (c) => String(c.program_id) === String(selectedProgId)
    )
  }, [courses, unassignedCourses, courseFilterMode, selectedProgId])

  // Group programs with their institute label for Course modal dropdown
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

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return

    if (modal === "program" && !form.institute_id) {
      toast.error("Please select an Institute for this Program")
      return
    }

    const resource =
      modal === "institute"
        ? "institutes"
        : modal === "program"
          ? "programs"
          : "courses"

    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource,
        action: editing ? "update" : "create",
        id: editing?.id,
        ...form,
        institute_id: form.institute_id || selectedInstId || null,
        program_id:
          modal === "course" ? form.program_id || null : form.program_id,
      }),
    })

    if (!res.ok) {
      toast.error("Failed to save item")
      return
    }

    toast.success(
      `${modal.charAt(0).toUpperCase() + modal.slice(1)} ${
        editing ? "updated" : "created"
      }`
    )
    if (modal === "program" && form.institute_id) {
      setSelectedInstId(String(form.institute_id))
    }
    if (modal === "course" && form.program_id) {
      setCourseFilterMode("program")
      const targetProg = programs.find(
        (p) => String(p.id) === String(form.program_id)
      )
      if (targetProg) setSelectedInstId(String(targetProg.institute_id))
      setSelectedProgId(String(form.program_id))
    }
    setModal(null)
    setEditing(null)
    load()
  }

  function removeItem(
    resource: "institutes" | "programs" | "courses",
    id: string | number,
    name?: string
  ) {
    const singular =
      resource === "institutes"
        ? "Institute"
        : resource === "programs"
          ? "Program / Faculty"
          : "Course"
    confirmDelete({
      title: `Delete ${singular}?`,
      description: `Are you sure you want to permanently delete "${
        name || `#${id}`
      }"? This action cannot be undone.`,
      onConfirm: async () => {
        const res = await fetch("/api/crm-resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource, action: "delete", id }),
        })
        if (!res.ok) {
          toast.error(`Failed to delete ${singular.toLowerCase()}`)
          return
        }
        toast.success(`${singular} deleted`)
        load()
      },
    })
  }

  async function assignCourseProgram(
    courseId: string | number,
    programId: string
  ) {
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "courses",
        action: "assign_program",
        id: courseId,
        program_id: programId || null,
      }),
    })
    if (res.ok) {
      toast.success(
        programId ? "Course assigned to program" : "Course unassigned"
      )
      load()
    } else {
      toast.error("Failed to assign course")
    }
  }

  const selectedInstituteName =
    institutes.find((i) => String(i.id) === String(selectedInstId))?.name ||
    "Select Institute"
  const selectedProgramName =
    programs.find((p) => String(p.id) === String(selectedProgId))?.name ||
    "Select Program"

  return (
    <div>
      <BreadcrumbBar
        parent="Academic"
        title="Institute → Program → Course Manager"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4">
              <Skeleton className="mb-3 h-6 w-40" />
              <div className="space-y-2.5">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Column 1: Institutes */}
          <Card className="gap-0 py-0 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
              <CardTitle className="text-xs font-bold uppercase text-foreground">
                1. Institutes ({institutes.length})
              </CardTitle>
              <Button
                size="xs"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    code: "",
                    sku: "",
                    address: "",
                    description: "",
                    price: "0",
                    quantity: "60",
                    status: "1",
                    institute_id: "",
                    program_id: "",
                  })
                  setModal("institute")
                }}
                className="bg-[#0ab39c] text-xs font-medium text-white hover:bg-[#099885]"
              >
                + Add Institute
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {institutes.map((inst) => {
                const active = String(inst.id) === String(selectedInstId)
                const progCount = programs.filter(
                  (p) => String(p.institute_id) === String(inst.id)
                ).length
                return (
                  <div
                    key={inst.id}
                    onClick={() => {
                      setSelectedInstId(String(inst.id))
                      setCourseFilterMode("program")
                    }}
                    className={`flex cursor-pointer items-center justify-between px-4 py-3 text-xs transition ${
                      active
                        ? "border-l-4 border-[#405189] bg-[#405189]/8"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold text-foreground">
                        {inst.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{inst.code || "No code"}</span>
                        <span>•</span>
                        <span>{progCount} programs</span>
                        <Badge
                          variant="secondary"
                          className={`px-1.5 py-0 text-[10px] ${
                            Number(inst.status ?? 1) === 1
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {Number(inst.status ?? 1) === 1
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditing(inst)
                          setForm({
                            name: inst.name || "",
                            code: inst.code || "",
                            sku: "",
                            address: inst.address || "",
                            description: "",
                            price: "0",
                            quantity: "60",
                            status: String(inst.status ?? 1),
                            institute_id: "",
                            program_id: "",
                          })
                          setModal("institute")
                        }}
                        className="text-[11px]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() =>
                          removeItem("institutes", inst.id, inst.name)
                        }
                        className="text-[11px]"
                      >
                        Del
                      </Button>
                    </div>
                  </div>
                )
              })}
              {institutes.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No institutes found. Click <strong>+ Add Institute</strong> to
                  get started.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 2: Programs / Faculties */}
          <Card className="gap-0 py-0 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0 pr-2">
                <CardTitle className="text-xs font-bold uppercase text-foreground">
                  2. Programs / Faculties ({filteredPrograms.length})
                </CardTitle>
                <p className="truncate text-[11px] text-muted-foreground">
                  Institute: {selectedInstituteName}
                </p>
              </div>
              <Button
                size="xs"
                disabled={institutes.length === 0}
                onClick={() => {
                  setEditing(null)
                  setForm({
                    name: "",
                    code: "",
                    sku: "",
                    address: "",
                    description: "",
                    price: "0",
                    quantity: "60",
                    status: "1",
                    institute_id:
                      selectedInstId ||
                      (institutes[0] ? String(institutes[0].id) : ""),
                    program_id: "",
                  })
                  setModal("program")
                }}
                className="shrink-0 bg-[#405189] text-xs font-medium text-white hover:bg-[#364574]"
              >
                + Add Program
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {filteredPrograms.map((prog) => {
                const active =
                  courseFilterMode === "program" &&
                  String(prog.id) === String(selectedProgId)
                const courseCount = courses.filter(
                  (c) => String(c.program_id) === String(prog.id)
                ).length
                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgId(String(prog.id))
                      setCourseFilterMode("program")
                    }}
                    className={`flex cursor-pointer items-center justify-between px-4 py-3 text-xs transition ${
                      active
                        ? "border-l-4 border-[#0ab39c] bg-[#0ab39c]/8"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-semibold text-foreground">
                        {prog.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>
                          {prog.description || prog.code || "Academic Faculty"}
                        </span>
                        <span>•</span>
                        <span>{courseCount} courses</span>
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditing(prog)
                          setForm({
                            name: prog.name || "",
                            code: prog.code || "",
                            sku: "",
                            address: "",
                            description: prog.description || "",
                            price: "0",
                            quantity: "60",
                            status: String(prog.status ?? 1),
                            institute_id: String(
                              prog.institute_id || selectedInstId || ""
                            ),
                            program_id: "",
                          })
                          setModal("program")
                        }}
                        className="text-[11px]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() =>
                          removeItem("programs", prog.id, prog.name)
                        }
                        className="text-[11px]"
                      >
                        Del
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filteredPrograms.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No programs under this institute yet. Click{" "}
                  <strong>+ Add Program</strong> above.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column 3: Courses */}
          <Card className="gap-0 py-0 shadow-xs">
            <CardHeader className="flex flex-col gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-xs font-bold uppercase text-foreground">
                    3. Courses ({displayedCourses.length})
                  </CardTitle>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {courseFilterMode === "program"
                      ? `Program: ${selectedProgramName}`
                      : courseFilterMode === "unassigned"
                        ? "Unassigned Courses"
                        : "All Organization Courses"}
                  </p>
                </div>
                <Button
                  size="xs"
                  onClick={() => {
                    setEditing(null)
                    setForm({
                      name: "",
                      code: "",
                      sku: `CRS-${Date.now().toString().slice(-5)}`,
                      address: "",
                      description: "",
                      price: "45000",
                      quantity: "60",
                      status: "1",
                      institute_id: selectedInstId || "",
                      program_id:
                        courseFilterMode === "program" ? selectedProgId : "",
                    })
                    setModal("course")
                  }}
                  className="shrink-0 bg-amber-500 text-xs font-medium text-white hover:bg-amber-600"
                >
                  + Add Course
                </Button>
              </div>

              {/* Filter pills: Selected Program | Unassigned | All */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCourseFilterMode("program")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    courseFilterMode === "program"
                      ? "bg-[#405189] text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  By Program
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilterMode("unassigned")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    courseFilterMode === "unassigned"
                      ? "bg-amber-600 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Unassigned ({unassignedCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCourseFilterMode("all")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                    courseFilterMode === "all"
                      ? "bg-[#0ab39c] text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({courses.length})
                </button>
              </div>
            </CardHeader>

            <CardContent className="divide-y divide-border p-0">
              {displayedCourses.map((c) => (
                <div key={c.id} className="space-y-2 px-4 py-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">
                        {c.name}
                      </div>
                      <div className="mt-0.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        Fee: ₹{Number(c.price || 0).toLocaleString("en-IN")} •{" "}
                        {c.quantity ?? 60} seats • SKU: {c.sku}
                      </div>
                      {c.program_name && courseFilterMode !== "program" && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {c.institute_name ? `${c.institute_name} → ` : ""}
                          {c.program_name}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setViewCourse(c)}
                        className="text-[11px]"
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setEditing(c)
                          setForm({
                            name: c.name || "",
                            code: "",
                            sku: c.sku || "",
                            address: "",
                            description: c.description || "",
                            price: String(c.price ?? 0),
                            quantity: String(c.quantity ?? 60),
                            status: String(c.status ?? 1),
                            institute_id: c.institute_id
                              ? String(c.institute_id)
                              : selectedInstId,
                            program_id: c.program_id
                              ? String(c.program_id)
                              : "",
                          })
                          setModal("course")
                        }}
                        className="text-[11px]"
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => removeItem("courses", c.id, c.name)}
                        className="text-[11px]"
                      >
                        Del
                      </Button>
                    </div>
                  </div>

                  {courseFilterMode === "unassigned" && programs.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        Assign Program:
                      </span>
                      <FormSelect
                        size="sm"
                        className="h-7 text-[11px]"
                        value={c.program_id ? String(c.program_id) : ""}
                        placeholder="Select Program to Assign..."
                        onValueChange={(val) => {
                          if (val) assignCourseProgram(c.id, val)
                        }}
                        options={[
                          { value: "", label: "-- Select Program --" },
                          ...programOptions,
                        ]}
                      />
                    </div>
                  )}
                </div>
              ))}
              {displayedCourses.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {courseFilterMode === "unassigned"
                    ? "No unassigned courses."
                    : "No courses in this view yet. Click + Add Course above."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add / Edit Institute, Program, or Course Dialog */}
      <Dialog
        open={Boolean(modal)}
        onOpenChange={(o) => {
          if (!o) {
            setModal(null)
            setEditing(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {editing ? `Edit ${modal}` : `Add New ${modal}`}
            </DialogTitle>
            <DialogDescription>
              Configure academic hierarchy details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3 text-xs">
            {/* Program Modal -> Institute Dropdown */}
            {modal === "program" && (
              <div>
                <Label className="mb-1 block text-xs">
                  Institute <span className="text-rose-500">*</span>
                </Label>
                <FormSelect
                  value={form.institute_id}
                  onValueChange={(v) => setForm({ ...form, institute_id: v })}
                  placeholder="Select Institute"
                  options={[
                    { value: "", label: "Select Institute" },
                    ...institutes.map((i) => ({
                      value: String(i.id),
                      label: i.name,
                    })),
                  ]}
                />
              </div>
            )}

            {/* Course Modal ->SKU & Program Dropdown */}
            {modal === "course" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label className="mb-1 block text-xs">
                    SKU <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="e.g. BTECH-CSE-01"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">
                    Program / Faculty
                  </Label>
                  <FormSelect
                    value={form.program_id}
                    onValueChange={(v) => setForm({ ...form, program_id: v })}
                    placeholder="-- Select Program --"
                    options={[
                      { value: "", label: "-- Unassigned / General --" },
                      ...programOptions,
                    ]}
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="mb-1 block text-xs capitalize">
                {modal} Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={
                  modal === "institute"
                    ? "e.g. Assam Down Town University"
                    : modal === "program"
                      ? "e.g. Faculty of Engineering"
                      : "e.g. B.Tech Computer Science"
                }
              />
            </div>

            {modal === "institute" && (
              <>
                <div>
                  <Label className="mb-1 block text-xs">Institute Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. ADTU-MAIN"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Campus Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Campus city / address"
                  />
                </div>
              </>
            )}

            {modal === "program" && (
              <div>
                <Label className="mb-1 block text-xs">Description</Label>
                <Textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Optional faculty / program notes..."
                />
              </div>
            )}

            {modal === "course" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block text-xs">
                      Course Fee (₹) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">
                      Total Seats / Quantity{" "}
                      <span className="text-rose-500">*</span>
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
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Description</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Course curriculum, eligibility, duration..."
                  />
                </div>
              </>
            )}

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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick View Course Modal */}
      <Dialog
        open={Boolean(viewCourse)}
        onOpenChange={(o) => {
          if (!o) setViewCourse(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{viewCourse?.name}</span>
              <Badge
                className={
                  Number(viewCourse?.status ?? 1) === 1
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }
              >
                {Number(viewCourse?.status ?? 1) === 1 ? "Active" : "Inactive"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              SKU: <span className="font-mono">{viewCourse?.sku || "-"}</span> •
              Course ID #{viewCourse?.id}
            </DialogDescription>
          </DialogHeader>
          {viewCourse && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    Institute
                  </div>
                  <div className="font-semibold">
                    {viewCourse.institute_name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    Program / Faculty
                  </div>
                  <div className="font-semibold">
                    {viewCourse.program_name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    Course Fee
                  </div>
                  <div className="font-semibold text-emerald-700">
                    ₹{Number(viewCourse.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    Seats (In Stock / Allocated)
                  </div>
                  <div className="font-semibold">
                    {viewCourse.quantity ?? 0} total (
                    {viewCourse.in_stock ?? viewCourse.quantity ?? 0} available,{" "}
                    {viewCourse.allocated ?? 0} allocated)
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                  Course Description
                </div>
                <p className="leading-relaxed text-foreground">
                  {viewCourse.description || "No description provided."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCourse(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
