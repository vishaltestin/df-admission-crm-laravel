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
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface PipelineStageItem {
  id?: number
  uid: string
  name: string
  probability: number
  sort_order?: number
  is_final?: number
}

interface RawStage {
  id: number
  name: string | null
  code: string | null
  probability: number
  sort_order: number
  is_final: number
  lead_pipeline_id: number
}

interface PipelineRecord {
  id: number
  name: string
  rotten_days: number
  is_default: number | boolean
  created_at?: string | null
  stages: RawStage[]
}

export default function PipelinesPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  const [pipelines, setPipelines] = React.useState<PipelineRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<string[]>([])

  // Add New Pipeline Modal state
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [savingAdd, setSavingAdd] = React.useState(false)
  const [addForm, setAddForm] = React.useState({
    name: "",
    rotten_days: "15",
    final_stage: "Closed",
    is_default: false,
  })

  // Pipeline Builder Modal state
  const [builderOpen, setBuilderOpen] = React.useState(false)
  const [savingBuilder, setSavingBuilder] = React.useState(false)
  const [activePipeline, setActivePipeline] =
    React.useState<PipelineRecord | null>(null)
  const [builderMeta, setBuilderMeta] = React.useState({
    name: "",
    rotten_days: "15",
    is_default: false,
  })
  const [firstStageName, setFirstStageName] = React.useState("New Lead")
  const [middleStages, setMiddleStages] = React.useState<PipelineStageItem[]>(
    []
  )
  const [finalStageName, setFinalStageName] = React.useState("Closed")

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = React.useState<number | null>(null)
  const [overIdx, setOverIdx] = React.useState<number | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/crm-resources?resource=pipelines")
      const d = await res.json()
      setPipelines(d.items || [])
    } catch {
      toast.error("Failed to load pipelines")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const openBuilder = React.useCallback((p: PipelineRecord) => {
    const sorted = [...(p.stages || [])].sort(
      (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
    )
    const fixedFirst = sorted.find(
      (s) => Number(s.is_final) === 0 && Number(s.sort_order) === 0
    )
    const standaloneFinal = sorted.find((s) => Number(s.is_final) === 1)
    const middle = sorted.filter(
      (s) =>
        Number(s.is_final) === 0 &&
        Number(s.sort_order) > 0 &&
        s.id !== fixedFirst?.id &&
        s.id !== standaloneFinal?.id
    )

    setActivePipeline(p)
    setBuilderMeta({
      name: p.name || "",
      rotten_days: String(p.rotten_days ?? 15),
      is_default: Boolean(p.is_default),
    })
    setFirstStageName(fixedFirst?.name || "New Lead")
    setMiddleStages(
      middle.map((m) => ({
        id: m.id,
        uid: `stage-${m.id}`,
        name: m.name || "",
        probability: Number(m.probability ?? 0),
        sort_order: m.sort_order,
        is_final: 0,
      }))
    )
    setFinalStageName(standaloneFinal?.name || "Closed")
    setDragIdx(null)
    setOverIdx(null)
    setBuilderOpen(true)
  }, [])

  function moveStage(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return
    setMiddleStages((prev) => {
      if (from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  function addMiddleStage() {
    setMiddleStages((prev) => [
      ...prev,
      {
        uid: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        probability: Math.min(90, (prev.length + 1) * 20),
        is_final: 0,
      },
    ])
  }

  function removeMiddleStage(uid: string) {
    setMiddleStages((prev) => prev.filter((s) => s.uid !== uid))
  }

  const columns = React.useMemo<ColumnDef<PipelineRecord>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={
              pipelines.length > 0 && selected.length === pipelines.length
            }
            onCheckedChange={(checked) =>
              setSelected(checked ? pipelines.map((x) => String(x.id)) : [])
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
        header: "Name",
        cell: ({ row }) => {
          const p = row.original
          return (
            <div>
              <button
                type="button"
                onClick={() => openBuilder(p)}
                className="font-semibold text-[#405189] hover:underline"
              >
                {p.name}
              </button>
              <div className="text-[11px] text-muted-foreground">
                {(p.stages || []).length} total stages configured
              </div>
            </div>
          )
        },
      },
      {
        id: "stages_flow",
        header: "Pipeline Stages (First → Middle → Final)",
        enableSorting: false,
        cell: ({ row }) => {
          const sorted = [...(row.original.stages || [])].sort(
            (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
          )
          const first =
            sorted.find(
              (s) => Number(s.is_final) === 0 && Number(s.sort_order) === 0
            )?.name || "New Lead"
          const finalSt =
            sorted.find((s) => Number(s.is_final) === 1)?.name || "Closed"
          const mids = sorted.filter(
            (s) => Number(s.is_final) === 0 && Number(s.sort_order) > 0
          )

          return (
            <div className="flex flex-wrap items-center gap-1 py-0.5">
              <Badge
                variant="outline"
                className="border-sky-300 bg-sky-50 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
              >
                {first}
              </Badge>
              {mids.map((m) => (
                <React.Fragment key={m.id}>
                  <i className="ri-arrow-right-s-line text-muted-foreground" />
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {m.name}
                  </Badge>
                </React.Fragment>
              ))}
              <i className="ri-arrow-right-s-line text-muted-foreground" />
              <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
                <i className="ri-flag-2-fill mr-1" />
                {finalSt}
              </Badge>
            </div>
          )
        },
      },
      {
        accessorKey: "rotten_days",
        header: "Rotten Days",
        cell: ({ row }) => (
          <span className="font-mono font-medium">
            {row.original.rotten_days ?? 15} Days
          </span>
        ),
      },
      {
        id: "is_default",
        accessorFn: (p) => (p.is_default ? "Yes" : "No"),
        header: "Default",
        cell: ({ row }) =>
          row.original.is_default ? (
            <Badge className="bg-[#0ab39c]/15 text-[10px] font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/20">
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              No
            </Badge>
          ),
      },
      {
        id: "created_at",
        accessorFn: (p) => p.created_at || "",
        header: "Created",
        cell: ({ row }) => {
          const dt = row.original.created_at
          if (!dt) return <span className="text-muted-foreground">—</span>
          const d = new Date(dt)
          return (
            <span className="text-muted-foreground">
              {Number.isNaN(d.getTime())
                ? String(dt).slice(0, 10)
                : d.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
            </span>
          )
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                type="button"
                size="xs"
                onClick={() => openBuilder(p)}
                title="Open Pipeline Builder"
                className="bg-[#405189] text-[11px] font-medium text-white hover:bg-[#364574]"
              >
                <i className="ri-pencil-line mr-1" />
                Edit Stages
              </Button>
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  confirmDelete({
                    title: "Delete Pipeline?",
                    description: `Are you sure you want to permanently delete pipeline "${p.name}" and all ${(p.stages || []).length} of its stages? This action cannot be undone.`,
                    confirmLabel: "Yes, Delete Pipeline",
                    onConfirm: async () => {
                      const res = await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "pipelines",
                          action: "delete",
                          id: p.id,
                        }),
                      })
                      if (res.ok) {
                        setSelected((prev) =>
                          prev.filter((id) => id !== String(p.id))
                        )
                        toast.success(`Pipeline "${p.name}" deleted`)
                        await load()
                      } else {
                        toast.error("Failed to delete pipeline")
                      }
                    },
                  })
                }}
                title="Delete Pipeline"
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
    [pipelines, selected, openBuilder, confirmDelete, load]
  )

  return (
    <div className="space-y-4">
      <BreadcrumbBar parent="Master Data" title="Lead Pipelines" />

      {loading ? (
        <Card className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-8 w-36" />
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-11 w-full" />
          ))}
        </Card>
      ) : (
        <Card className="gap-0 py-0 text-xs shadow-xs">
          <DataTable
            title={`Lead Pipelines (${pipelines.length})`}
            columns={columns}
            data={pipelines}
            searchPlaceholder="Search pipelines..."
            toolbarRight={
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      confirmDelete({
                        title: `Delete ${selected.length} Pipeline(s)?`,
                        description: `Are you sure you want to permanently delete ${selected.length} selected pipeline(s) and their stage configurations?`,
                        confirmLabel: `Delete (${selected.length})`,
                        onConfirm: async () => {
                          const res = await fetch("/api/crm-resources", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resource: "pipelines",
                              action: "bulk_delete",
                              ids: selected,
                            }),
                          })
                          if (res.ok) {
                            setSelected([])
                            toast.success("Selected pipelines deleted")
                            await load()
                          }
                        },
                      })
                    }
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
                    setAddForm({
                      name: "",
                      rotten_days: "15",
                      final_stage: "Closed",
                      is_default: pipelines.length === 0,
                    })
                    setShowAddModal(true)
                  }}
                  className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  <i className="ri-add-line mr-1" />
                  Add Pipeline
                </Button>
              </div>
            }
          />
        </Card>
      )}

      {/* Add New Pipeline Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Add New Pipeline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Creates a new lead pipeline initialized with a fixed{" "}
              <strong>New Lead</strong> entry stage and a standalone{" "}
              <strong>Final Stage</strong>. You can add and drag-reorder middle
              stages in the Pipeline Builder.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setSavingAdd(true)
              try {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "pipelines",
                    action: "create",
                    name: addForm.name,
                    rotten_days: Number(addForm.rotten_days || 15),
                    final_stage: addForm.final_stage || "Closed",
                    is_default: addForm.is_default,
                  }),
                })
                const out = await res.json()
                if (!res.ok) {
                  toast.error(out.error || "Could not create pipeline")
                  return
                }
                toast.success("Pipeline created! Opening Pipeline Builder...")
                setShowAddModal(false)
                const refreshed = await fetch(
                  "/api/crm-resources?resource=pipelines"
                ).then((r) => r.json())
                const list: PipelineRecord[] = refreshed.items || []
                setPipelines(list)
                const created = list.find(
                  (x) => Number(x.id) === Number(out.item?.id)
                )
                if (created) {
                  openBuilder(created)
                }
              } finally {
                setSavingAdd(false)
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Pipeline Name *</Label>
              <Input
                required
                placeholder="e.g. Admissions 2026-27 Funnel"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Rotten Days</Label>
                <Input
                  type="number"
                  min={1}
                  value={addForm.rotten_days}
                  onChange={(e) =>
                    setAddForm({ ...addForm, rotten_days: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Final Stage Label</Label>
                <Input
                  value={addForm.final_stage}
                  onChange={(e) =>
                    setAddForm({ ...addForm, final_stage: e.target.value })
                  }
                  placeholder="Closed"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2.5">
              <Switch
                id="add-pipe-default"
                checked={addForm.is_default}
                onCheckedChange={(v) =>
                  setAddForm({ ...addForm, is_default: v })
                }
              />
              <Label
                htmlFor="add-pipe-default"
                className="cursor-pointer text-xs"
              >
                Set as Default Organization Pipeline
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingAdd}
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                {savingAdd ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modern Pipeline Builder Modal (1:1 df-laravel-crm + Drag & Drop + Standalone Final Stage) */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto text-xs sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#405189]">
              <i className="ri-flow-chart text-lg" />
              <span>
                Pipeline Builder — {activePipeline?.name || "Stages"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure pipeline settings, drag and drop middle stages to
              rearrange progression order, and set the standalone Final Stage.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!activePipeline) return
              const cleanMiddle = middleStages
                .map((s) => ({
                  id: s.id,
                  name: s.name.trim(),
                  probability: Number(s.probability ?? 0),
                }))
                .filter((s) => s.name.length > 0)

              setSavingBuilder(true)
              try {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "pipelines",
                    action: "builder_save",
                    id: activePipeline.id,
                    name: builderMeta.name,
                    rotten_days: Number(builderMeta.rotten_days || 15),
                    is_default: builderMeta.is_default,
                    middle_stages: cleanMiddle,
                    final_stage: finalStageName.trim() || "Closed",
                  }),
                })
                const out = await res.json()
                if (!res.ok) {
                  toast.error(out.error || "Failed to update pipeline")
                  return
                }
                toast.success("Pipeline stages & order saved!")
                setBuilderOpen(false)
                await load()
              } finally {
                setSavingBuilder(false)
              }
            }}
            className="space-y-4"
          >
            {/* Pipeline Metadata Header */}
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <Label className="mb-1 block text-xs font-semibold">
                  Pipeline Name *
                </Label>
                <Input
                  required
                  value={builderMeta.name}
                  onChange={(e) =>
                    setBuilderMeta({ ...builderMeta, name: e.target.value })
                  }
                  className="h-9 bg-background text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="mb-1 block text-xs font-semibold">
                  Rotten Days
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={builderMeta.rotten_days}
                  onChange={(e) =>
                    setBuilderMeta({
                      ...builderMeta,
                      rotten_days: e.target.value,
                    })
                  }
                  className="h-9 bg-background text-xs"
                />
              </div>
              <div className="flex items-end pb-1.5 sm:col-span-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="builder-default"
                    checked={builderMeta.is_default}
                    onCheckedChange={(v) =>
                      setBuilderMeta({ ...builderMeta, is_default: v })
                    }
                  />
                  <Label
                    htmlFor="builder-default"
                    className="cursor-pointer text-xs font-medium"
                  >
                    Default Pipeline
                  </Label>
                </div>
              </div>
            </div>

            {/* 1. Fixed First Stage ("New Lead") */}
            <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-900/50 dark:bg-sky-950/20">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
                  <i className="ri-lock-2-line" />
                  <span>First Stage (Fixed Entry Stage)</span>
                </Label>
                <Badge
                  variant="outline"
                  className="border-sky-300 bg-background text-[10px] text-sky-700"
                >
                  Sort Order #0
                </Badge>
              </div>
              <Input
                value={firstStageName}
                disabled
                className="h-9 cursor-not-allowed bg-muted/70 font-semibold text-xs"
              />
            </div>

            {/* 2. Drag & Drop Sortable Middle Stages */}
            <div className="space-y-2.5 rounded-lg border border-border p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <i className="ri-drag-move-2-line text-[#405189]" />
                    <span>Pipeline Stages (Drag & Drop to Rearrange)</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Grab the handle on any stage row to reorder progression, or
                    use the arrow controls.
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {middleStages.length} Middle Stage(s)
                </Badge>
              </div>

              {middleStages.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/15 py-6 text-center text-muted-foreground">
                  No intermediate stages yet. Click{" "}
                  <strong>+ Add Stage</strong> below to add counselling or
                  verification stages between <em>{firstStageName}</em> and{" "}
                  <em>{finalStageName || "Closed"}</em>.
                </div>
              ) : (
                <div className="space-y-2">
                  {middleStages.map((stage, idx) => {
                    const isDragging = dragIdx === idx
                    const isOver = overIdx === idx && dragIdx !== idx
                    return (
                      <div
                        key={stage.uid}
                        draggable
                        onDragStart={(e) => {
                          setDragIdx(idx)
                          e.dataTransfer.effectAllowed = "move"
                          e.dataTransfer.setData("text/plain", String(idx))
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = "move"
                          if (overIdx !== idx) setOverIdx(idx)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const from =
                            dragIdx !== null
                              ? dragIdx
                              : Number(e.dataTransfer.getData("text/plain"))
                          if (!Number.isNaN(from) && from !== idx) {
                            moveStage(from, idx)
                          }
                          setDragIdx(null)
                          setOverIdx(null)
                        }}
                        onDragEnd={() => {
                          setDragIdx(null)
                          setOverIdx(null)
                        }}
                        className={cn(
                          "flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2.5 shadow-2xs transition-all sm:flex-nowrap",
                          isDragging && "opacity-45 ring-2 ring-[#405189]",
                          isOver
                            ? "border-[#405189] bg-[#405189]/5 ring-2 ring-[#405189]/40"
                            : "border-border hover:border-[#405189]/50"
                        )}
                      >
                        <span
                          title="Drag to reorder stage"
                          className="flex cursor-grab items-center gap-1 rounded px-1.5 py-1 text-[#405189] active:cursor-grabbing"
                        >
                          <i className="ri-draggable text-lg" />
                          <span className="font-mono text-[11px] font-bold text-muted-foreground">
                            #{idx + 1}
                          </span>
                        </span>

                        <Input
                          required
                          placeholder="Enter stage name (e.g. Verified, Application Started)"
                          value={stage.name}
                          onChange={(e) => {
                            const val = e.target.value
                            setMiddleStages((prev) =>
                              prev.map((x) =>
                                x.uid === stage.uid ? { ...x, name: val } : x
                              )
                            )
                          }}
                          className="h-8 flex-1 text-xs"
                        />

                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={stage.probability}
                            onChange={(e) => {
                              const prob = Number(e.target.value || 0)
                              setMiddleStages((prev) =>
                                prev.map((x) =>
                                  x.uid === stage.uid
                                    ? { ...x, probability: prob }
                                    : x
                                )
                              )
                            }}
                            title="Win probability (%)"
                            className="h-8 w-16 text-center font-mono text-xs"
                          />
                          <span className="text-[11px] text-muted-foreground">
                            %
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            disabled={idx === 0}
                            onClick={() => moveStage(idx, idx - 1)}
                            title="Move Up"
                            className="h-7 w-7 p-0"
                          >
                            <i className="ri-arrow-up-s-line text-sm" />
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            disabled={idx === middleStages.length - 1}
                            onClick={() => moveStage(idx, idx + 1)}
                            title="Move Down"
                            className="h-7 w-7 p-0"
                          >
                            <i className="ri-arrow-down-s-line text-sm" />
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            onClick={() => removeMiddleStage(stage.uid)}
                            className="h-7 border-rose-200 bg-rose-50 px-2.5 text-[11px] font-medium text-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addMiddleStage}
                  className="h-8 rounded-full border-[#405189]/40 px-4 text-xs font-semibold text-[#405189] hover:bg-[#405189] hover:text-white"
                >
                  <i className="ri-add-line mr-1" />
                  Add Stage
                </Button>
              </div>
            </div>

            {/* 3. Standalone Final Stage Section */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <i className="ri-flag-2-fill" />
                  <span>Final Stage (Standalone Terminal Stage) *</span>
                </Label>
                <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
                  is_final = 1 • Sort #9999
                </Badge>
              </div>
              <Input
                required
                value={finalStageName}
                onChange={(e) => setFinalStageName(e.target.value)}
                placeholder="Closed"
                className="h-9 bg-background font-semibold text-xs"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Leads moved into this standalone final stage mark completion of
                the pipeline (e.g. <strong>Closed</strong>,{" "}
                <strong>Enrolled</strong>, or <strong>Admission Confirmed</strong>
                ).
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBuilderOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingBuilder}
                className="bg-[#0ab39c] px-5 font-semibold text-white hover:bg-[#099885]"
              >
                {savingBuilder ? (
                  <>
                    <i className="ri-loader-4-line mr-1.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <i className="ri-save-3-line mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
