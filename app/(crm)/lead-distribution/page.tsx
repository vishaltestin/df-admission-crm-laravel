"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export default function LeadDistributionPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>({
    items: [],
    users: [],
    sources: [],
    institutes: [],
  })
  const [form, setForm] = React.useState({
    name: "",
    source_id: "",
    institute_id: "",
    priority: "1",
    assign_user_ids: [] as number[],
  })
  const [simSourceId, setSimSourceId] = React.useState("")
  const [simResult, setSimResult] = React.useState<string>("")

  const load = React.useCallback(async () => {
    const res = await fetch("/api/crm-resources?resource=lead_distribution")
    if (res.ok) setData(await res.json())
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (r) => Number(r.priority ?? 0),
        id: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <span className="font-bold">#{row.original.priority}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Rule Name",
        cell: ({ row }) => (
          <span className="font-semibold">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "assign_to",
        header: "Pool User IDs",
        cell: ({ row }) => (
          <span className="font-mono text-muted-foreground">
            {row.original.assign_to}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: () => (
          <Badge className="bg-[#0ab39c]/15 text-[11px] font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/25">
            Active
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={async () => {
                await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "lead_distribution",
                    action: "delete",
                    id: row.original.id,
                  }),
                })
                toast.success("Rule deleted")
                load()
              }}
              className="text-[#f06548]"
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [load]
  )

  return (
    <div>
      <BreadcrumbBar
        parent="Lead Settings"
        title="Lead Distribution & Simulator"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 text-xs">
        <div className="min-w-0 space-y-4 lg:col-span-4">
          <Card className="p-4 shadow-xs">
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "lead_distribution",
                    action: "create",
                    ...form,
                  }),
                })
                setForm({
                  name: "",
                  source_id: "",
                  institute_id: "",
                  priority: "1",
                  assign_user_ids: [],
                })
                toast.success("Distribution rule created!")
                load()
              }}
              className="space-y-3"
            >
              <h5 className="text-sm font-semibold">Create Round-Robin Rule</h5>
              <Input
                required
                placeholder="Rule Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-9 text-xs"
              />
              <select
                value={form.source_id}
                onChange={(e) =>
                  setForm({ ...form, source_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Any Lead Source</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.sources.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="space-y-1.5 rounded-md border border-border p-2.5">
                <div className="font-medium">Assign Pool (Round-Robin)</div>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.users.map((u: any) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <Checkbox
                      checked={form.assign_user_ids.includes(u.id)}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          assign_user_ids: checked
                            ? [...form.assign_user_ids, u.id]
                            : form.assign_user_ids.filter((x) => x !== u.id),
                        })
                      }
                    />
                    <span>
                      {u.first_name} {u.last_name}
                    </span>
                  </label>
                ))}
              </div>
              <Button
                type="submit"
                className="w-full bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
              >
                Save Distribution Rule
              </Button>
            </form>
          </Card>

          <Card className="gap-3 p-4 shadow-xs">
            <h5 className="text-sm font-semibold text-[#299cdb]">
              Simulate Lead Routing
            </h5>
            <select
              value={simSourceId}
              onChange={(e) => setSimSourceId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Incoming Source</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {data.sources.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "lead_distribution",
                    action: "simulate",
                    source_id: simSourceId,
                  }),
                })
                const out = await res.json()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const u = data.users.find((x: any) => x.id === out.assignedUserId)
                setSimResult(
                  `Matched "${out.matchedRule}" → Assigned to ${
                    u
                      ? `${u.first_name} ${u.last_name}`
                      : `User #${out.assignedUserId}`
                  }`
                )
              }}
              className="w-full bg-[#299cdb] font-semibold text-white hover:bg-[#2389c2]"
            >
              Run Simulation
            </Button>
            {simResult && (
              <div className="rounded-md bg-[#0ab39c]/15 p-2.5 font-semibold text-[#0ab39c]">
                {simResult}
              </div>
            )}
          </Card>
        </div>

        <Card className="gap-0 py-0 shadow-xs lg:col-span-8">
          <DataTable
            title="Active Distribution Rules"
            columns={columns}
            data={data.items}
            searchPlaceholder="Search rules..."
          />
        </Card>
      </div>
    </div>
  )
}
