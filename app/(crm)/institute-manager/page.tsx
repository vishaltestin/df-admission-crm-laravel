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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalKind = "institute" | "program" | "course" | null

export default function InstituteManagerPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [institutes, setInstitutes] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [programs, setPrograms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [courses, setCourses] = React.useState<any[]>([])

  const [selectedInst, setSelectedInst] = React.useState<string>("")
  const [selectedProg, setSelectedProg] = React.useState<string>("")

  const [modalKind, setModalKind] = React.useState<ModalKind>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    name: "",
    code: "",
    sku: "",
    price: "45000",
    quantity: "60",
    description: "",
    status: "1",
  })

  const load = React.useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch("/api/crm-resources?resource=institutes").then((r) => r.json()),
      fetch("/api/crm-resources?resource=programs").then((r) => r.json()),
      fetch("/api/crm-resources?resource=courses").then((r) => r.json()),
    ])
    const insts = r1.items || []
    const progs = r2.items || []
    setInstitutes(insts)
    setPrograms(progs)
    setCourses(r3.items || [])
    if (!selectedInst && insts[0]) {
      const firstId = String(insts[0].id)
      setSelectedInst(firstId)
      const p = progs.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (x: any) => String(x.institute_id) === firstId
      )
      if (p) setSelectedProg(String(p.id))
    }
  }, [selectedInst])

  React.useEffect(() => {
    load()
  }, [load])

  const filteredPrograms = programs.filter(
    (p) => !selectedInst || String(p.institute_id) === selectedInst
  )
  const filteredCourses = courses.filter(
    (c) => !selectedProg || String(c.program_id) === selectedProg
  )

  function openAdd(kind: ModalKind) {
    setEditing(null)
    setForm({
      name: "",
      code: "",
      sku: "",
      price: "45000",
      quantity: "60",
      description: "",
      status: "1",
    })
    setModalKind(kind)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function openEdit(kind: ModalKind, item: any) {
    setEditing(item)
    setForm({
      name: item.name || "",
      code: item.code || "",
      sku: item.sku || "",
      price: String(item.price ?? 0),
      quantity: String(item.quantity ?? 1),
      description: item.description || "",
      status: String(item.status ?? 1),
    })
    setModalKind(kind)
  }

  async function handleDelete(
    resource: "institutes" | "programs" | "courses",
    id: string
  ) {
    await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, action: "delete", id }),
    })
    toast.success("Deleted successfully")
    load()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modalKind) return
    const resourceMap = {
      institute: "institutes",
      program: "programs",
      course: "courses",
    } as const
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: resourceMap[modalKind],
        action: editing ? "update" : "create",
        id: editing?.id,
        institute_id: selectedInst,
        program_id: selectedProg,
        ...form,
      }),
    })
    if (res.ok) {
      toast.success(editing ? "Updated successfully!" : "Created successfully!")
      setModalKind(null)
      load()
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Academic Setup" title="Institute Manager" />

      <div className="mb-3 flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          Select an Institute on the left to manage its Programs and Courses.
        </p>
        <Button asChild size="xs" variant="outline">
          <Link href="/products">Open Full Courses Table →</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 text-xs lg:grid-cols-3">
        {/* Column 1: Institutes */}
        <Card className="gap-0 overflow-hidden py-0 shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <h4 className="font-bold">1. Institutes ({institutes.length})</h4>
            <Button
              size="xs"
              onClick={() => openAdd("institute")}
              className="bg-[#0ab39c] text-[11px] font-semibold text-white hover:bg-[#099885]"
            >
              + Add Institute
            </Button>
          </div>
          <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
            {institutes.map((inst) => {
              const active = String(inst.id) === selectedInst
              return (
                <div
                  key={inst.id}
                  onClick={() => {
                    const idStr = String(inst.id)
                    setSelectedInst(idStr)
                    const firstProg = programs.find(
                      (p) => String(p.institute_id) === idStr
                    )
                    setSelectedProg(firstProg ? String(firstProg.id) : "")
                  }}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 transition ${
                    active ? "bg-[#405189]/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-semibold">{inst.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{inst.code || "-"}</span>
                      <span>•</span>
                      <span>
                        {Number(inst.status ?? 1) === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openEdit("institute", inst)}
                      className="h-6 px-2 text-[10px]"
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDelete("institutes", String(inst.id))}
                      className="h-6 px-2 text-[10px]"
                    >
                      Del
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Column 2: Programs */}
        <Card className="gap-0 overflow-hidden py-0 shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <h4 className="font-bold">
              2. Programs ({filteredPrograms.length})
            </h4>
            <Button
              size="xs"
              disabled={!selectedInst}
              onClick={() => openAdd("program")}
              className="bg-[#299cdb] text-[11px] font-semibold text-white hover:bg-[#2389c2]"
            >
              + Add Program
            </Button>
          </div>
          <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
            {filteredPrograms.map((p) => {
              const active = String(p.id) === selectedProg
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProg(String(p.id))}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 transition ${
                    active ? "bg-[#299cdb]/10" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-mono">{p.code || "-"}</span>
                      <span>•</span>
                      <span>
                        {Number(p.status ?? 1) === 1 ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => openEdit("program", p)}
                      className="h-6 px-2 text-[10px]"
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleDelete("programs", String(p.id))}
                      className="h-6 px-2 text-[10px]"
                    >
                      Del
                    </Button>
                  </div>
                </div>
              )
            })}
            {filteredPrograms.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                No programs under selected institute.
              </div>
            )}
          </div>
        </Card>

        {/* Column 3: Courses */}
        <Card className="gap-0 overflow-hidden py-0 shadow-xs">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <h4 className="font-bold">3. Courses ({filteredCourses.length})</h4>
            <Button
              size="xs"
              disabled={!selectedProg}
              onClick={() => openAdd("course")}
              className="bg-[#405189] text-[11px] font-semibold text-white hover:bg-[#364574]"
            >
              + Add Course
            </Button>
          </div>
          <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/40"
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="font-mono">{c.sku}</span>
                    <span>•</span>
                    <Badge className="bg-emerald-100 px-1.5 py-0 text-[10px] font-semibold text-emerald-700">
                      ₹{Number(c.price || 0).toLocaleString("en-IN")}
                    </Badge>
                    <span>• Seats: {c.quantity ?? 1}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => openEdit("course", c)}
                    className="h-6 px-2 text-[10px]"
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => handleDelete("courses", String(c.id))}
                    className="h-6 px-2 text-[10px]"
                  >
                    Del
                  </Button>
                </div>
              </div>
            ))}
            {filteredCourses.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                Select a program to view or add courses.
              </div>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={Boolean(modalKind)} onOpenChange={(o) => !o && setModalKind(null)}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold capitalize">
              {editing ? `Edit ${modalKind}` : `Add ${modalKind}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update academic entity code, pricing, description, and active status.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            {modalKind !== "course" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-xs">Short Code *</Label>
                  <Input
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. ADTU / BTECH"
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <Label className="mb-1 block text-xs">SKU *</Label>
                    <Input
                      required
                      value={form.sku}
                      onChange={(e) =>
                        setForm({ ...form, sku: e.target.value })
                      }
                      placeholder="CRS-101"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Fee (₹) *</Label>
                    <Input
                      type="number"
                      required
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-xs">Seats / Qty</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalKind(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
