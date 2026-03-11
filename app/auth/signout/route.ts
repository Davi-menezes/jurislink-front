import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/config"

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const response = NextResponse.redirect(`${origin}/`, { status: 302 })
  response.cookies.delete(authConfig.sessionCookieName)
  return response
}
