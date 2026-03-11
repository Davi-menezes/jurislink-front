import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/config"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("token")
  const next = searchParams.get("next")
  const safeNext = next && next.startsWith("/") ? next : null

  if (!token) {
    const errorUrl = new URL("/auth/error", origin)
    const reason = searchParams.get("reason")
    const details = searchParams.get("details")
    if (reason) errorUrl.searchParams.set("reason", reason)
    if (details) errorUrl.searchParams.set("details", details)
    return NextResponse.redirect(errorUrl.toString())
  }

  const response = NextResponse.redirect(`${origin}${safeNext || "/"}`)
  response.cookies.set(authConfig.sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
