import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { safeBigInt, serializeData } from "@/lib/serialize"

export async function GET() {
  const ctx = await getOptionalSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgLeads = await prisma.leads.findMany({
    where: { organization_id: BigInt(ctx.orgId) },
    select: { id: true, name: true, mobile: true },
  })
  const leadIds = orgLeads.map((l) => l.id)
  const leadMap = new Map(orgLeads.map((l) => [String(l.id), l]))

  const events = await prisma.lead_events.findMany({
    where: leadIds.length > 0 ? { lead_id: { in: leadIds } } : { id: BigInt(0) },
    orderBy: { start_at: "asc" },
    take: 200,
  })

  const enriched = events.map((ev) => {
    const ld = leadMap.get(String(ev.lead_id))
    return {
      ...ev,
      lead_name: ld?.name || `Lead #${ev.lead_id}`,
      lead_mobile: ld?.mobile || "",
    }
  })

  return NextResponse.json(serializeData({ events: enriched, leads: orgLeads }))
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const leadId = safeBigInt(body.lead_id)
  if (!leadId) {
    return NextResponse.json(
      { error: "Please select a student lead" },
      { status: 400 }
    )
  }

  const now = new Date()
  const startAt = body.start_at ? new Date(body.start_at) : now

  const ev = await prisma.lead_events.create({
    data: {
      lead_id: leadId,
      subject: String(body.subject || "Admissions Follow-up Call"),
      description: body.description ? String(body.description) : null,
      event_type: String(body.event_type || "call"),
      start_at: startAt,
      end_at: body.end_at ? new Date(body.end_at) : null,
      owner_id: BigInt(ctx.userId),
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.leads.updateMany({
    where: { id: leadId, organization_id: BigInt(ctx.orgId) },
    data: { next_followup_at: startAt, updated_at: now },
  })

  return NextResponse.json(serializeData({ ok: true, item: ev }))
}
