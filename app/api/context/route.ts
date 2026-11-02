import { NextRequest, NextResponse } from "next/server"
import { getOptionalSessionContext } from "@/lib/session"

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const action = String(body.action || "")
  const id = body.id ? String(body.id) : ""

  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:"

  const cookieOpts = {
    path: "/",
    httpOnly: true,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    secure: isHttps,
    maxAge: 30 * 24 * 60 * 60,
  }

  const res = NextResponse.json({ ok: true, action, id })

  if (action === "switch_institute" && id) {
    res.cookies.set("df_current_institute", id, cookieOpts)
  } else if (action === "clear_institute") {
    res.cookies.set("df_current_institute", "", { ...cookieOpts, maxAge: 0 })
  } else if (action === "switch_org" && id) {
    res.cookies.set("df_current_org", id, cookieOpts)
    res.cookies.set("df_current_institute", "", { ...cookieOpts, maxAge: 0 })
  }

  return res
}
