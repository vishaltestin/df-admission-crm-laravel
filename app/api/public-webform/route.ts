import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeBigInt, serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const formId = req.nextUrl.searchParams.get("form_id") || ""
  const form = await prisma.web_forms.findFirst({ where: { form_id: formId } })
  if (!form) {
    return NextResponse.json({ form: null, attributes: [] })
  }

  await prisma.web_forms.update({
    where: { id: form.id },
    data: { view_count: { increment: 1 } },
  })

  const orgId = form.organization_id || 1
  const [attributes, countries, states, cities, institutes, programs, courses] =
    await Promise.all([
      prisma.web_form_attributes.findMany({
        where: { web_form_id: form.id },
        orderBy: { sort_order: "asc" },
      }),
      prisma.countries.findMany({ orderBy: { name: "asc" } }),
      prisma.states.findMany({ orderBy: { name: "asc" } }),
      prisma.cities.findMany({ orderBy: { name: "asc" } }),
      prisma.institutes.findMany({
        where: { organization_id: BigInt(orgId) },
        orderBy: { name: "asc" },
      }),
      prisma.programs.findMany({ orderBy: { name: "asc" } }),
      prisma.products.findMany({
        where: { organization_id: orgId },
        orderBy: { name: "asc" },
      }),
    ])

  return NextResponse.json(
    serializeData({
      form,
      attributes,
      countries,
      states,
      cities,
      institutes,
      programs,
      courses,
    })
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const form = await prisma.web_forms.findFirst({
      where: { form_id: String(body.form_id || "") },
    })
    const now = new Date()
    const orgId = form?.organization_id || 1

    if (form) {
      await prisma.web_forms.update({
        where: { id: form.id },
        data: { submit_count: { increment: 1 } },
      })
    }

    if (!form || form.create_lead) {
      const extraObj =
        typeof body.extra === "object" && body.extra !== null ? body.extra : {}
      const firstStatus = await prisma.lead_statuses.findFirst({
        where: {
          OR: [{ organization_id: BigInt(orgId) }, { organization_id: null }],
        },
        orderBy: { sort_order: "asc" },
      })

      await prisma.leads.create({
        data: {
          organization_id: BigInt(orgId),
          name: String(body.name || extraObj.name || "WebForm Student"),
          mobile: String(body.mobile || extraObj.mobile || ""),
          email:
            body.email || extraObj.email
              ? String(body.email || extraObj.email)
              : null,
          city:
            body.city || extraObj.city
              ? String(body.city || extraObj.city)
              : null,
          state:
            body.state || extraObj.state
              ? String(body.state || extraObj.state)
              : null,
          country:
            body.country || extraObj.country
              ? String(body.country || extraObj.country)
              : "India",
          institute_id:
            safeBigInt(body.institute_id) ?? safeBigInt(extraObj.institute),
          programme_id:
            safeBigInt(body.programme_id) ?? safeBigInt(extraObj.programme),
          lead_source_id: form?.lead_source_id
            ? BigInt(form.lead_source_id)
            : null,
          lead_campaign_id: form?.lead_campaign_id
            ? BigInt(form.lead_campaign_id)
            : null,
          pipeline_id: form?.pipeline_id ? BigInt(form.pipeline_id) : null,
          type_id: form?.type_id ? BigInt(form.type_id) : null,
          lead_status_id: firstStatus?.id ?? null,
          application_form_id: form?.application_form_id
            ? Number(form.application_form_id)
            : null,
          extra_fields_json: Object.keys(extraObj).length
            ? JSON.stringify(extraObj)
            : null,
          lead_assign_to: BigInt(0),
          lead_score: 25,
          lead_registration_date: now,
          created_at: now,
          updated_at: now,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message:
        form?.submit_success_content ||
        "Thanks for your time. Our team will contact you soon.",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
