import { NextRequest, NextResponse } from "next/server"
import { getSessionTokenFromCookies } from "@/lib/auth/server"
import { buildApiUrl } from "@/lib/api"

export async function POST(request: NextRequest) {
  const token = await getSessionTokenFromCookies()
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const formData = await request.formData()
  const response = await fetch(buildApiUrl("/api/upload/avatar"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
