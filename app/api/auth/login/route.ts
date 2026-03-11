import { NextRequest, NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/config"
import { proxyToBackend } from "@/lib/auth/proxy"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const response = await proxyToBackend("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(
      payload || { error: "Não foi possível realizar o login." },
      { status: response.status },
    )
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
