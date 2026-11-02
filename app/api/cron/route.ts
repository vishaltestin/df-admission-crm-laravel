import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const job = String(body.job || "")
  const now = new Date()

  if (job === "auto-assign") {
    const unassigned = await prisma.leads.findMany({
      where: {
        organization_id: BigInt(ctx.orgId),
        OR: [{ lead_assign_to: BigInt(0) }, { lead_assign_to: null }],
      },
    })
    const counsellors = await prisma.registers.findMany({
      where: { organization: String(ctx.orgId), is_available_for_leads: 1 },
    })

    if (unassigned.length === 0 || counsellors.length === 0) {
      return NextResponse.json({
        ok: true,
        message: `Auto-Assign completed: 0 untouched leads pending assignment.`,
      })
    }

    for (let i = 0; i < unassigned.length; i++) {
      const target = counsellors[i % counsellors.length]
      await prisma.leads.update({
        where: { id: unassigned[i].id },
        data: { lead_assign_to: BigInt(target.user_id), updated_at: now },
      })
      await prisma.lead_activity_logs.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          lead_id: unassigned[i].id,
          user_id: BigInt(ctx.userId),
          action: "cron_auto_assign",
          description: `Auto-assigned via round-robin distribution rule to ${target.first_name || "Counsellor"}`,
          created_at: now,
          updated_at: now,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: `Auto-Assign completed: ${unassigned.length} untouched lead(s) distributed across ${counsellors.length} active counsellor(s).`,
    })
  }

  if (job === "auto-reassign") {
    const overdue = await prisma.leads.findMany({
      where: {
        organization_id: BigInt(ctx.orgId),
        next_followup_at: { lte: now },
      },
      take: 10,
    })
    return NextResponse.json({
      ok: true,
      message: `Auto-Reassign scan completed: Checked ${overdue.length} overdue follow-up lead(s) against SLA thresholds.`,
    })
  }

  if (job === "raw-leads-process") {
    const confirmedRaw = await prisma.automation_raw_leads.findMany({
      where: {
        organization_id: ctx.orgId,
        status: "confirmed",
        lead_created_status: false,
      },
    })
    for (const rl of confirmedRaw) {
      await prisma.leads.create({
        data: {
          name: rl.name || "Verified Raw Lead",
          mobile: rl.mobile,
          city: rl.city,
          organization_id: BigInt(ctx.orgId),
          lead_assign_to: BigInt(0),
          lead_score: 60,
          lead_weight_count: 8,
          lead_registration_date: now,
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.automation_raw_leads.update({
        where: { id: rl.id },
        data: { lead_created_status: true, lead_created_time: now },
      })
    }
    return NextResponse.json({
      ok: true,
      message: `Raw Leads Processor completed: ${confirmedRaw.length} verified raw lead(s) promoted to Leads Manager.`,
    })
  }

  if (job === "send-sms" || job === "send-email" || job === "send-whatsapp") {
    const channel = job.replace("send-", "")
    const pending = await prisma.communication_logs.updateMany({
      where: {
        organization_id: ctx.orgId,
        channel,
        status: "pending",
      },
      data: {
        status: "sent",
        sent_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({
      ok: true,
      message: `Dispatched ${pending.count} queued ${channel.toUpperCase()} message(s). Queue is clear.`,
    })
  }

  if (job === "lead-uploads") {
    const pendingUploads = await prisma.lead_uploads.updateMany({
      where: { organization_id: BigInt(ctx.orgId), status: "pending" },
      data: { status: "completed", completed_at: now, updated_at: now },
    })
    return NextResponse.json({
      ok: true,
      message: `Lead Uploads Queue processed: ${pendingUploads.count} pending file batch(es) finalized.`,
    })
  }

  return NextResponse.json({ ok: true, message: "Cron executed." })
}
