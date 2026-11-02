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

export default function LandingPagesAdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pages, setPages] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [campaigns, setCampaigns] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    title: "",
    slug: "",
    layout_name: "velzon",
    campaign_id: "",
    status: "1",
    seed_default_sections: true,
  })

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=landing_pages")
      .then((r) => r.json())
      .then((d) => {
        setPages(d.landingPages || d.items || [])
        setCampaigns(d.campaigns || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.id}</span>
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
        accessorKey: "slug",
        header: "Slug",
        cell: ({ row }) => (
          <span className="font-mono text-[#405189]">
            {row.original.slug}
          </span>
        ),
      },
      {
        accessorFn: (p) => p.layout_name || "velzon",
        id: "layout_name",
        header: "Layout",
        cell: ({ row }) => (
          <Badge variant="outline" className="uppercase text-[10px]">
            {row.original.layout_name || "velzon"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          Number(row.original.status ?? 1) === 1 ? (
            <Badge className="bg-emerald-100 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-200">
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
          const p = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(p)
                  setForm({
                    title: p.title || "",
                    slug: p.slug || "",
                    layout_name: p.layout_name || "velzon",
                    campaign_id: p.campaign_id ? String(p.campaign_id) : "",
                    status: String(p.status ?? 1),
                    seed_default_sections: false,
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
                <Link href={`/landing-pages/${p.id}/sections`}>Sections</Link>
              </Button>
              <Button
                asChild
                size="xs"
                className="bg-[#0ab39c] text-[11px] text-white hover:bg-[#099885]"
              >
                <Link href={`/lp/${p.slug}`} target="_blank">
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
                      resource: "landing_pages",
                      action: "delete",
                      id: p.id,
                    }),
                  })
                  toast.success("Landing page deleted")
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
      <BreadcrumbBar parent="FormDesk" title="Landing Pages" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Landing Pages"
          columns={columns}
          data={pages}
          searchPlaceholder="Search landing pages..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  title: "",
                  slug: "",
                  layout_name: "velzon",
                  campaign_id: "",
                  status: "1",
                  seed_default_sections: true,
                })
                setShowModal(true)
              }}
              className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
            >
              + Create Page
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? "Edit Landing Page" : "Create Landing Page"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure Velzon 14-section landing template slug, layout, and publish status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "landing_pages",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Landing page updated!" : "Landing page created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div>
              <Label className="mb-1 block text-xs">Title *</Label>
              <Input
                required
                placeholder="Velzon Demo Page"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Slug *</Label>
              <Input
                required
                placeholder="demo-velzon"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="h-9 font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">Layout</Label>
                <select
                  value={form.layout_name}
                  onChange={(e) =>
                    setForm({ ...form, layout_name: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="velzon">Velzon (14 Sections)</option>
                  <option value="admissions">Admissions Classic</option>
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Linked Campaign (Optional)</Label>
              <select
                value={form.campaign_id}
                onChange={(e) =>
                  setForm({ ...form, campaign_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">-- None --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {!editing && (
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={form.seed_default_sections}
                  onCheckedChange={(v) =>
                    setForm({ ...form, seed_default_sections: Boolean(v) })
                  }
                />
                <span>Pre-populate all 14 Velzon sections automatically</span>
              </label>
            )}
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
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Page
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
