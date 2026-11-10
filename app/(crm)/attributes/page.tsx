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

const ENTITY_TYPES = [
  { value: "leads", label: "Lead" },
  { value: "persons", label: "Person" },
  { value: "organizations", label: "Organization" },
  { value: "products", label: "Product / Course" },
  { value: "quotes", label: "Quote" },
  { value: "warehouses", label: "Warehouse / Campus" },
]

const FIELD_TYPES = [
  "text",
  "textarea",
  "price",
  "boolean",
  "select",
  "multiselect",
  "checkbox",
  "email",
  "address",
  "phone",
  "lookup",
  "datetime",
  "date",
  "image",
  "file",
]

const VALIDATION_OPTIONS = [
  { value: "", label: "None (No extra validation)" },
  { value: "email", label: "Email Format (email)" },
  { value: "numeric", label: "Numeric / Integer Only (numeric)" },
  { value: "decimal", label: "Decimal / Currency Number (decimal)" },
  { value: "url", label: "Valid Website URL (url)" },
  { value: "alpha_num", label: "Alphanumeric Only (alpha_num)" },
  { value: "digits:10", label: "10-Digit Mobile Number (digits:10)" },
]

const LOOKUP_ENTITIES = [
  "leads",
  "lead_pipelines",
  "lead_pipeline_stages",
  "users",
  "organizations",
  "persons",
  "warehouses",
  "products",
]

export default function AttributesPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)

  const [form, setForm] = React.useState({
    code: "",
    name: "",
    entity_type: "leads",
    type: "text",
    lookup_type: "",
    validation: "",
    sort_order: "1",
    is_required: false,
    is_unique: false,
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=attributes")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const allChecked = items.length > 0 && selectedIds.length === items.length

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
              setSelectedIds(Boolean(v) ? items.map((a) => String(a.id)) : [])
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
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[#405189]">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "entity_type",
        header: "Entity Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize text-[10px]">
            {row.original.entity_type}
          </Badge>
        ),
      },
      {
        accessorKey: "type",
        header: "Field Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {row.original.type}
            {row.original.lookup_type ? ` → ${row.original.lookup_type}` : ""}
          </Badge>
        ),
      },
      {
        accessorFn: (a) => a.validation || "-",
        id: "validation",
        header: "Validation",
        cell: ({ row }) =>
          row.original.validation ? (
            <Badge className="bg-sky-100 font-mono text-[10px] text-sky-700">
              {row.original.validation}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "flags",
        header: "Flags",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.is_required ? (
              <Badge className="bg-amber-100 text-[10px] text-amber-800">
                Required
              </Badge>
            ) : null}
            {row.original.is_unique ? (
              <Badge className="bg-purple-100 text-[10px] text-purple-800">
                Unique
              </Badge>
            ) : null}
            {!row.original.is_required && !row.original.is_unique && (
              <span className="text-muted-foreground">Optional</span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const a = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(a)
                  setForm({
                    code: a.code || "",
                    name: a.name || "",
                    entity_type: a.entity_type || "leads",
                    type: a.type || "text",
                    lookup_type: a.lookup_type || "",
                    validation: a.validation || "",
                    sort_order: String(a.sort_order ?? 1),
                    is_required: Boolean(a.is_required),
                    is_unique: Boolean(a.is_unique),
                  })
                  setShowModal(true)
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit
              </Button>
              {!a.is_user_defined && a.is_user_defined !== undefined ? null : (
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: "Delete Custom Attribute?",
                      description: `Are you sure you want to delete attribute "${a.name || a.code}"?`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "attributes",
                            action: "delete",
                            id: a.id,
                          }),
                        })
                        toast.success("Attribute deleted")
                        load()
                      },
                    })
                  }
                  className="text-[11px]"
                >
                  Delete
                </Button>
              )}
            </div>
          )
        },
      },
    ],
    [allChecked, items, selectedIds, load, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar parent="Master Data" title="Custom Attributes" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Custom CRM Attributes (${items.length})`}
          columns={columns}
          data={items}
          searchPlaceholder="Search code, name, entity, validation..."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: `Delete ${selectedIds.length} Attribute(s)?`,
                      description: `Are you sure you want to permanently delete ${selectedIds.length} selected attribute(s)?`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "attributes",
                            action: "bulk_delete",
                            ids: selectedIds,
                          }),
                        })
                        toast.success("Selected attributes deleted")
                        setSelectedIds([])
                        load()
                      },
                    })
                  }
                  className="h-8 text-xs"
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null)
                  setForm({
                    code: "",
                    name: "",
                    entity_type: "leads",
                    type: "text",
                    lookup_type: "",
                    validation: "",
                    sort_order: String(items.length + 1),
                    is_required: false,
                    is_unique: false,
                  })
                  setShowModal(true)
                }}
                className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
              >
                + Create Attribute
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing
                ? `Edit Attribute — ${editing.code}`
                : "Create Custom Attribute"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure attribute code, entity target, field input type, lookup entity, and validation rules.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "attributes",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Attribute updated!" : "Attribute created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Attribute Code *</Label>
                <Input
                  required
                  readOnly={Boolean(editing)}
                  placeholder="entrance_exam_score"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Attribute Name *</Label>
                <Input
                  required
                  placeholder="Entrance Exam Score"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="mb-1 block text-xs">Entity Type *</Label>
                <FormSelect
                  value={form.entity_type}
                  onChange={(e) =>
                    setForm({ ...form, entity_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  {ENTITY_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {et.label}
                    </option>
                  ))}
                </FormSelect>
              </div>

              <div>
                <Label className="mb-1 block text-xs">Field Input Type *</Label>
                <FormSelect
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            {form.type === "lookup" && (
              <div>
                <Label className="mb-1 block text-xs">Lookup Target Entity *</Label>
                <FormSelect
                  value={form.lookup_type}
                  onChange={(e) =>
                    setForm({ ...form, lookup_type: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  <option value="">Select Lookup Entity</option>
                  {LOOKUP_ENTITIES.map((le) => (
                    <option key={le} value={le}>
                      {le}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">Validation Rule</Label>
                <FormSelect
                  value={form.validation}
                  onChange={(e) =>
                    setForm({ ...form, validation: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-xs"
                >
                  {VALIDATION_OPTIONS.map((vo) => (
                    <option key={vo.value} value={vo.value}>
                      {vo.label}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.is_required}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_required: Boolean(v) })
                  }
                />
                <span>Is Required</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.is_unique}
                  onCheckedChange={(v) =>
                    setForm({ ...form, is_unique: Boolean(v) })
                  }
                />
                <span>Is Unique (Prevent Duplicate Values)</span>
              </label>
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
                {editing ? "Update Attribute" : "Save Attribute"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {DeleteDialog}
    </div>
  )
}
