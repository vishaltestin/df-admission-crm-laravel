import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || ""
  const page =
    (await prisma.landing_pages.findFirst({ where: { slug } })) ||
    (slug
      ? null
      : await prisma.landing_pages.findFirst({
          where: { status: 1 },
          orderBy: { id: "asc" },
        }))

  if (!page) {
    return NextResponse.json({ page: null, sections: [] }, { status: 404 })
  }

  const sections = await prisma.landing_page_sections.findMany({
    where: { page_id: page.id },
    orderBy: { sort_order: "asc" },
  })
  return NextResponse.json(serializeData({ page, sections }))
}
