import { NextRequest, NextResponse } from "next/server"
import { getSessionTokenFromCookies } from "@/lib/auth/server"
import { buildApiUrl } from "@/lib/api"

export async function GET() {
  const token = await getSessionTokenFromCookies()
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const response = await fetch(buildApiUrl("/api/lawyer-profile"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}

export async function POST(request: NextRequest) {
  const token = await getSessionTokenFromCookies()
  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const body = await request.text()
  const response = await fetch(buildApiUrl("/api/lawyer-profile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
    cache: "no-store",
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
