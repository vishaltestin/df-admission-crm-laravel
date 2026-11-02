import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("sample") === "1") {
    const sampleCsv = [
      "name,mobile,email,city,state",
      "Aryan Malhotra,9810900101,aryan.m@example.com,New Delhi,Delhi",
      "Sneha Nair,9820900102,sneha.nair@example.com,Mumbai,Maharashtra",
      "Vikrant Singh,9845900103,vikrant.s@example.com,Bengaluru,Karnataka",
    ].join("\n")

    return new NextResponse(sampleCsv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads_upload_sample.csv"',
      },
    })
  }

  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const logs = await prisma.lead_uploads.findMany({
    where: { organization_id: BigInt(ctx.orgId) },
    orderBy: { id: "desc" },
    take: 100,
  })

  return NextResponse.json(serializeData({ logs }))
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const csvText = String(body.csv_text || "").trim()
  const fileName = String(body.file_name || `leads_batch_${Date.now()}.csv`)
  const primaryKey = String(body.primary_key || "mobile")
  const instituteId = body.institute_id ? BigInt(body.institute_id) : null
  const programmeId = body.programme_id ? BigInt(body.programme_id) : null
  const courseId = body.course_id ? BigInt(body.course_id) : null
  const sourceId = body.source_id ? BigInt(body.source_id) : null
  const assignTo = body.assign_to ? BigInt(body.assign_to) : BigInt(0)

  if (!csvText) {
    return NextResponse.json({ error: "CSV content is empty" }, { status: 400 })
  }

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have header + at least 1 row" },
      { status: 400 }
    )
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const now = new Date()

  const defaultPipe = await prisma.pipelines.findFirst({
    where: { organization_id: ctx.orgId },
    orderBy: [{ is_default: "desc" }, { id: "asc" }],
  })
  const firstStage = defaultPipe
    ? await prisma.pipeline_stages.findFirst({
        where: { lead_pipeline_id: defaultPipe.id },
        orderBy: { sort_order: "asc" },
      })
    : null
  const firstStatus = await prisma.lead_statuses.findFirst({
    where: {
      OR: [{ organization_id: BigInt(ctx.orgId) }, { organization_id: null }],
    },
    orderBy: { sort_order: "asc" },
  })

  let validRows = 0
  let duplicateRows = 0
  let failedRows = 0
  const totalRows = lines.length - 1

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim())
    const rowObj: Record<string, string> = {}
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] || ""
    })

    const mobile = rowObj.mobile || rowObj.phone || ""
    const email = rowObj.email || ""
    const name = rowObj.name || "Uploaded Lead"

    if (!mobile && !email) {
      failedRows++
      continue
    }

    const exists =
      primaryKey === "email" && email
        ? await prisma.leads.findFirst({
            where: { organization_id: BigInt(ctx.orgId), email },
          })
        : mobile
          ? await prisma.leads.findFirst({
              where: { organization_id: BigInt(ctx.orgId), mobile },
            })
          : null

    if (exists) {
      duplicateRows++
      continue
    }

    await prisma.leads.create({
      data: {
        name,
        mobile: mobile || "0000000000",
        email: email || null,
        city: rowObj.city || null,
        state: rowObj.state || null,
        country: "1",
        organization_id: BigInt(ctx.orgId),
        institute_id: instituteId,
        programme_id: programmeId,
        faculty_id: courseId,
        lead_source_id: sourceId,
        pipeline_id: defaultPipe ? BigInt(defaultPipe.id) : null,
        stage_id: firstStage ? BigInt(firstStage.id) : null,
        lead_status_id: firstStatus?.id ?? null,
        lead_assign_to: assignTo,
        created_by: BigInt(ctx.userId),
        lead_score: 45,
        lead_weight_count: 4,
        lead_registration_date: now,
        created_at: now,
        updated_at: now,
      },
    })
    validRows++
  }

  const inst = instituteId
    ? await prisma.institutes.findUnique({ where: { id: instituteId } })
    : null
  const prog = programmeId
    ? await prisma.programs.findUnique({ where: { id: programmeId } })
    : null
  const crs = courseId
    ? await prisma.products.findUnique({ where: { id: Number(courseId) } })
    : null

  const log = await prisma.lead_uploads.create({
    data: {
      organization_id: BigInt(ctx.orgId),
      user_id: BigInt(ctx.userId),
      file_name: fileName,
      file_path: `/uploads/leads/${fileName}`,
      total_rows: totalRows,
      valid_rows: validRows,
      duplicate_rows: duplicateRows,
      failed_rows: failedRows,
      status: "completed",
      upload_type: primaryKey,
      institute: inst?.name || "-",
      program: prog?.name || "-",
      course: crs?.name || "-",
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now,
    },
  })

  return NextResponse.json(
    serializeData({
      ok: true,
      log,
      summary: `Processed ${totalRows} rows: ${validRows} imported, ${duplicateRows} duplicates skipped, ${failedRows} invalid.`,
    })
  )
}
