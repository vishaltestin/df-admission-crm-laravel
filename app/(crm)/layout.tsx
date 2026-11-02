import { requireSessionContext } from "@/lib/session"
import { AdminShell } from "@/components/crm/admin-shell"

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await requireSessionContext()
  return <AdminShell ctx={ctx}>{children}</AdminShell>
}
