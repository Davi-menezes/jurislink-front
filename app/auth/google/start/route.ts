import { NextRequest, NextResponse } from "next/server"
import { buildApiUrl } from "@/lib/api"
import type { UserRole } from "@/lib/types"

function isAllowedRole(value: string | null): value is UserRole {
  return value === "CLIENT" || value === "LAWYER" || value === "ADMIN"
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleParam = searchParams.get("role")
    const role = isAllowedRole(roleParam) ? roleParam : "CLIENT"
    const next = searchParams.get("next")
    const googleUrl = new URL(buildApiUrl("/api/auth/google"))
    googleUrl.searchParams.set("role", role)
    if (next && next.startsWith("/")) {
      googleUrl.searchParams.set("next", next)
    }

    return NextResponse.redirect(googleUrl.toString())
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "Falha ao montar redirecionamento Google."
    const fallback = new URL("/auth/error", request.url)
    fallback.searchParams.set("reason", "frontend_google_start_failed")
    fallback.searchParams.set("details", details)
    return NextResponse.redirect(fallback)
  }
}
