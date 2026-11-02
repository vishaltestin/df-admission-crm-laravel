"use client"

import * as React from "react"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const DEFAULT_ROLES = [
  { slug: "root", name: "Super Root", desc: "Platform Super Administrator" },
  { slug: "sadmin", name: "Super Admin", desc: "University System Administrator" },
  { slug: "admin", name: "Organization Admin", desc: "Campus / Tenant Administrator" },
  { slug: "manager", name: "Team Manager", desc: "Admissions Team Lead" },
  { slug: "counselor", name: "Counselor", desc: "Academic Admission Counselor" },
  { slug: "operater", name: "Tele-Caller / Operator", desc: "Frontline Lead Calling Executive" },
]

const FIELDS = [
  {
    key: "view_mobile",
    label: "View Mobile Number",
    sub: "Unmask 10-digit student mobile",
  },
  {
    key: "view_email",
    label: "View Email Address",
    sub: "Unmask student email address",
  },
  {
    key: "can_download",
    label: "Export / Download CSV",
    sub: "Allow bulk lead sheet export",
  },
] as const

export default function LeadFieldVisibilitySettingsPage() {
  const [matrix, setMatrix] = React.useState<Record<string, boolean>>({})
  const [saving, setSaving] = React.useState(false)

  const load = React.useCallback(() => {
    fetch("/api/crm-resources?resource=lead_settings")
      .then((r) => r.json())
      .then((d) => {
        const next: Record<string, boolean> = {}
        for (const r of DEFAULT_ROLES) {
          for (const f of FIELDS) {
            next[`${r.slug}:${f.key}`] =
              r.slug === "root" || r.slug === "sadmin" || r.slug === "admin"
          }
        }
        for (const item of d.items || []) {
          next[`${item.role_slug}:${item.field}`] = Boolean(item.enabled)
        }
        setMatrix(next)
      })
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  function toggleCell(roleSlug: string, fieldKey: string, val: boolean) {
    setMatrix((prev) => ({
      ...prev,
      [`${roleSlug}:${fieldKey}`]: val,
    }))
  }

  function toggleRow(roleSlug: string, val: boolean) {
    setMatrix((prev) => {
      const copy = { ...prev }
      for (const f of FIELDS) copy[`${roleSlug}:${f.key}`] = val
      return copy
    })
  }

  async function saveAll() {
    setSaving(true)
    const entries = DEFAULT_ROLES.flatMap((r) =>
      FIELDS.map((f) => ({
        role_slug: r.slug,
        field: f.key,
        enabled: Boolean(matrix[`${r.slug}:${f.key}`]),
      }))
    )
    const res = await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "lead_settings",
        action: "save_matrix",
        entries,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Lead privacy & export matrix saved!")
      load()
    }
  }

  return (
    <div>
      <BreadcrumbBar parent="Lead Settings" title="Lead Privacy & Export Settings" />

      <Card className="overflow-hidden p-0 text-xs shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h4 className="text-sm font-bold">
              Role-Based PII Masking & Export Permissions
            </h4>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Control which roles can view unmasked student mobile numbers, emails, or export CSV sheets.
            </p>
          </div>
          <Button
            onClick={saveAll}
            disabled={saving}
            className="h-8 bg-[#0ab39c] text-xs font-semibold text-white hover:bg-[#099885]"
          >
            {saving ? "Saving..." : "Save Permission Matrix"}
          </Button>
        </div>

        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[32%] pl-5 text-left font-bold">
                User Role
              </TableHead>
              {FIELDS.map((f) => (
                <TableHead
                  key={f.key}
                  className="w-[18%] text-center align-middle"
                >
                  <div className="font-bold text-foreground">{f.label}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    {f.sub}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[14%] pr-5 text-center font-bold">
                Quick Toggle
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DEFAULT_ROLES.map((role) => {
              const allOn = FIELDS.every((f) =>
                Boolean(matrix[`${role.slug}:${f.key}`])
              )
              return (
                <TableRow key={role.slug} className="hover:bg-muted/20">
                  <TableCell className="pl-5 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {role.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] uppercase"
                      >
                        {role.slug}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {role.desc}
                    </div>
                  </TableCell>

                  {FIELDS.map((f) => {
                    const checked = Boolean(matrix[`${role.slug}:${f.key}`])
                    return (
                      <TableCell
                        key={f.key}
                        className="py-3 text-center align-middle"
                      >
                        <div className="inline-flex items-center justify-center">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              toggleCell(role.slug, f.key, Boolean(v))
                            }
                            aria-label={`${role.name} - ${f.label}`}
                          />
                        </div>
                      </TableCell>
                    )
                  })}

                  <TableCell className="pr-5 py-3 text-center align-middle">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => toggleRow(role.slug, !allOn)}
                      className="text-[11px]"
                    >
                      {allOn ? "Revoke All" : "Grant All"}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
