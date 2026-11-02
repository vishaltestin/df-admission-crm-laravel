import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ unreadCount: 0, items: [] })
  }

  const filterType = req.nextUrl.searchParams.get("type") || "all"

  const baseWhere: Record<string, unknown> = {
    organization_id: BigInt(ctx.orgId),
  }

  const [unreadCount, totalCount, items] = await Promise.all([
    prisma.notifications.count({
      where: { ...baseWhere, is_read: 0 },
    }),
    prisma.notifications.count({
      where: baseWhere,
    }),
    prisma.notifications.findMany({
      where:
        filterType === "message" || filterType === "alert"
          ? { ...baseWhere, type: filterType }
          : baseWhere,
      orderBy: { id: "desc" },
      take: 25,
    }),
  ])

  return NextResponse.json(
    serializeData({
      unreadCount,
      totalCount,
      items,
    })
  )
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const action = String(body.action || "")
  const now = new Date()

  if (action === "read" && body.id) {
    await prisma.notifications.update({
      where: { id: BigInt(body.id) },
      data: { is_read: 1, read_at: now, updated_at: now },
    })
  } else if (action === "read_bulk" && Array.isArray(body.ids)) {
    const ids = body.ids.map((n: number | string) => BigInt(n))
    if (ids.length > 0) {
      await prisma.notifications.updateMany({
        where: { id: { in: ids } },
        data: { is_read: 1, read_at: now, updated_at: now },
      })
    }
  } else if (action === "read_all") {
    await prisma.notifications.updateMany({
      where: { organization_id: BigInt(ctx.orgId), is_read: 0 },
      data: { is_read: 1, read_at: now, updated_at: now },
    })
  } else if (action === "delete" && body.id) {
    await prisma.notifications.delete({
      where: { id: BigInt(body.id) },
    })
  }

  return NextResponse.json({ ok: true })
}
