import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

const DEFAULT_LEAD_COLUMNS = [
  "name",
  "mobile",
  "email",
  "city",
  "state",
  "institute_id",
  "programme_id",
  "faculty_id",
  "lead_source_id",
  "lead_status_id",
  "stage_id",
  "lead_score",
  "lead_assign_to",
  "next_followup_at",
  "created_at",
]

export async function GET() {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({
      columns: DEFAULT_LEAD_COLUMNS,
      savedFilters: [],
    })
  }

  const [colSetting, savedFilters] = await Promise.all([
    prisma.lead_column_settings.findFirst({
      where: {
        organization_id: BigInt(ctx.orgId),
        user_id: BigInt(ctx.userId),
      },
    }),
    prisma.lead_saved_filters.findMany({
      where: {
        organization_id: ctx.orgId,
        user_id: BigInt(ctx.userId),
      },
      orderBy: [{ is_default: "desc" }, { id: "desc" }],
    }),
  ])

  let columns = DEFAULT_LEAD_COLUMNS
  if (colSetting?.columns_json) {
    try {
      const parsed = JSON.parse(colSetting.columns_json)
      if (Array.isArray(parsed) && parsed.length > 0) {
        columns = parsed
      }
    } catch {
      // keep default
    }
  }

  return NextResponse.json(serializeData({ columns, savedFilters }))
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const action = String(body.action || "")
  const now = new Date()

  if (action === "save_columns" && Array.isArray(body.columns)) {
    const existing = await prisma.lead_column_settings.findFirst({
      where: {
        organization_id: BigInt(ctx.orgId),
        user_id: BigInt(ctx.userId),
      },
    })

    if (existing) {
      await prisma.lead_column_settings.update({
        where: { id: existing.id },
        data: {
          columns_json: JSON.stringify(body.columns),
          updated_at: now,
        },
      })
    } else {
      await prisma.lead_column_settings.create({
        data: {
          organization_id: BigInt(ctx.orgId),
          user_id: BigInt(ctx.userId),
          columns_json: JSON.stringify(body.columns),
          created_at: now,
          updated_at: now,
        },
      })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === "save_filter") {
    const name = String(body.name || "").trim()
    if (!name) {
      return NextResponse.json({ error: "Filter name required" }, { status: 400 })
    }
    const created = await prisma.lead_saved_filters.create({
      data: {
        organization_id: ctx.orgId,
        user_id: BigInt(ctx.userId),
        institute_id: ctx.currentInstituteId ? BigInt(ctx.currentInstituteId) : null,
        name,
        filters_json: JSON.stringify(body.filters || {}),
        is_default: Boolean(body.is_default),
        created_at: now,
        updated_at: now,
      },
    })
    return NextResponse.json(serializeData({ ok: true, filter: created }))
  }

  if (action === "make_default" && body.id) {
    await prisma.lead_saved_filters.updateMany({
      where: { organization_id: ctx.orgId, user_id: BigInt(ctx.userId) },
      data: { is_default: false },
    })
    await prisma.lead_saved_filters.update({
      where: { id: BigInt(body.id) },
      data: { is_default: true, updated_at: now },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "delete_filter" && body.id) {
    await prisma.lead_saved_filters.delete({
      where: { id: BigInt(body.id) },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
