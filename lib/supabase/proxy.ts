import { NextResponse, type NextRequest } from "next/server"
import { authConfig } from "@/lib/auth/config"

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get(authConfig.sessionCookieName)?.value
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/painel") && !token) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
