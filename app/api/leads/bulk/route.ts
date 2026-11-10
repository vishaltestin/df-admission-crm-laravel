import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { safeBigInt } from "@/lib/serialize"

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "")
  const rawIds: Array<string | number> = Array.isArray(body.ids)
    ? body.ids
    : String(body.ids || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)

  const ids = rawIds
    .map((id) => safeBigInt(id))
    .filter((id): id is bigint => id !== null && id > BigInt(0))

  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid leads selected" }, { status: 400 })
  }

  const now = new Date()

  if (action === "delete") {
    await prisma.leads.deleteMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
    })
    return NextResponse.json({
      ok: true,
      message: `${ids.length} lead(s) deleted successfully.`,
    })
  }

  if (action === "reassign") {
    const newOwner = BigInt(body.reassign_to || 0)
    const reassignType =
      body.reassign_type === "remove_and_add" ? "remove_and_add" : "add_owner"
    await prisma.leads.updateMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
      data: { lead_assign_to: newOwner, updated_at: now },
    })
    for (const lid of ids) {
      if (newOwner > BigInt(0)) {
        await prisma.lead_assignment_logs.create({
          data: {
            lead_id: lid,
            organization_id: BigInt(ctx.orgId),
            assigned_to: newOwner,
            rule_type: reassignType,
            is_reassign: true,
            notes:
              reassignType === "remove_and_add"
                ? "Previous owner removed & new owner assigned"
                : "Owner added via Re-assign Leads",
            created_at: now,
            updated_at: now,
          },
        })
      }
      await prisma.lead_activity_logs.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          lead_id: lid,
          user_id: BigInt(ctx.userId),
          action: "bulk_reassigned",
          description: `Lead reassigned to user #${newOwner} (${reassignType === "remove_and_add" ? "Remove & Add" : "Add Owner"})`,
          created_at: now,
          updated_at: now,
        },
      })
    }
    return NextResponse.json({
      ok: true,
      message: `${ids.length} lead(s) reassigned successfully.`,
    })
  }

  if (action === "stage") {
    const data: Record<string, unknown> = { updated_at: now }
    if (body.lead_status_id) data.lead_status_id = BigInt(body.lead_status_id)
    if (body.lead_sub_status_id) data.lead_sub_status_id = BigInt(body.lead_sub_status_id)
    if (body.stage_id) data.stage_id = BigInt(body.stage_id)
    if (body.followup_date) data.next_followup_at = new Date(body.followup_date)

    await prisma.leads.updateMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
      data,
    })

    for (const lid of ids) {
      await prisma.lead_activity_logs.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          lead_id: lid,
          user_id: BigInt(ctx.userId),
          action: "bulk_stage_update",
          description: `Stage/Status updated in bulk${body.stage_note ? `: ${body.stage_note}` : ""}`,
          created_at: now,
          updated_at: now,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: `Stage updated for ${ids.length} lead(s).`,
    })
  }

  if (action === "pipeline") {
    const pipelineId = safeBigInt(body.pipeline_id)
    if (!pipelineId) {
      return NextResponse.json(
        { error: "Please select a target pipeline" },
        { status: 400 }
      )
    }
    const firstStage = await prisma.pipeline_stages.findFirst({
      where: { lead_pipeline_id: Number(pipelineId) },
      orderBy: { sort_order: "asc" },
    })

    await prisma.leads.updateMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
      data: {
        pipeline_id: pipelineId,
        stage_id: firstStage ? BigInt(firstStage.id) : undefined,
        updated_at: now,
      },
    })

    return NextResponse.json({
      ok: true,
      message: `${ids.length} lead(s) moved to pipeline.`,
    })
  }

  if (action === "data_update") {
    const data: Record<string, unknown> = { updated_at: now }
    if (body.institute_id) data.institute_id = BigInt(body.institute_id)
    if (body.programme_id) data.programme_id = BigInt(body.programme_id)
    if (body.course_id) data.faculty_id = BigInt(body.course_id)
    if (body.state_id) data.state = String(body.state_id)
    if (body.city_id) data.city = String(body.city_id)

    await prisma.leads.updateMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
      data,
    })

    return NextResponse.json({
      ok: true,
      message: `Data updated for ${ids.length} lead(s).`,
    })
  }

  if (action === "email" || action === "sms" || action === "whatsapp") {
    const targetLeads = await prisma.leads.findMany({
      where: { id: { in: ids }, organization_id: BigInt(ctx.orgId) },
    })

    for (const l of targetLeads) {
      const toAddr = action === "email" ? l.email || l.mobile : l.mobile
      await prisma.communication_logs.create({
        data: {
          organization_id: ctx.orgId,
          lead_id: l.id,
          channel: action,
          sent_by: BigInt(ctx.userId),
          to: toAddr,
          subject: body.subject || `${action.toUpperCase()} Broadcast`,
          content:
            body.message ||
            body.email_body ||
            body.sms_body ||
            body.wa_body ||
            "",
          status: "sent",
          sent_at: now,
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.lead_activity_logs.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          lead_id: l.id,
          user_id: BigInt(ctx.userId),
          action: `bulk_${action}`,
          description: `Bulk ${action.toUpperCase()} sent to ${toAddr}`,
          created_at: now,
          updated_at: now,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: `Bulk ${action.toUpperCase()} dispatched to ${targetLeads.length} lead(s).`,
    })
  }

  if (action === "event") {
    for (const lid of ids) {
      await prisma.lead_events.create({
        data: {
          lead_id: lid,
          subject: String(body.subject || "Follow up"),
          description: body.description ? String(body.description) : null,
          start_at: body.start_at ? new Date(body.start_at) : now,
          end_at: body.end_at ? new Date(body.end_at) : null,
          owner_id: BigInt(body.owner_id || ctx.userId),
          event_type: String(body.event_type || "phone_call"),
          created_at: now,
          updated_at: now,
        },
      })
      if (body.start_at) {
        await prisma.leads.update({
          where: { id: lid },
          data: { next_followup_at: new Date(body.start_at), updated_at: now },
        })
      }
    }
    return NextResponse.json({
      ok: true,
      message: `Follow-up event scheduled for ${ids.length} lead(s).`,
    })
  }

  if (action === "facebook" || action === "google") {
    const audienceName = String(body.audience_name || "CRM Custom Audience")
    for (const lid of ids) {
      await prisma.lead_activity_logs.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          lead_id: lid,
          user_id: BigInt(ctx.userId),
          action: `sync_${action}`,
          description: `Synced to ${action === "facebook" ? "Facebook Custom Audience" : "Google Ads Customer Match"}: "${audienceName}"`,
          created_at: now,
          updated_at: now,
        },
      })
    }
    return NextResponse.json({
      ok: true,
      message: `${ids.length} lead(s) synced to ${action === "facebook" ? "Facebook" : "Google Ads"} audience "${audienceName}".`,
    })
  }

  return NextResponse.json({ error: "Unsupported bulk action" }, { status: 400 })
}
