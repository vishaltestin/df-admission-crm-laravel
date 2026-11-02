import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeBigInt, serializeData } from "@/lib/serialize"

async function handlePublicLeadAdd(payload: Record<string, unknown>) {
  const mobile = String(payload.mobile || "").trim()
  const name = String(payload.name || "API Lead").trim()
  if (!mobile) {
    return NextResponse.json(
      { status: false, message: "mobile is required" },
      { status: 400 }
    )
  }

  const orgId = Number(payload.organization_id) > 0 ? Number(payload.organization_id) : 1
  const now = new Date()

  const explicitPipeId = safeBigInt(payload.pipeline_id)
  const defaultPipe = explicitPipeId
    ? null
    : await prisma.pipelines.findFirst({
        where: { organization_id: orgId },
        orderBy: [{ is_default: "desc" }, { id: "asc" }],
      })

  const resolvedPipeId =
    explicitPipeId ?? (defaultPipe ? BigInt(defaultPipe.id) : null)

  const explicitStageId = safeBigInt(payload.stage_id)
  const firstStage =
    !explicitStageId && resolvedPipeId
      ? await prisma.pipeline_stages.findFirst({
          where: { lead_pipeline_id: Number(resolvedPipeId) },
          orderBy: { sort_order: "asc" },
        })
      : null

  const explicitStatusId = safeBigInt(payload.lead_status_id)
  const firstStatus = explicitStatusId
    ? null
    : await prisma.lead_statuses.findFirst({
        where: {
          OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
        },
        orderBy: { sort_order: "asc" },
      })

  const extraMeta: Record<string, string> = {}
  for (const k of ["source", "medium", "campaign", "upload_via", "source_type"]) {
    if (payload[k]) extraMeta[k] = String(payload[k])
  }

  const lead = await prisma.leads.create({
    data: {
      name,
      mobile,
      alternate_mobile: payload.alternate_mobile
        ? String(payload.alternate_mobile)
        : null,
      email: payload.email ? String(payload.email) : null,
      city: payload.city ? String(payload.city) : null,
      state: payload.state ? String(payload.state) : null,
      country: payload.country ? String(payload.country) : "1",
      organization_id: BigInt(orgId),
      institute_id: safeBigInt(payload.institute_id),
      programme_id: safeBigInt(payload.programme_id),
      faculty_id: safeBigInt(payload.faculty_id),
      lead_source_id: safeBigInt(payload.lead_source_id),
      lead_campaign_id: safeBigInt(payload.lead_campaign_id),
      lead_marketing_event: Number(payload.lead_marketing_event) > 0
        ? Number(payload.lead_marketing_event)
        : null,
      pipeline_id: resolvedPipeId,
      stage_id:
        explicitStageId ?? (firstStage ? BigInt(firstStage.id) : null),
      lead_status_id: explicitStatusId ?? firstStatus?.id ?? null,
      lead_sub_status_id: safeBigInt(payload.lead_sub_status_id),
      lead_assign_to: safeBigInt(payload.lead_assign_to, BigInt(0)) ?? BigInt(0),
      lead_score: Number.isFinite(Number(payload.lead_score))
        ? Number(payload.lead_score)
        : 45,
      lead_weight_count: 5,
      lead_registration_date: now,
      extra_fields_json:
        Object.keys(extraMeta).length > 0 ? JSON.stringify(extraMeta) : null,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.lead_activity_logs.create({
    data: {
      organization_id: BigInt(orgId),
      lead_id: lead.id,
      action: "api_lead_created",
      description: `Lead ${name} captured via External Lead Capture API${
        extraMeta.upload_via ? ` (${extraMeta.upload_via})` : ""
      }`,
      created_at: now,
      updated_at: now,
    },
  })

  return NextResponse.json(
    serializeData({
      status: true,
      message: "Lead captured successfully",
      lead_id: lead.id,
    })
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  return handlePublicLeadAdd(body)
}

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  return handlePublicLeadAdd(params)
}
