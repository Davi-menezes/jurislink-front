import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const errorUrl = new URL("/auth/error", origin)
  errorUrl.searchParams.set("reason", "deprecated_google_callback")
  errorUrl.searchParams.set(
    "details",
    "Este callback do Google foi desativado no frontend. Inicie o login novamente a partir da tela de autenticacao.",
  )

  return NextResponse.redirect(errorUrl.toString())
}
