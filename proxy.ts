import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PREFIXES = [
  "/login",
  "/password",
  "/lp",
  "/webform",
  "/application_form_show",
  "/api/auth",
  "/api/public-lp",
  "/api/public-webform",
  "/api/public-application",
  "/api/webhook",
  "/api/leads/add",
  "/api/leads/store",
  "/api/otp",
]

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API routes to return their own JSON 401/200 responses directly
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  const isAuthenticated = hasSessionCookie(request)

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!isPublic && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)",
  ],
}
