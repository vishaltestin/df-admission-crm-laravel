import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { safeBigInt, serializeData } from "@/lib/serialize"

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  const payload = await req.json().catch(() => ({}))

  const name = String(payload.name || "").trim()
  const mobile = String(payload.mobile || "").trim()
  const uploadVia = payload.upload_via ? String(payload.upload_via).trim() : null
  const email = payload.email ? String(payload.email).trim() : null

  const errors: Record<string, string[]> = {}
  if (!name) errors.name = ["The name field is required."]
  if (!mobile) errors.mobile = ["The mobile field is required."]
  if (uploadVia === "email" && !email) {
    errors.email = ["The email field is required when upload_via is email."]
  }

  if (Object.keys(errors).length > 0) {
    const firstMsg = Object.values(errors)[0][0]
    return NextResponse.json({ message: firstMsg, errors }, { status: 422 })
  }

  const orgId =
    Number(payload.organization_id) > 0
      ? Number(payload.organization_id)
      : ctx?.orgId || 1
  const now = new Date()

  const defaultPipe = await prisma.pipelines.findFirst({
    where: { organization_id: orgId },
    orderBy: [{ is_default: "desc" }, { id: "asc" }],
  })
  const resolvedPipeId =
    safeBigInt(payload.pipeline_id) ??
    (defaultPipe ? BigInt(defaultPipe.id) : null)

  const firstStage = resolvedPipeId
    ? await prisma.pipeline_stages.findFirst({
        where: { lead_pipeline_id: Number(resolvedPipeId) },
        orderBy: { sort_order: "asc" },
      })
    : null

  const firstStatus = await prisma.lead_statuses.findFirst({
    where: {
      OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
    },
    orderBy: { sort_order: "asc" },
  })

  const extraMeta: Record<string, string> = {}
  if (payload.qualification) {
    extraMeta.qualification = String(payload.qualification)
  }
  if (uploadVia) {
    extraMeta.upload_via = uploadVia
  }

  const appFormId =
    Number(payload.application_form_id) > 0
      ? Number(payload.application_form_id)
      : null

  const assignTo =
    safeBigInt(payload.lead_assign_to) ??
    (ctx?.userId ? BigInt(ctx.userId) : BigInt(0))

  const lead = await prisma.leads.create({
    data: {
      name: name.slice(0, 150),
      mobile: mobile.slice(0, 20),
      email,
      state: payload.state ? String(payload.state) : null,
      city: payload.city ? String(payload.city) : null,
      country: payload.country ? String(payload.country) : "80",
      organization_id: BigInt(orgId),
      lead_assign_to: assignTo,
      institute_id: safeBigInt(payload.institute_id),
      programme_id: safeBigInt(payload.programme_id),
      faculty_id: safeBigInt(payload.faculty_id),
      application_form_id: appFormId,
      lead_source_id: safeBigInt(payload.source ?? payload.lead_source_id),
      lead_campaign_id: safeBigInt(payload.campaign ?? payload.lead_campaign_id),
      type_id: safeBigInt(payload.medium ?? payload.type_id),
      lead_marketing_event:
        Number(payload.event_id ?? payload.lead_marketing_event) > 0
          ? Number(payload.event_id ?? payload.lead_marketing_event)
          : null,
      pipeline_id: resolvedPipeId,
      stage_id: firstStage ? BigInt(firstStage.id) : null,
      lead_status_id: firstStatus?.id ?? null,
      lead_score: 45,
      lead_weight_count: 5,
      lead_registration_date: now,
      extra_fields_json: JSON.stringify({
        ...extraMeta,
        upload_via: uploadVia,
      }),
      created_at: now,
      updated_at: now,
    },
  })

  if (appFormId) {
    await prisma.lead_applications.create({
      data: {
        lead_id: lead.id,
        application_form: appFormId,
        application_score: 0,
        payment_status: "pending",
        created_at: now,
      },
    })
    await prisma.application_form_responses.create({
      data: {
        lead_form_id: BigInt(appFormId),
        lead_id: Number(lead.id),
        organization_id: orgId,
        assigned_to: Number(assignTo),
        response_json: JSON.stringify({
          name,
          mobile,
          email: email || "",
          country: payload.country ? String(payload.country) : "80",
          state: payload.state ? String(payload.state) : "",
          city: payload.city ? String(payload.city) : "",
          institute: payload.institute_id ? String(payload.institute_id) : "",
          programme: payload.programme_id ? String(payload.programme_id) : "",
          course: payload.faculty_id ? String(payload.faculty_id) : "",
        }),
        fill_percentage: 20,
        current_step: 1,
        status: "draft",
        created_at: now,
        updated_at: now,
      },
    })
  }

  await prisma.lead_activity_logs.create({
    data: {
      organization_id: BigInt(orgId),
      lead_id: lead.id,
      user_id: ctx?.userId ? BigInt(ctx.userId) : null,
      action: "api_lead_created",
      description: `Lead ${name} created via Lead Create API (/api/leads/store)`,
      created_at: now,
      updated_at: now,
    },
  })

  return NextResponse.json(
    serializeData({
      status: true,
      message: "Lead created successfully",
      lead_id: lead.id,
    })
  )
}
