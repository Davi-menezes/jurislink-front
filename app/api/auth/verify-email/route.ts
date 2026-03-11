import { NextRequest, NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/config"
import { proxyToBackend } from "@/lib/auth/proxy"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || ""
  const response = await proxyToBackend(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(payload, { status: response.status })
  }

  const nextResponse = NextResponse.json(payload)
  if (payload?.token) {
    nextResponse.cookies.set(authConfig.sessionCookieName, payload.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return nextResponse
}
