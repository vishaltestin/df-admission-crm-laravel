"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const MODULES: Record<string, string[]> = {
  Leads: [
    "Leads.ListView",
    "Leads.AddLead",
    "Leads.LeadShow",
    "leads.upload",
    "leads.bulk.reassign",
    "leads.bulk.delete",
  ],
  Users: ["User.ListView", "User.AddUser", "User.EditUser", "User.Permissions"],
  Roles: ["Role.ListView", "Role.AddRole", "Role.EditRole", "Role.Permission"],
  Academic: ["institutes.manage", "programs.manage", "products.index"],
  FormDesk: ["webforms.index", "landing-pages.index", "application_forms.index"],
  Settings: [
    "GeneralSetting.ListView",
    "EmailSetting.ListView",
    "SmsSetting.ListView",
    "WhatsappSetting.ListView",
    "IvrSetting.ListView",
    "automation.index",
  ],
}

export default function RolePermissionMatrixPage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [role, setRole] = React.useState<any>(null)
  const [perms, setPerms] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    fetch(`/api/uac?entity=role_permissions&id=${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role)
        try {
          setPerms(JSON.parse(d.role?.permissions || "{}"))
        } catch {
          setPerms({})
        }
      })
  }, [params.id])

  return (
    <div>
      <BreadcrumbBar parent="Roles" title="Role Permissions" />
      <Card className="gap-4 p-5 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-sm font-bold">
            Role Permissions —{" "}
            <span className="text-[#405189]">
              {role?.name || `#${params.id}`}
            </span>
          </h4>
          <Button asChild size="xs" variant="outline">
            <Link href="/role">← Back to Roles</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(MODULES).map(([group, keys]) => (
            <div
              key={group}
              className="rounded-md border border-border p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between border-b border-border pb-1.5 font-bold text-[#405189]">
                <span>{group}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...perms }
                    for (const k of keys) next[k] = true
                    setPerms(next)
                  }}
                  className="text-[10px] font-medium underline"
                >
                  Select All
                </button>
              </div>
              {keys.map((k) => (
                <label
                  key={k}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    checked={Boolean(perms[k])}
                    onCheckedChange={(checked) =>
                      setPerms({ ...perms, [k]: Boolean(checked) })
                    }
                  />
                  <span className="font-mono text-[11px]">{k}</span>
                </label>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={async () => {
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  entity: "role_permissions",
                  id: params.id,
                  permissions: perms,
                }),
              })
              if (res.ok) toast.success("Role permissions saved!")
            }}
            className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            Save Role Permissions
          </Button>
        </div>
      </Card>
    </div>
  )
}
