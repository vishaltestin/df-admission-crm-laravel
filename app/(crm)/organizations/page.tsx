"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

export default function OrganizationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orgs, setOrgs] = React.useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countries, setCountries] = React.useState<any[]>([])
  const [showModal, setShowModal] = React.useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    logo: "",
    gst: "",
    address: "",
    country: "India",
    state: "",
    city: "",
    zipcode: "",
    status: "1",
  })

  const load = React.useCallback(() => {
    fetch("/api/uac?resource=organizations")
      .then((r) => r.json())
      .then((d) => {
        setOrgs(d.organizations || [])
        setCountries(d.countries || [])
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, logo: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

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
        id: "logo",
        header: "Logo",
        enableSorting: false,
        cell: ({ row }) => {
          const logo = row.original.logo
          const isImg =
            typeof logo === "string" &&
            (logo.startsWith("data:image") || logo.startsWith("http"))
          return isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={row.original.name}
              className="h-8 w-8 rounded border border-border object-contain bg-white"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#405189]/10 font-bold text-[#405189]">
              {(row.original.name || "O").slice(0, 2).toUpperCase()}
            </div>
          )
        },
      },
      {
        accessorKey: "name",
        header: "Organization Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-[#405189]">
              {row.original.name}
            </div>
            {row.original.address && (
              <div className="max-w-xs truncate text-[10px] text-muted-foreground">
                {row.original.address}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorFn: (o) => o.gst || "-",
        id: "gst",
        header: "GST Number",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.gst || "-"}</span>
        ),
      },
      {
        accessorFn: (o) =>
          [o.city, o.state, o.country].filter(Boolean).join(", ") || "-",
        id: "location",
        header: "City / State / Country",
        cell: ({ row }) => {
          const o = row.original
          const loc = [o.city, o.state, o.country].filter(Boolean).join(", ")
          return (
            <span>
              {loc || "-"} {o.zipcode ? `(${o.zipcode})` : ""}
            </span>
          )
        },
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
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditing(o)
                  setForm({
                    name: o.name || "",
                    logo: o.logo || "",
                    gst: o.gst || "",
                    address: o.address || "",
                    country: o.country || "India",
                    state: o.state || "",
                    city: o.city || "",
                    zipcode: o.zipcode || "",
                    status: String(o.status ?? 1),
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
                  await fetch("/api/uac", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      resource: "organizations",
                      action: "delete",
                      id: o.id,
                    }),
                  })
                  toast.success("Organization deleted")
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
      <BreadcrumbBar parent="UAC" title="Organizations" />
      <Card className="gap-0 py-0 text-xs shadow-xs">
        <DataTable
          title={`Multi-Tenant Organizations (${orgs.length})`}
          columns={columns}
          data={orgs}
          searchPlaceholder="Search organization, GST, city..."
          toolbarRight={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null)
                setForm({
                  name: "",
                  logo: "",
                  gst: "",
                  address: "",
                  country: "India",
                  state: "",
                  city: "",
                  zipcode: "",
                  status: "1",
                })
                setShowModal(true)
              }}
              className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Add Organization
            </Button>
          }
        />
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="text-xs sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editing ? `Edit Organization — ${editing.name}` : "Add Organization"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure tenant organization branding logo, GSTIN, campus address, and status.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "organizations",
                  action: editing ? "update" : "create",
                  id: editing?.id,
                  ...form,
                }),
              })
              if (res.ok) {
                toast.success(
                  editing ? "Organization updated!" : "Organization created!"
                )
                setShowModal(false)
                load()
              }
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-xs">
                  Organization Name *
                </Label>
                <Input
                  required
                  placeholder="Assam Down Town University"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">GST Number</Label>
                <Input
                  placeholder="18AAAAA0000A1Z5"
                  value={form.gst}
                  onChange={(e) => setForm({ ...form, gst: e.target.value })}
                  className="h-9 font-mono uppercase text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Organization Logo</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="text-xs file:mr-2 file:rounded file:border-0 file:bg-[#405189] file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                {form.logo && form.logo.startsWith("data:image") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logo}
                    alt="Preview"
                    className="h-9 w-9 rounded border border-border object-contain"
                  />
                )}
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Campus / Office Address</Label>
              <Textarea
                rows={2}
                placeholder="Sankar Madhab Path, Gandhi Nagar, Panikhaiti..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label className="mb-1 block text-xs">Country</Label>
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="India">India</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block text-xs">State</Label>
                <Input
                  placeholder="Assam / Delhi"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">City</Label>
                <Input
                  placeholder="Guwahati"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Zip / PIN Code</Label>
                <Input
                  placeholder="781026"
                  value={form.zipcode}
                  onChange={(e) =>
                    setForm({ ...form, zipcode: e.target.value })
                  }
                  className="h-9 font-mono text-xs"
                />
              </div>
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
                {editing ? "Update Organization" : "Save Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
