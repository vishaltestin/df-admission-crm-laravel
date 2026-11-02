"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function MarketingEventsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [showModal, setShowModal] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    date: "2026-11-15",
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=marketing_events")
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Event Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorFn: (ev) => ev.date || "",
        id: "date",
        header: "Event Date",
        cell: ({ row }) =>
          row.original.date
            ? new Date(row.original.date).toLocaleDateString("en-IN")
            : "-",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const ev = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(ev)
                  setForm({
                    name: ev.name || "",
                    description: ev.description || "",
                    date: ev.date
                      ? new Date(ev.date).toISOString().slice(0, 10)
                      : "2026-11-15",
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
                      resource: "marketing_events",
                      action: "delete",
                      id: ev.id,
                    }),
                  })
                  toast.success("Event deleted")
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
      <BreadcrumbBar parent="CRM" title="Marketing Events" />
      <Card className="gap-0 py-0 shadow-xs text-xs">
        <DataTable
          columns={columns}
          data={items}
          searchPlaceholder="Search events..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({ name: "", description: "", date: "2026-11-15" })
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Add Marketing Event
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Marketing Event" : "Add Marketing Event"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Track webinars, education fairs, and campus open-house drives.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "marketing_events",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(editing ? "Event updated!" : "Event added!")
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <Input
              required
              placeholder="Event Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 text-xs"
            />
            <Textarea
              rows={2}
              required
              placeholder="Description *"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="text-xs"
            />
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-9 text-xs"
            />
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
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
