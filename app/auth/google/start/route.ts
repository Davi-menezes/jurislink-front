import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@/lib/types"

function isAllowedRole(value: string | null): value is UserRole {
  return value === "CLIENT" || value === "LAWYER" || value === "ADMIN"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const flow = searchParams.get("flow") === "signup" ? "signup" : "login"
  const roleParam = searchParams.get("role")
  const role = isAllowedRole(roleParam) ? roleParam : "CLIENT"

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  if (!clientId) {
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const redirectUri = `${origin}/auth/google/callback`
  const nonce = crypto.randomUUID()
  const statePayload = JSON.stringify({ nonce, flow, role })
  const state = Buffer.from(statePayload).toString("base64url")

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleUrl.searchParams.set("client_id", clientId)
  googleUrl.searchParams.set("redirect_uri", redirectUri)
  googleUrl.searchParams.set("response_type", "code")
  googleUrl.searchParams.set("scope", "openid email profile")
  googleUrl.searchParams.set("prompt", "select_account")
  googleUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(googleUrl.toString())
  response.cookies.set("google_oauth_state", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })

  return response
}
