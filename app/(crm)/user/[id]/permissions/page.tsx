"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const USER_PERMS = [
  "Leads.ListView",
  "Leads.AddLead",
  "Leads.LeadShow",
  "leads.upload",
  "leads.bulk.reassign",
  "leads.bulk.delete",
  "coupons.index",
  "webforms.index",
  "reports.view",
]

export default function UserPermissionsOverridePage() {
  const params = useParams<{ id: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = React.useState<any>(null)
  const [perms, setPerms] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    fetch(`/api/uac?entity=user_permissions&id=${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user)
        try {
          setPerms(JSON.parse(d.user?.permissions || "{}"))
        } catch {
          setPerms({})
        }
      })
  }, [params.id])

  return (
    <div>
      <BreadcrumbBar parent="Users" title="User Role Permissions" />
      <Card className="gap-4 p-5 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-sm font-bold">
            User{" "}
            <span className="text-[#405189]">
              {user ? `${user.first_name || ""} ${user.last_name || ""}` : ""}
            </span>{" "}
            Permission Overrides
          </h4>
          <Button asChild size="xs" variant="outline">
            <Link href="/user">← Back to Users</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {USER_PERMS.map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2.5"
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

        <div className="flex justify-end">
          <Button
            onClick={async () => {
              const res = await fetch("/api/uac", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  entity: "user_permissions",
                  id: params.id,
                  permissions: perms,
                }),
              })
              if (res.ok) toast.success("User permissions saved!")
            }}
            className="bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            Save User Permissions
          </Button>
        </div>
      </Card>
    </div>
  )
}
