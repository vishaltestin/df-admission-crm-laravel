"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PipelinesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = React.useState<any>({ items: [], stages: [] })
  const [pipeName, setPipeName] = React.useState("")
  const [rottenDays, setRottenDays] = React.useState("30")
  const [stageForm, setStageForm] = React.useState({
    lead_pipeline_id: "",
    name: "",
    probability: "50",
    sort_order: "5",
  })

  const load = React.useCallback(async () => {
    const res = await fetch("/api/crm-resources?resource=pipelines")
    if (res.ok) setData(await res.json())
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <BreadcrumbBar parent="Master Data" title="Pipelines & Stage Builder" />

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
        <Card className="p-4 shadow-xs">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "pipelines",
                  action: "create",
                  name: pipeName,
                  rotten_days: rottenDays,
                }),
              })
              setPipeName("")
              toast.success("Pipeline created!")
              load()
            }}
            className="space-y-2.5"
          >
            <h5 className="text-sm font-semibold">Create Pipeline</h5>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Input
                required
                placeholder="Pipeline Name *"
                value={pipeName}
                onChange={(e) => setPipeName(e.target.value)}
                className="h-9 text-xs sm:col-span-2"
              />
              <Input
                type="number"
                placeholder="Rotten Days"
                value={rottenDays}
                onChange={(e) => setRottenDays(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-[#405189] text-xs font-semibold text-white hover:bg-[#364574]"
            >
              + Add Pipeline
            </Button>
          </form>
        </Card>

        <Card className="p-4 shadow-xs">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "pipelines",
                  action: "add_stage",
                  ...stageForm,
                }),
              })
              setStageForm({ ...stageForm, name: "" })
              toast.success("Pipeline stage added!")
              load()
            }}
            className="space-y-2.5"
          >
            <h5 className="text-sm font-semibold">Add Stage to Pipeline</h5>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <select
                required
                value={stageForm.lead_pipeline_id}
                onChange={(e) =>
                  setStageForm({
                    ...stageForm,
                    lead_pipeline_id: e.target.value,
                  })
                }
                className="h-9 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">Pipeline *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {data.items.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                required
                placeholder="Stage Name *"
                value={stageForm.name}
                onChange={(e) =>
                  setStageForm({ ...stageForm, name: e.target.value })
                }
                className="h-9 text-xs"
              />
              <Input
                type="number"
                placeholder="Prob %"
                value={stageForm.probability}
                onChange={(e) =>
                  setStageForm({ ...stageForm, probability: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
            >
              + Add Stage
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {data.items.map((pipe: any) => {
          const pipeStages = data.stages.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: any) => s.lead_pipeline_id === pipe.id
          )
          return (
            <Card key={pipe.id} className="gap-3 p-4 shadow-xs text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold">{pipe.name}</h4>
                  <span className="text-muted-foreground">
                    Rotten Threshold: {pipe.rotten_days} days
                  </span>
                </div>
                {pipe.is_default === 1 && (
                  <Badge className="bg-[#0ab39c]/15 font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/25">
                    Default Pipeline
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pipeStages.map((s: any, idx: number) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                  >
                    <span className="font-bold text-[#405189]">
                      {idx + 1}. {s.name}
                    </span>
                    <Badge className="bg-[#0ab39c]/15 text-[10px] font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/25">
                      {s.probability}%
                    </Badge>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={async () => {
                        await fetch("/api/crm-resources", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            resource: "pipelines",
                            action: "delete_stage",
                            id: s.id,
                          }),
                        })
                        load()
                      }}
                      className="text-[#f06548]"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
