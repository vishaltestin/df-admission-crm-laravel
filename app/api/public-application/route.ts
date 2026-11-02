import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeBigInt, serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || ""
  const leadIdParam = req.nextUrl.searchParams.get("lead_id") || "0"
  const couponCode = req.nextUrl.searchParams.get("coupon") || ""
  const now = new Date()

  const form = await prisma.application_forms.findFirst({
    where: { unique_code: code },
  })
  if (!form) {
    return NextResponse.json(
      { error: "Application form not found" },
      { status: 404 }
    )
  }

  let lead = null
  const parsedLeadId = safeBigInt(leadIdParam)
  if (parsedLeadId && parsedLeadId > BigInt(0)) {
    lead = await prisma.leads.findUnique({ where: { id: parsedLeadId } })
  }

  let coupon = null
  let couponError: string | null = null
  if (couponCode) {
    const found = await prisma.coupons.findFirst({
      where: {
        organization_id: BigInt(form.organization_id),
        code: couponCode.trim().toUpperCase(),
        status: 1,
      },
    })
    if (!found) {
      couponError = "Invalid or inactive coupon code"
    } else if (
      (found.start_at && now < found.start_at) ||
      (found.end_at && now > found.end_at)
    ) {
      couponError = "Coupon is expired or not yet active"
    } else if (
      found.usage_limit !== null &&
      found.usage_limit !== undefined &&
      found.used_count >= found.usage_limit
    ) {
      couponError = "Coupon usage limit has been reached"
    } else if (
      found.min_amount &&
      Number(form.total_amount || 0) < Number(found.min_amount)
    ) {
      couponError = `Minimum fee of ₹${Number(found.min_amount)} required`
    } else {
      coupon = found
    }
  }

  return NextResponse.json(serializeData({ form, lead, coupon, couponError }))
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const form = await prisma.application_forms.findFirst({
    where: { unique_code: String(body.code || "") },
  })
  if (!form) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 })
  }

  const now = new Date()
  const parsedBodyLeadId = safeBigInt(body.lead_id)
  let leadId =
    parsedBodyLeadId && parsedBodyLeadId > BigInt(0)
      ? Number(parsedBodyLeadId)
      : 0

  if (!leadId && body.mobile) {
    const newLead = await prisma.leads.create({
      data: {
        organization_id: BigInt(form.organization_id),
        name: String(body.name || "Applicant"),
        mobile: String(body.mobile),
        email: body.email ? String(body.email) : null,
        city: body.city ? String(body.city) : null,
        lead_assign_to: BigInt(0),
        lead_score: 40,
        lead_registration_date: now,
        created_at: now,
        updated_at: now,
      },
    })
    leadId = Number(newLead.id)
  }

  const totalBase = Number(form.total_amount || 0)
  let discount = 0
  let appliedCouponId: bigint | null = null

  if (body.coupon_code) {
    const c = await prisma.coupons.findFirst({
      where: {
        organization_id: BigInt(form.organization_id),
        code: String(body.coupon_code).trim().toUpperCase(),
        status: 1,
      },
    })
    const validWindow =
      c &&
      (!c.start_at || now >= c.start_at) &&
      (!c.end_at || now <= c.end_at) &&
      (c.usage_limit === null ||
        c.usage_limit === undefined ||
        c.used_count < c.usage_limit) &&
      (!c.min_amount || totalBase >= Number(c.min_amount))

    if (c && validWindow) {
      discount =
        c.type === "percent"
          ? Math.round((totalBase * Number(c.value)) / 100)
          : Number(c.value)
      if (c.max_discount && discount > Number(c.max_discount)) {
        discount = Number(c.max_discount)
      }
      discount = Math.min(totalBase, discount)
      appliedCouponId = c.id
      await prisma.coupons.update({
        where: { id: c.id },
        data: { used_count: (c.used_count || 0) + 1 },
      })
    }
  }
  const finalAmount = Math.max(0, totalBase - discount)

  const resp = await prisma.application_form_responses.create({
    data: {
      lead_form_id: form.id,
      organization_id: form.organization_id,
      lead_id: leadId,
      response_json: JSON.stringify(body.answers || {}),
      fill_percentage: 100,
      payment_amount: finalAmount,
      payment_method: String(form.gateway || "razorpay"),
      payment_status: 1,
      status: "submitted",
      created_at: now,
      updated_at: now,
    },
  })

  if (appliedCouponId) {
    await prisma.coupon_usages.create({
      data: {
        organization_id: BigInt(form.organization_id),
        coupon_id: appliedCouponId,
        lead_id: leadId > 0 ? BigInt(leadId) : null,
        application_id: resp.id,
        used_at: now,
        discount_amount: discount,
        order_amount: totalBase,
        meta_json: JSON.stringify({ portal: "application_form_show", code: form.unique_code }),
        created_at: now,
      },
    })
  }

  return NextResponse.json(
    serializeData({ ok: true, id: resp.id, finalAmount })
  )
}
