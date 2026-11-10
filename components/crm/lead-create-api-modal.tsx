"use client"

import * as React from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormSelect } from "@/components/ui/form-select"

const INPUT_FIELDS_DOC = [
  {
    field: "name",
    type: "string",
    required: true,
    notes: "Max 150 chars",
  },
  {
    field: "mobile",
    type: "string",
    required: true,
    notes: "Max 20 chars",
  },
  {
    field: "upload_via",
    type: "string",
    required: false,
    notes: "Values: mobile, email, whatsapp",
  },
  {
    field: "email",
    type: "string",
    required: false,
    notes: "Required only if upload_via=email",
  },
  {
    field: "state",
    type: "string",
    required: false,
    notes: "Example: Punjab",
  },
  {
    field: "city",
    type: "string",
    required: false,
    notes: "Example: Ludhiana",
  },
  {
    field: "country",
    type: "integer/string",
    required: false,
    notes: "Default: 80 (India)",
  },
  {
    field: "lead_assign_to",
    type: "integer",
    required: false,
    notes: "Default: current user id",
  },
  {
    field: "institute_id",
    type: "integer",
    required: false,
    notes: "Institute Master ID",
  },
  {
    field: "programme_id",
    type: "integer",
    required: false,
    notes: "Programme Master ID",
  },
  {
    field: "faculty_id",
    type: "integer",
    required: false,
    notes: "Faculty / Course Master ID",
  },
  {
    field: "application_form_id",
    type: "integer",
    required: false,
    notes:
      "If present, creates rows in lead_applications and application_form_responses",
  },
  {
    field: "source",
    type: "integer",
    required: false,
    notes: "Lead Source ID",
  },
  {
    field: "campaign",
    type: "integer",
    required: false,
    notes: "Lead Campaign ID",
  },
  {
    field: "medium",
    type: "integer",
    required: false,
    notes: "Maps to type_id (Lead Medium)",
  },
  {
    field: "event_id",
    type: "integer",
    required: false,
    notes: "Marketing event ID",
  },
  {
    field: "qualification",
    type: "string",
    required: false,
    notes: "Saved in extra_fields_json",
  },
]

