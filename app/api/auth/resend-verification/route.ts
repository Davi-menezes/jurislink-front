import { NextRequest, NextResponse } from "next/server"
import { proxyToBackend } from "@/lib/auth/proxy"

export async function POST(request: NextRequest) {
  const body = await request.text()
  const response = await proxyToBackend("/api/auth/resend-verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  })

  const payload = await response.json().catch(() => null)
  return NextResponse.json(payload, { status: response.status })
}
