import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export interface SessionContext {
  userId: number
  email: string
  firstName: string
  lastName: string
  fullName: string
  roleSlug: string
  roleName: string
  orgId: number
  currentOrgName: string
  currentInstituteId: number | null
  currentInstituteName: string
  avatar: string
  memberSince: string
  institutes: Array<{ id: number; name: string }>
  organizations: Array<{ id: number; name: string }>
}

export async function getOptionalSessionContext(): Promise<SessionContext | null> {
  const session = await auth()
  if (!session?.user) return null

  const u = session.user as unknown as Record<string, unknown>
  const userId = Number(u.id || 1)
  const baseOrgId = Number(u.organizationId || 1)
  const roleSlug = String(u.roleSlug || "operater")

  const cookieStore = await cookies()
  const cookieOrg = cookieStore.get("df_current_org")?.value
  const cookieInst = cookieStore.get("df_current_institute")?.value

  const orgId = cookieOrg ? Number(cookieOrg) : baseOrgId
  const currentInstituteId = cookieInst ? Number(cookieInst) : null

  const otherOrgIds = String(u.otherOrgs || "")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0)

  const allowedOrgIds =
    roleSlug === "root" || roleSlug === "sadmin"
      ? undefined
      : Array.from(new Set([baseOrgId, ...otherOrgIds]))

  const orgRows = await prisma.organizations.findMany({
    where: allowedOrgIds ? { id: { in: allowedOrgIds } } : undefined,
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  })

  const instRows = await prisma.institutes.findMany({
    where: { organization_id: BigInt(orgId), status: 1 },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  })

  const institutes = instRows.map((i) => ({ id: Number(i.id), name: i.name }))
  const organizations = orgRows.map((o) => ({
    id: o.id,
    name: o.name || `Organization #${o.id}`,
  }))

  const activeInst = institutes.find((i) => i.id === currentInstituteId)
  const activeOrg = organizations.find((o) => o.id === orgId)

  return {
    userId,
    email: String(u.email || ""),
    firstName: String(u.firstName || "Admin"),
    lastName: String(u.lastName || ""),
    fullName:
      `${String(u.firstName || "")} ${String(u.lastName || "")}`.trim() ||
      String(u.email || "User"),
    roleSlug,
    roleName: String(u.roleName || "User"),
    orgId,
    currentOrgName: activeOrg ? activeOrg.name : `Organization #${orgId}`,
    currentInstituteId: activeInst ? activeInst.id : null,
    currentInstituteName: activeInst ? activeInst.name : "",
    avatar: String(u.avatar || ""),
    memberSince: String(u.memberSince || new Date().toISOString()),
    institutes,
    organizations,
  }
}

export const getSessionContext = getOptionalSessionContext

export async function requireSessionContext(): Promise<SessionContext> {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    redirect("/login")
  }
  return ctx
}