export function LeadCreateApiModal({
  open,
  onOpenChange,
  onLeadCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated?: () => void
}) {
  const [tab, setTab] = React.useState<"docs" | "tester">("docs")
  const [sending, setSending] = React.useState(false)
  const [lastResult, setLastResult] = React.useState<{
    status: number
    body: string
  } | null>(null)

  const [payload, setPayload] = React.useState({
    name: "Karan Malhotra",
    mobile: "9811998877",
    upload_via: "mobile",
    email: "karan.m@student.in",
    state: "Punjab",
    city: "Ludhiana",
    country: "80",
    lead_assign_to: "",
    institute_id: "1",
    programme_id: "2",
    faculty_id: "2",
    application_form_id: "1",
    source: "1",
    campaign: "",
    medium: "",
    event_id: "",
    qualification: "12th Science (PCM)",
  })

  const cleanBody = React.useMemo(() => {
    const out: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(payload)) {
      if (String(v).trim() !== "") {
        out[k] = /^\d+$/.test(String(v)) && k !== "mobile" ? Number(v) : v
      }
    }
    return out
  }, [payload])

  const curlSnippet = React.useMemo(() => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://crm.example.com"
    return `curl -X POST "${origin}/api/leads/store" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(cleanBody, null, 2)}'`
  }, [cleanBody])

  async function runLiveTest() {
    setSending(true)
    try {
      const res = await fetch("/api/leads/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanBody),
      })
      const json = await res.json().catch(() => ({}))
      setLastResult({
        status: res.status,
        body: JSON.stringify(json, null, 2),
      })
      if (res.ok) {
        toast.success(`Lead created successfully! Lead ID #${json.lead_id}`)
        onLeadCreated?.()
      } else {
        toast.error(json.message || `API returned HTTP ${res.status}`)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col overflow-hidden p-0 text-xs sm:max-w-3xl">
        <DialogHeader className="border-b border-border px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-sm font-bold">
                Lead Create API (Test &amp; Documentation)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Full REST API specification, input field schema, HTTP response codes, and live API tester.
              </DialogDescription>
            </div>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "docs" | "tester")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="docs" className="text-xs">
                  <i className="ri-book-open-line mr-1" /> Documentation (17 Fields)
                </TabsTrigger>
                <TabsTrigger value="tester" className="text-xs">
                  <i className="ri-terminal-box-line mr-1" /> Live API Tester
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {tab === "docs" ? (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              {/* METHOD + ENDPOINT */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">
                    Lead Create API (Documentation)
                  </h4>
                  <div>
                    <strong>Method:</strong>{" "}
                    <Badge className="bg-slate-900 font-mono text-[10px] text-white">
                      POST
                    </Badge>
                  </div>
                  <div>
                    <strong>Primary Endpoint:</strong>{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-[#405189]">
                      /api/leads/store
                    </code>{" "}
                    <span className="text-muted-foreground">
                      (Alias: <code>/api/leads/add</code>)
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Content-Type: <code>application/json</code> • Supports authenticated CRM session or external webhook JSON POST.
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setTab("tester")}
                  className="bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
                >
                  <i className="ri-play-circle-line mr-1" /> Try Live Request
                </Button>
              </div>

              <hr className="border-border" />

              {/* 17-ROW INPUTS TABLE */}
              <div>
                <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Input Fields ({INPUT_FIELDS_DOC.length} Parameters)
                </h5>
                <div className="overflow-hidden rounded-md border border-border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        <TableHead className="text-xs font-semibold">
                          Field Name
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Type
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Required
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {INPUT_FIELDS_DOC.map((f) => (
                        <TableRow key={f.field}>
                          <TableCell className="py-1.5 font-mono font-semibold text-[#405189]">
                            {f.field}
                          </TableCell>
                          <TableCell className="py-1.5 font-mono text-muted-foreground">
                            {f.type}
                          </TableCell>
                          <TableCell className="py-1.5">
                            {f.required ? (
                              <Badge className="bg-amber-400/90 text-[10px] font-bold text-slate-950">
                                YES
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                NO
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-muted-foreground">
                            {f.notes}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <hr className="border-border" />

              {/* SAMPLE CURL */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <h5 className="text-xs font-bold">Sample cURL Request</h5>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard?.writeText(curlSnippet)
                      toast.success("cURL command copied!")
                    }}
                  >
                    <i className="ri-file-copy-line mr-1" /> Copy cURL
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                  {curlSnippet}
                </pre>
              </div>

              <hr className="border-border" />

              {/* SUCCESS & FAILURE RESPONSES */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 font-bold text-emerald-700 dark:text-emerald-400">
                    Success Response (200)
                  </div>
                  <pre className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-white">{`{
  "status": true,
  "message": "Lead created successfully",
  "lead_id": 123
}`}</pre>
                </div>

                <div>
                  <div className="mb-1 font-bold text-amber-700 dark:text-amber-400">
                    Unauthenticated (401)
                  </div>
                  <pre className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-white">{`{
  "status": false,
  "message": "Unauthenticated"
}`}</pre>
                </div>

                <div>
                  <div className="mb-1 font-bold text-rose-600">
                    Validation Error (422)
                  </div>
                  <pre className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-white">{`{
  "message": "The mobile field is required.",
  "errors": {
    "mobile": [
      "The mobile field is required."
    ]
  }
}`}</pre>
                </div>

                <div>
                  <div className="mb-1 font-bold text-rose-700">
                    Server Error (500)
                  </div>
                  <pre className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-white">{`{
  "status": false,
  "message": "Something went wrong"
}`}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs">name *</Label>
                  <Input
                    value={payload.name}
                    onChange={(e) =>
                      setPayload({ ...payload, name: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">mobile *</Label>
                  <Input
                    value={payload.mobile}
                    onChange={(e) =>
                      setPayload({ ...payload, mobile: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">upload_via</Label>
                  <FormSelect
                    value={payload.upload_via}
                    onChange={(e) =>
                      setPayload({ ...payload, upload_via: e.target.value })
                    }
                    className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="mobile">mobile</option>
                    <option value="email">email</option>
                    <option value="whatsapp">whatsapp</option>
                  </FormSelect>
                </div>
                <div>
                  <Label className="mb-1 block text-xs">email</Label>
                  <Input
                    value={payload.email}
                    onChange={(e) =>
                      setPayload({ ...payload, email: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">state</Label>
                  <Input
                    value={payload.state}
                    onChange={(e) =>
                      setPayload({ ...payload, state: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">city</Label>
                  <Input
                    value={payload.city}
                    onChange={(e) =>
                      setPayload({ ...payload, city: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">country</Label>
                  <Input
                    value={payload.country}
                    onChange={(e) =>
                      setPayload({ ...payload, country: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">institute_id</Label>
                  <Input
                    value={payload.institute_id}
                    onChange={(e) =>
                      setPayload({ ...payload, institute_id: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">programme_id</Label>
                  <Input
                    value={payload.programme_id}
                    onChange={(e) =>
                      setPayload({ ...payload, programme_id: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">faculty_id</Label>
                  <Input
                    value={payload.faculty_id}
                    onChange={(e) =>
                      setPayload({ ...payload, faculty_id: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">
                    application_form_id
                  </Label>
                  <Input
                    value={payload.application_form_id}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        application_form_id: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">source (ID)</Label>
                  <Input
                    value={payload.source}
                    onChange={(e) =>
                      setPayload({ ...payload, source: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">campaign (ID)</Label>
                  <Input
                    value={payload.campaign}
                    onChange={(e) =>
                      setPayload({ ...payload, campaign: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">medium (type_id)</Label>
                  <Input
                    value={payload.medium}
                    onChange={(e) =>
                      setPayload({ ...payload, medium: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">qualification</Label>
                  <Input
                    value={payload.qualification}
                    onChange={(e) =>
                      setPayload({
                        ...payload,
                        qualification: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 font-semibold">
                    JSON Request Body → <code>POST /api/leads/store</code>
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-md bg-slate-900 p-3 font-mono text-[11px] text-sky-300">
                    {JSON.stringify(cleanBody, null, 2)}
                  </pre>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between font-semibold">
                    <span>API Response</span>
                    {lastResult && (
                      <Badge
                        className={
                          lastResult.status === 200
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }
                      >
                        HTTP {lastResult.status}
                      </Badge>
                    )}
                  </div>
                  <pre className="max-h-48 min-h-28 overflow-auto rounded-md bg-slate-900 p-3 font-mono text-[11px] text-emerald-300">
                    {lastResult
                      ? lastResult.body
                      : '// Click "Send Test Lead" below to execute a live POST request'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {tab === "docs" ? (
            <Button
              type="button"
              onClick={() => setTab("tester")}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Open Live API Tester →
            </Button>
          ) : (
            <Button
              type="button"
              disabled={sending}
              onClick={runLiveTest}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              {sending ? "Sending..." : "Send Test Lead"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
