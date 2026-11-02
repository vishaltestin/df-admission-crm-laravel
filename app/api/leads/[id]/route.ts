import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { safeBigInt, serializeData } from "@/lib/serialize"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const leadId = safeBigInt(id)
  if (!leadId) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
  }

  const lead = await prisma.leads.findFirst({
    where: { id: leadId, organization_id: BigInt(ctx.orgId) },
  })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const [
    notes,
    events,
    comms,
    timeline,
    docs,
    queries,
    calls,
    appRecord,
    appResponse,
    appForm,
    users,
    stages,
    verification,
    coupons,
  ] = await Promise.all([
    prisma.lead_notes.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.lead_events.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.communication_logs.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.lead_activity_logs.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.lead_documents.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.lead_queries.findMany({
      where: { lead_id: Number(leadId) },
      orderBy: { id: "desc" },
    }),
    prisma.call_logs.findMany({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.lead_applications.findFirst({
      where: { lead_id: leadId },
      orderBy: { id: "desc" },
    }),
    prisma.application_form_responses.findFirst({
      where: { lead_id: Number(leadId) },
      orderBy: { id: "desc" },
    }),
    lead.application_form_id
      ? prisma.application_forms.findUnique({
          where: { id: BigInt(lead.application_form_id) },
        })
      : Promise.resolve(null),
    prisma.users.findMany({
      select: { id: true, first_name: true, last_name: true, email: true },
    }),
    lead.pipeline_id
      ? prisma.pipeline_stages.findMany({
          where: { lead_pipeline_id: Number(lead.pipeline_id) },
          orderBy: { sort_order: "asc" },
        })
      : prisma.pipeline_stages.findMany({ orderBy: { sort_order: "asc" } }),
    prisma.lead_verifications.findFirst({ where: { lead_id: leadId } }),
    prisma.coupons.findMany({
      where: { organization_id: BigInt(ctx.orgId), status: 1 },
      orderBy: { id: "desc" },
    }),
  ])

  const queryIds = queries.map((q) => q.id)
  const queryMessages = queryIds.length
    ? await prisma.lead_query_messages.findMany({
        where: { query_id: { in: queryIds } },
        orderBy: { id: "asc" },
      })
    : []

  const userMap = new Map(
    users.map((u) => [
      u.id,
      {
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        email: u.email,
      },
    ])
  )

  const mappedTimeline = timeline.map((t) => ({
    ...t,
    actor_name: t.user_id
      ? userMap.get(Number(t.user_id))?.name || "System"
      : "System",
  }))
  const mappedDocs = docs.map((d) => ({
    ...d,
    title: d.doc_name || "Document",
    status:
      d.status === 1 ? "approved" : d.status === 2 ? "rejected" : "pending",
  }))
  const mappedQueries = queries.map((q) => ({
    ...q,
    messages: queryMessages.filter((m) => m.query_id === q.id),
  }))

  return NextResponse.json(
    serializeData({
      lead,
      stages,
      notes: notes.map((n) => ({
        ...n,
        creator_name: n.created_by
          ? userMap.get(Number(n.created_by))?.name || "System"
          : "System",
      })),
      events: events.map((ev) => ({
        ...ev,
        owner_name: ev.owner_id
          ? userMap.get(Number(ev.owner_id))?.name || "System"
          : "System",
      })),
      comms,
      commLogs: comms,
      timeline: mappedTimeline,
      activities: mappedTimeline,
      docs: mappedDocs,
      documents: mappedDocs,
      queries: mappedQueries,
      tickets: mappedQueries,
      ticketMessages: queryMessages,
      calls,
      callLogs: calls,
      application: appRecord,
      applicationResponse: appResponse,
      appResponses: appResponse ? [appResponse] : [],
      applicationForm: appForm,
      verification,
      coupons,
    })
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const leadId = safeBigInt(id)
  if (!leadId) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
  }
  const lead = await prisma.leads.findFirst({
    where: { id: leadId, organization_id: BigInt(ctx.orgId) },
  })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || "")
  const now = new Date()

  if (action === "add_note") {
    const noteText = String(body.note || "").trim()
    if (!noteText) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 })
    }
    const created = await prisma.lead_notes.create({
      data: {
        lead_id: leadId,
        note: noteText,
        created_by: BigInt(ctx.userId),
        created_at: now,
        updated_at: now,
      },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "note_added",
        description: `Note added: "${noteText.slice(0, 80)}"`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json(serializeData({ ok: true, note: created }))
  }

  if (action === "change_stage") {
    const updateData: Record<string, unknown> = {
      updated_at: now,
      lead_weight_count: (lead.lead_weight_count || 0) + 2,
      lead_score: Math.min(100, (lead.lead_score || 40) + 5),
    }
    if (body.stage_id) updateData.stage_id = BigInt(body.stage_id)
    if (body.lead_status_id) updateData.lead_status_id = BigInt(body.lead_status_id)
    if (body.lead_sub_status_id)
      updateData.lead_sub_status_id = BigInt(body.lead_sub_status_id)
    if (body.followup_date)
      updateData.next_followup_at = new Date(body.followup_date)

    await prisma.leads.update({
      where: { id: leadId },
      data: updateData,
    })

    if (body.stage_note) {
      await prisma.lead_notes.create({
        data: {
          lead_id: leadId,
          note: String(body.stage_note),
          created_by: BigInt(ctx.userId),
          created_at: now,
          updated_at: now,
        },
      })
    }

    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "stage_changed",
        description: `Lead stage / status updated${body.stage_note ? ` — "${body.stage_note}"` : ""}`,
        created_at: now,
        updated_at: now,
      },
    })

    return NextResponse.json({ ok: true, message: "Lead stage updated." })
  }

  if (action === "add_event") {
    const startAt = body.start_at ? new Date(body.start_at) : now
    const ev = await prisma.lead_events.create({
      data: {
        lead_id: leadId,
        subject: String(body.subject || "Follow up"),
        description: body.description ? String(body.description) : null,
        start_at: startAt,
        end_at: body.end_at ? new Date(body.end_at) : null,
        owner_id: BigInt(body.owner_id || ctx.userId),
        event_type: String(body.event_type || "phone_call"),
        created_at: now,
        updated_at: now,
      },
    })
    await prisma.leads.update({
      where: { id: leadId },
      data: { next_followup_at: startAt, updated_at: now },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "event_scheduled",
        description: `Scheduled ${body.event_type || "phone_call"}: "${ev.subject}"`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json(serializeData({ ok: true, event: ev }))
  }

  if (action === "communicate") {
    const channel = String(body.channel || "email")
    const toAddr =
      channel === "email" ? lead.email || lead.mobile : lead.mobile
    const content = String(body.message || "").trim()

    const comm = await prisma.communication_logs.create({
      data: {
        organization_id: ctx.orgId,
        lead_id: leadId,
        channel,
        sent_by: BigInt(ctx.userId),
        to: toAddr,
        subject: body.subject ? String(body.subject) : `${channel.toUpperCase()} Message`,
        content,
        status: "sent",
        sent_at: now,
        created_at: now,
        updated_at: now,
      },
    })

    await prisma.lead_communication_logs.create({
      data: {
        lead_id: leadId,
        channel,
        direction: "outbound",
        purpose: body.subject ? String(body.subject) : "counselling",
        created_at: now,
      },
    })

    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: `${channel}_sent`,
        description: `Sent ${channel.toUpperCase()} to ${toAddr}`,
        created_at: now,
        updated_at: now,
      },
    })

    return NextResponse.json(serializeData({ ok: true, comm }))
  }

  if (action === "reassign") {
    const newOwner = Number(body.reassign_to || 0)
    await prisma.leads.update({
      where: { id: leadId },
      data: { lead_assign_to: BigInt(newOwner), updated_at: now },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "lead_reassigned",
        description: `Lead reassigned to counsellor #${newOwner}`,
        created_at: now,
        updated_at: now,
      },
    })
    if (newOwner > 0) {
      await prisma.notifications.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          user_id: BigInt(newOwner),
          type: "alert",
          title: `Lead Assigned: ${lead.name}`,
          body: `You have been assigned lead ${lead.name} (${lead.mobile}).`,
          url: `/leads/${lead.id}`,
          is_read: 0,
          created_at: now,
          updated_at: now,
        },
      })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === "update_pipeline") {
    const pipelineId = Number(body.pipeline_id)
    const firstStage = await prisma.pipeline_stages.findFirst({
      where: { lead_pipeline_id: pipelineId },
      orderBy: { sort_order: "asc" },
    })
    await prisma.leads.update({
      where: { id: leadId },
      data: {
        pipeline_id: BigInt(pipelineId),
        stage_id: body.stage_id
          ? BigInt(body.stage_id)
          : firstStage
            ? BigInt(firstStage.id)
            : lead.stage_id,
        updated_at: now,
      },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "pipeline_updated",
        description: `Pipeline changed to #${pipelineId}`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "update_source") {
    await prisma.leads.update({
      where: { id: leadId },
      data: {
        lead_source_id: BigInt(body.source_id),
        updated_at: now,
      },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "source_updated",
        description: `Lead source updated`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "update_details") {
    await prisma.leads.update({
      where: { id: leadId },
      data: {
        name: body.name ? String(body.name) : lead.name,
        mobile: body.mobile ? String(body.mobile) : lead.mobile,
        alternate_mobile:
          body.alternate_mobile !== undefined
            ? String(body.alternate_mobile || "") || null
            : lead.alternate_mobile,
        email: body.email !== undefined ? String(body.email || "") || null : lead.email,
        institute_id: body.institute_id ? BigInt(body.institute_id) : lead.institute_id,
        programme_id: body.programme_id ? BigInt(body.programme_id) : lead.programme_id,
        faculty_id: body.faculty_id ? BigInt(body.faculty_id) : lead.faculty_id,
        updated_at: now,
      },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "details_updated",
        description: `Lead profile details updated`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "call_now") {
    const call = await prisma.call_logs.create({
      data: {
        lead_id: leadId,
        agent_id: BigInt(ctx.userId),
        direction: "outbound",
        duration: 95,
        summary: `IVR click-to-call initiated to ${lead.mobile} by ${ctx.fullName}`,
        notes: body.notes ? String(body.notes) : "Outbound counselling call connected",
        created_at: now,
        updated_at: now,
      },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "ivr_call_placed",
        description: `Placed outbound click-to-call to ${lead.mobile}`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json(
      serializeData({
        ok: true,
        message: `Outbound IVR call initiated to ${lead.mobile}! Call logged.`,
        call,
      })
    )
  }

  if (action === "apply_coupon" || action === "validate_coupon") {
    const code = String(body.coupon_code || body.code || "")
      .trim()
      .toUpperCase()
    const baseAmount = Number(body.base_amount ?? body.amount ?? 0)

    const coupon = await prisma.coupons.findFirst({
      where: {
        organization_id: BigInt(ctx.orgId),
        code,
        status: 1,
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired coupon code." },
        { status: 400 }
      )
    }

    if (
      (coupon.start_at && now < coupon.start_at) ||
      (coupon.end_at && now > coupon.end_at)
    ) {
      return NextResponse.json(
        { ok: false, error: `Coupon ${code} is outside its active validity window.` },
        { status: 400 }
      )
    }

    if (
      coupon.usage_limit !== null &&
      coupon.usage_limit !== undefined &&
      coupon.used_count >= coupon.usage_limit
    ) {
      return NextResponse.json(
        { ok: false, error: `Coupon ${code} has reached its maximum usage limit.` },
        { status: 400 }
      )
    }

    const minAmount = coupon.min_amount ? Number(coupon.min_amount) : 0
    if (baseAmount < minAmount) {
      return NextResponse.json(
        {
          ok: false,
          error: `Minimum payable amount of ₹${minAmount} required for ${code}.`,
        },
        { status: 400 }
      )
    }

    let discount =
      coupon.type === "percent"
        ? (baseAmount * Number(coupon.value)) / 100
        : Number(coupon.value)

    if (coupon.max_discount && discount > Number(coupon.max_discount)) {
      discount = Number(coupon.max_discount)
    }
    discount = Math.min(baseAmount, Math.round(discount * 100) / 100)
    const finalAmount = Math.max(0, Math.round((baseAmount - discount) * 100) / 100)

    return NextResponse.json({
      ok: true,
      valid: true,
      coupon_id: Number(coupon.id),
      code: coupon.code,
      discount,
      finalAmount,
    })
  }

  if (action === "save_payment" || action === "mark_payment_done") {
    const method = String(body.payment_method || "online")
    const finalAmount = Math.round(Number(body.final_amount ?? body.amount ?? 0))
    const discountAmount = Number(body.discount_amount || 0)

    const existingApp = await prisma.lead_applications.findFirst({
      where: { lead_id: leadId },
    })

    if (existingApp) {
      await prisma.lead_applications.update({
        where: { id: existingApp.id },
        data: {
          payment_status: "paid",
          payment_method: method,
          application_score: 100,
        },
      })
    } else {
      await prisma.lead_applications.create({
        data: {
          lead_id: leadId,
          application_form: 1,
          application_score: 100,
          payment_status: "paid",
          payment_method: method,
          created_at: now,
        },
      })
    }

    const existingResp = await prisma.application_form_responses.findFirst({
      where: { lead_id: Number(leadId) },
    })
    let defaultFormId = lead.application_form_id
      ? BigInt(lead.application_form_id)
      : null
    if (!defaultFormId) {
      const af = await prisma.application_forms.findFirst({
        where: { organization_id: ctx.orgId },
      })
      defaultFormId = af?.id ?? BigInt(1)
    }

    if (existingResp) {
      await prisma.application_form_responses.update({
        where: { id: existingResp.id },
        data: {
          payment_amount: finalAmount,
          payment_method: method,
          payment_status: 1,
          fill_percentage: 100,
          current_step: 4,
          status: "approved",
          updated_at: now,
        },
      })
    } else {
      await prisma.application_form_responses.create({
        data: {
          lead_form_id: defaultFormId,
          response_json: JSON.stringify({ applicant: lead.name, mobile: lead.mobile }),
          fill_percentage: 100,
          email_verified: 1,
          otp_verified: 1,
          lead_id: Number(leadId),
          payment_amount: finalAmount,
          payment_method: method,
          payment_status: 1,
          organization_id: ctx.orgId,
          assigned_to: Number(lead.lead_assign_to || ctx.userId),
          current_step: 4,
          status: "approved",
          created_at: now,
          updated_at: now,
        },
      })
    }

    if (body.coupon_id) {
      await prisma.coupons.update({
        where: { id: BigInt(body.coupon_id) },
        data: { used_count: { increment: 1 } },
      })
      await prisma.coupon_usages.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          coupon_id: BigInt(body.coupon_id),
          lead_id: leadId,
          used_by_user_id: BigInt(ctx.userId),
          used_at: now,
          discount_amount: discountAmount,
          order_amount: finalAmount,
          created_at: now,
        },
      })
    }

    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "payment_received",
        description: `Payment of ₹${finalAmount} marked Paid via ${method.toUpperCase()}`,
        created_at: now,
        updated_at: now,
      },
    })

    return NextResponse.json({ ok: true })
  }

  if (action === "upload_document" || action === "upload_doc") {
    const docName = String(body.doc_name || body.title || "Document")
    const docType = String(body.doc_type || "Academic")
    const fileName = String(body.file_name || "marksheet.pdf")
    const ext = fileName.split(".").pop() || "pdf"

    const doc = await prisma.lead_documents.create({
      data: {
        organization_id: ctx.orgId,
        lead_id: leadId,
        doc_type: docType,
        doc_name: docName,
        file_path: `/uploads/documents/${leadId}_${Date.now()}_${fileName}`,
        file_ext: ext,
        file_size: BigInt(body.file_size || 245000),
        uploaded_by: BigInt(ctx.userId),
        status: 1,
        created_at: now,
        updated_at: now,
      },
    })

    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "document_uploaded",
        description: `Uploaded document "${docName}" (${docType})`,
        created_at: now,
        updated_at: now,
      },
    })

    return NextResponse.json(serializeData({ ok: true, doc }))
  }

  if (action === "delete_document" && body.doc_id) {
    await prisma.lead_documents.delete({
      where: { id: BigInt(body.doc_id) },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "create_ticket") {
    const q = await prisma.lead_queries.create({
      data: {
        lead_id: Number(leadId),
        query_code: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: String(body.subject || "General Support Query"),
        category: body.category || "general",
        priority: body.priority || "medium",
        status: "open",
        assigned_to: Number(lead.lead_assign_to || ctx.userId),
        created_by: "admin",
        created_at: now,
        updated_at: now,
      },
    })
    if (body.message) {
      await prisma.lead_query_messages.create({
        data: {
          query_id: q.id,
          sender_type: "admin",
          sender_id: ctx.userId,
          message: String(body.message),
          created_at: now,
        },
      })
    }
    return NextResponse.json(serializeData({ ok: true, ticket: q }))
  }

  if (action === "reply_ticket" && body.query_id) {
    const msg = await prisma.lead_query_messages.create({
      data: {
        query_id: Number(body.query_id),
        sender_type: "admin",
        sender_id: ctx.userId,
        message: String(body.message || ""),
        created_at: now,
      },
    })
    if (body.status) {
      await prisma.lead_queries.update({
        where: { id: Number(body.query_id) },
        data: {
          status: body.status,
          closed_at: body.status === "closed" ? now : undefined,
          updated_at: now,
        },
      })
    }
    return NextResponse.json(serializeData({ ok: true, msg }))
  }

  if (action === "change_pipeline_stage" && body.stage_id) {
    await prisma.leads.update({
      where: { id: leadId },
      data: { stage_id: Number(body.stage_id), updated_at: now },
    })
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(ctx.orgId),
        lead_id: leadId,
        user_id: BigInt(ctx.userId),
        action: "pipeline_stage_changed",
        description: `Moved lead to pipeline stage "${body.stage_name || body.stage_id}"`,
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "delete_note" && body.note_id) {
    await prisma.lead_notes.delete({ where: { id: BigInt(body.note_id) } })
    return NextResponse.json({ ok: true })
  }

  if (action === "event_status" && body.event_id) {
    const ev = await prisma.lead_events.findUnique({
      where: { id: BigInt(body.event_id) },
    })
    await prisma.lead_events.update({
      where: { id: BigInt(body.event_id) },
      data: {
        description: `${ev?.description || ""} [Completed]`.trim(),
        end_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "verify_doc" && body.doc_id) {
    await prisma.lead_documents.update({
      where: { id: BigInt(body.doc_id) },
      data: { status: body.status === "approved" ? 1 : 2, updated_at: now },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "ticket_status" && body.query_id) {
    await prisma.lead_queries.update({
      where: { id: Number(body.query_id) },
      data: {
        status: body.status === "closed" ? "closed" : "open",
        closed_at: body.status === "closed" ? now : undefined,
        updated_at: now,
      },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const leadId = safeBigInt(id)
  if (!leadId) {
    return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 })
  }
  await prisma.leads.deleteMany({
    where: { id: leadId, organization_id: BigInt(ctx.orgId) },
  })
  return NextResponse.json({ ok: true })
}
