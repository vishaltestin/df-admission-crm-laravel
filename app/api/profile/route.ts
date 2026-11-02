import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { serializeData } from "@/lib/serialize"
import { getSessionContext } from "@/lib/session"

export async function GET() {
  const ctx = await getSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [user, register] = await Promise.all([
    prisma.users.findUnique({ where: { id: ctx.userId } }),
    prisma.registers.findFirst({ where: { user_id: ctx.userId } }),
  ])

  return NextResponse.json(
    serializeData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      mobile: register?.mobile || "",
      role: ctx.roleName,
      organization: ctx.currentOrgName,
    })
  )
}

export async function POST(req: Request) {
  const ctx = await getSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const now = new Date()

  await prisma.users.update({
    where: { id: ctx.userId },
    data: {
      first_name: body.first_name,
      last_name: body.last_name,
      ...(body.new_password
        ? { password: await bcrypt.hash(String(body.new_password), 10) }
        : {}),
      updated_at: now,
    },
  })

  if (body.mobile !== undefined) {
    const reg = await prisma.registers.findFirst({ where: { user_id: ctx.userId } })
    if (reg) {
      await prisma.registers.update({
        where: { id: reg.id },
        data: { mobile: String(body.mobile).slice(0, 12), updated_at: now },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
