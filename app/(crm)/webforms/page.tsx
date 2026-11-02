"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forms, setForms] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [embedForm, setEmbedForm] = React.useState<any>(null)
  const [origin, setOrigin] = React.useState("")

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=formdesk&sub=web_forms")
      .then((r) => r.json())
      .then((d) => setForms(d.webforms || d.items || []))
  }, [])

  React.useEffect(() => {
    setOrigin(window.location.origin)
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold">{row.original.title}</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {row.original.form_id} •{" "}
              {(row.original.attributes || []).length} fields
            </div>
          </div>
        ),
      },
      {
        accessorFn: (f) => Number(f.view_count ?? 0),
        id: "view_count",
        header: "Views",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[11px]">
            {row.original.view_count ?? 0}
          </Badge>
        ),
      },
      {
        accessorFn: (f) => Number(f.submit_count ?? 0),
        id: "submit_count",
        header: "Submits",
        cell: ({ row }) => (
          <Badge className="bg-emerald-100 font-mono text-[11px] text-emerald-700 hover:bg-emerald-200">
            {row.original.submit_count ?? 0}
          </Badge>
        ),
      },
      {
        accessorFn: (f) => f.created_at || "",
        id: "created_at",
        header: "Created At",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-IN")
              : "-"}
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
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => setEmbedForm(f)}
                className="bg-[#299cdb] text-[11px] text-white hover:bg-[#2389c2]"
              >
                Embed Code
              </Button>
              <Button
                asChild
                size="xs"
                variant="outline"
                title="View Public WebForm"
                className="text-[11px]"
              >
                <Link href={`/webform/${f.form_id}`} target="_blank">
                  <i className="ri-eye-fill mr-1" /> View
                </Link>
              </Button>
              <Button
                asChild
                size="xs"
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                <Link href={`/webforms/${f.id}/edit`}>
                  <i className="ri-pencil-ruler-2-line mr-1" /> Edit
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
                      resource: "web_forms",
                      action: "delete",
                      id: f.id,
                    }),
                  })
                  toast.success("WebForm deleted")
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

  const publicUrl = embedForm
    ? `${origin || "https://crm.domain.com"}/webform/${embedForm.form_id}`
    : ""
  const iframeSnippet = embedForm
    ? `<iframe src="${publicUrl}" width="100%" height="620" style="border:0;border-radius:8px;" loading="lazy"></iframe>`
    : ""

  return (
    <div>
      <BreadcrumbBar parent="FormDesk" title="Web Forms" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title="Web Forms"
          columns={columns}
          data={forms}
          searchPlaceholder="Search webforms..."
          toolbarRight={
            <Button
              asChild
              size="sm"
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              <Link href="/webforms/create">+ Create Web Form</Link>
            </Button>
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
              Copy and paste this snippet into any external university or partner website.
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
                toast.success("Embed iframe copied!")
              }}
            >
              Copy Embed Code
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
    </div>
  )
}
