"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
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

export default function WebformsPage() {
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forms, setForms] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [embedForm, setEmbedForm] = React.useState<any>(null)
  const [origin, setOrigin] = React.useState("")

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=web_forms")
      .then((r) => r.json())
      .then((d) => setForms(d.webforms || d.items || []))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    setOrigin(window.location.origin)
    load()
  }, [load])

  const allChecked = forms.length > 0 && selectedIds.length === forms.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? forms.map((f) => String(f.id)) : [])
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  // Exact columns from df-laravel-crm resources/views/FrontEnd/webforms/index.blade.php:
  // [Checkbox] | Title | Form ID | Views | Submissions | Conversion | Create Lead | Action
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={(v) => toggleAll(Boolean(v))}
            aria-label="Select all web forms"
          />
        ),
        cell: ({ row }) => {
          const id = String(row.original.id)
          return (
            <Checkbox
              checked={selectedIds.includes(id)}
              onCheckedChange={(v) => toggleOne(id, Boolean(v))}
              aria-label={`Select ${row.original.title}`}
            />
          )
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {(row.original.attributes || []).length} fields configured
            </div>
          </div>
        ),
      },
      {
        accessorKey: "form_id",
        header: "Form ID",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-[#405189]">
            {row.original.form_id}
          </span>
        ),
      },
      {
        accessorFn: (f) => Number(f.view_count ?? 0),
        id: "view_count",
        header: "Views",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.view_count ?? 0}</span>
        ),
      },
      {
        accessorFn: (f) => Number(f.submit_count ?? 0),
        id: "submit_count",
        header: "Submissions",
        cell: ({ row }) => (
          <span className="font-mono font-semibold">
            {row.original.submit_count ?? 0}
          </span>
        ),
      },
      {
        id: "conversion",
        header: "Conversion",
        accessorFn: (f) => {
          const views = Number(f.view_count ?? 0)
          const submits = Number(f.submit_count ?? 0)
          return views > 0 ? Math.round((submits / views) * 100) : 0
        },
        cell: ({ row }) => {
          const views = Number(row.original.view_count ?? 0)
          const submits = Number(row.original.submit_count ?? 0)
          const pct = views > 0 ? Math.round((submits / views) * 100) : 0
          return (
            <Badge className="border-0 bg-emerald-100 font-mono text-[11px] text-emerald-700 hover:bg-emerald-200">
              {pct}%
            </Badge>
          )
        },
      },
      {
        id: "create_lead",
        header: "Create Lead",
        accessorFn: (f) => (f.create_lead ? "Yes" : "No"),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.create_lead ? "Yes" : "No"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const f = row.original
          return (
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => setEmbedForm(f)}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Embed Code
              </Button>
              <Button
                asChild
                size="icon-xs"
                variant="outline"
                title="View Public WebForm"
              >
                <Link href={`/webform/${f.form_id}`} target="_blank">
                  <i className="ri-eye-fill text-muted-foreground" />
                </Link>
              </Button>
              <Button
                asChild
                size="icon-xs"
                variant="outline"
                title="Edit WebForm"
              >
                <Link href={`/webforms/${f.id}/edit`}>
                  <i className="ri-pencil-ruler-2-line text-[#405189]" />
                </Link>
              </Button>
              <Button
                size="icon-xs"
                variant="destructive"
                title="Delete WebForm"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Web Form?",
                    description: `Are you sure you want to delete "${f.title}" (${f.form_id})? Embedded forms using this code will stop working.`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "web_forms",
                          action: "delete",
                          id: f.id,
                        }),
                      })
                      toast.success("WebForm deleted")
                      load()
                    },
                  })
                }
              >
                <i className="ri-delete-bin-2-fill" />
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allChecked, selectedIds, load, confirmDelete]
  )

  const publicUrl = embedForm
    ? `${origin || "https://crm.domain.com"}/webform/${embedForm.form_id}`
    : ""
  const iframeSnippet = embedForm
    ? `<iframe src="${publicUrl}" width="100%" height="620" style="border:0;border-radius:8px;" loading="lazy"></iframe>`
    : ""

  return (
    <div>
      <BreadcrumbBar parent="CRM" title="Web Forms" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Web Forms"
          columns={columns}
          data={forms}
          loading={loading}
          searchPlaceholder="Search for..."
          toolbarRight={
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    confirmDelete({
                      title: `Delete ${selectedIds.length} Web Form(s)?`,
                      description: `Are you sure you want to permanently delete ${selectedIds.length} selected web form(s)?`,
                      onConfirm: async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "web_forms",
                            action: "bulk_delete",
                            ids: selectedIds,
                          }),
                        })
                        toast.success(
                          `Deleted ${selectedIds.length} web form(s)`
                        )
                        setSelectedIds([])
                        load()
                      },
                    })
                  }
                  className="h-8 text-xs"
                >
                  <i className="ri-delete-bin-2-line mr-1" /> Delete (
                  {selectedIds.length})
                </Button>
              )}
              <Button
                asChild
                size="sm"
                className="h-8 bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
              >
                <Link href="/webforms/create">+ Add Web Form</Link>
              </Button>
            </div>
          }
        />
      </Card>

      <Dialog
        open={Boolean(embedForm)}
        onOpenChange={(o) => !o && setEmbedForm(null)}
      >
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Embed Code — {embedForm?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Copy and paste this code in any website:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="mb-1 font-semibold">Public Form URL</div>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded border border-border bg-muted/60 p-2 font-mono text-[11px]">
                  {publicUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(publicUrl)
                    toast.success("Public URL copied!")
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-1 font-semibold">HTML Iframe Embed Code</div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-border bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                {iframeSnippet}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard?.writeText(iframeSnippet)
                toast.success("Embed code copied to clipboard!")
              }}
            >
              Copy Code
            </Button>
            <Button
              onClick={() => setEmbedForm(null)}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {DeleteDialog}
    </div>
  )
}
