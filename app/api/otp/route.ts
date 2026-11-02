import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = String(body.action || "send")
  const recipient = String(body.recipient || "").trim()
  const type = body.type === "email" ? ("email" as const) : ("mobile" as const)
  const orgId = BigInt(body.organization_id || 1)
  const now = new Date()

  if (!recipient) {
    return NextResponse.json({ error: "Recipient required" }, { status: 400 })
  }

  if (action === "send") {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(now.getTime() + 10 * 60 * 1000)
    await prisma.otp_verifications.create({
      data: {
        organization_id: orgId,
        type,
        recipient,
        otp_code: code,
        expires_at: expires,
        is_verified: false,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({
      ok: true,
      demo_otp: code,
      message: `OTP sent to ${recipient} (Demo OTP: ${code})`,
    })
  }

  if (action === "verify") {
    const otpCode = String(body.otp_code || "").trim()
    const row = await prisma.otp_verifications.findFirst({
      where: {
        recipient,
        otp_code: otpCode,
        is_verified: false,
      },
      orderBy: { id: "desc" },
    })

    if (!row || new Date(row.expires_at) < now) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      )
    }

    await prisma.otp_verifications.update({
      where: { id: row.id },
      data: { is_verified: true, updated_at: now },
    })
    return NextResponse.json({ ok: true, verified: true })
  }

  return NextResponse.json({ error: "Invalid OTP action" }, { status: 400 })
}
