import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = String(body.action || "request")
  const now = new Date()

  if (action === "request") {
    const email = String(body.email || "")
      .trim()
      .toLowerCase()
    const user = await prisma.users.findFirst({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: "No CRM user found with that email address." },
        { status: 404 }
      )
    }
    const token = `RST-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${Date.now().toString(36)}`
    await prisma.password_reset_tokens.upsert({
      where: { email },
      update: { token, created_at: now },
      create: { email, token, created_at: now },
    })
    return NextResponse.json({
      ok: true,
      resetUrl: `/password/reset/${token}`,
      token,
    })
  }

  if (action === "reset") {
    const token = String(body.code || body.token || "").trim()
    const password = String(body.password || "")
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      )
    }
    const rec = await prisma.password_reset_tokens.findFirst({
      where: { token },
    })
    if (!rec) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      )
    }
    const hashed = await bcrypt.hash(password, 10)
    await prisma.users.updateMany({
      where: { email: rec.email },
      data: { password: hashed, updated_at: now },
    })
    await prisma.password_reset_tokens.delete({ where: { email: rec.email } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
