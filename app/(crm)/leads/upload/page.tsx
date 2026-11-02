"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

function LeadUploadInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [primaryKey, setPrimaryKey] = React.useState(
    searchParams.get("primary_key") || "mobile"
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [master, setMaster] = React.useState<any>(null)
  const [fileName, setFileName] = React.useState("batch_upload.csv")
  const [csvText, setCsvText] = React.useState(
    "name,mobile,email,description\nNikhil Tandon,9818001122,nikhil.tandon@gmail.com,B.Tech CSE 2026 inquiry\nMeera Krishnan,9818003344,meera.k@gmail.com,MBA Analytics inquiry"
  )
  const [instituteId, setInstituteId] = React.useState("")
  const [sourceId, setSourceId] = React.useState("")
  const [assignTo, setAssignTo] = React.useState("")
  const [uploading, setUploading] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/master-data")
      .then((r) => r.json())
      .then(setMaster)
  }, [])

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCsvText(reader.result)
      }
    }
    reader.readAsText(file)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    const res = await fetch("/api/leads/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_name: fileName,
        csv_text: csvText,
        primary_key: primaryKey,
        institute_id: instituteId,
        lead_source_id: sourceId,
        lead_assign_to: assignTo,
      }),
    })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      toast.success(
        `Processed ${data.total} rows: ${data.success} imported, ${data.duplicate} duplicates, ${data.failed} failed`
      )
      router.push("/leads/upload/logs")
    } else {
      toast.error(data.error || "Upload failed")
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Leads" title="Upload Leads (CSV)" />

      <Card className="gap-5 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h4 className="text-sm font-semibold">Bulk CSV Lead Import</h4>
            <p className="text-xs text-muted-foreground">
              Upload a `.csv` file or paste CSV rows below. Primary deduplication key:{" "}
              <strong className="uppercase text-[#405189]">{primaryKey}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="bg-[#299cdb] text-xs font-semibold text-white hover:bg-[#2389c2]"
            >
              <a
                href="/api/leads/upload?sample=1"
                download="leads_upload_sample.csv"
              >
                <i className="ri-download-2-line mr-1" /> Download Sample CSV
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/leads/upload/logs">
                <i className="ri-file-list-3-line mr-1" /> Upload Logs
              </Link>
            </Button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label className="mb-1 block text-xs">Deduplicate By</Label>
              <select
                value={primaryKey}
                onChange={(e) => setPrimaryKey(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="mobile">Mobile (Unique)</option>
                <option value="email">Email (Unique)</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Default Institute</Label>
              <select
                value={instituteId}
                onChange={(e) => setInstituteId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Institute</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.institutes?.map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Default Source</Label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Source</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.sources?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Assign Owner</Label>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Current User</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {master?.users?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1 block text-xs">Select CSV File</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFilePick}
              className="text-xs"
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs">
              CSV Content Preview / Editable Rows (`name,mobile,email,description`)
            </Label>
            <Textarea
              rows={7}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link href="/leads">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
            >
              {uploading ? "Importing..." : "Start CSV Import"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function LeadUploadPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-xs">Loading...</div>}>
      <LeadUploadInner />
    </React.Suspense>
  )
}
