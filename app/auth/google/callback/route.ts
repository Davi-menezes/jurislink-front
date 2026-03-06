import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { UserRole } from "@/lib/types"

type GoogleTokenResponse = {
  access_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

type GoogleUserInfoResponse = {
  email?: string
  email_verified?: boolean
  name?: string
}

function parseState(rawState: string | null): { nonce: string; flow: "login" | "signup"; role: UserRole } | null {
  if (!rawState) return null

  try {
    const decoded = Buffer.from(rawState, "base64url").toString("utf-8")
    const parsed = JSON.parse(decoded) as { nonce?: string; flow?: string; role?: string }
    const role = parsed.role === "LAWYER" || parsed.role === "ADMIN" ? parsed.role : "CLIENT"
    const flow = parsed.flow === "signup" ? "signup" : "login"
    if (!parsed.nonce) return null
    return { nonce: parsed.nonce, flow, role }
  } catch {
    return null
  }
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { error: "missing_google_oauth_env" }
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  })

  return (await response.json()) as GoogleTokenResponse
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfoResponse> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  })

  return (await response.json()) as GoogleUserInfoResponse
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const state = parseState(searchParams.get("state"))
  const stateCookie = request.cookies.get("google_oauth_state")?.value

  const cleanupRedirect = (path = "/auth/error") => {
    const response = NextResponse.redirect(`${origin}${path}`)
    response.cookies.delete("google_oauth_state")
    return response
  }

  if (!code || !state || !stateCookie || stateCookie !== state.nonce) {
    console.warn("[google/callback] state inválido ou ausente")
    return cleanupRedirect()
  }

  const redirectUri = `${origin}/auth/google/callback`
  const tokenData = await exchangeGoogleCode(code, redirectUri)
  if (!tokenData.access_token) {
    console.warn("[google/callback] falha ao trocar code por access_token", tokenData.error)
    return cleanupRedirect()
  }

  const userInfo = await getGoogleUserInfo(tokenData.access_token)
  if (!userInfo.email || !userInfo.email_verified) {
    console.warn("[google/callback] email ausente ou não verificado no Google")
    return cleanupRedirect()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[google/callback] envs do Supabase admin ausentes")
    return cleanupRedirect()
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)
  const email = userInfo.email.toLowerCase()

  const { error: createError } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: userInfo.name || email.split("@")[0],
      role: state.role,
    },
  })

  // Ignora conflito caso o usuário já exista no Auth.
  if (createError && !createError.message.toLowerCase().includes("already")) {
    console.warn("[google/callback] erro ao criar usuário no Supabase:", createError.message)
    return cleanupRedirect()
  }

  const { data: magicLinkData, error: magicLinkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (magicLinkError || !magicLinkData.properties?.action_link) {
    console.warn("[google/callback] erro ao gerar magic link:", magicLinkError?.message)
    return cleanupRedirect()
  }

  const tokenHash = magicLinkData.properties.hashed_token
  if (tokenHash) {
    const localCallback = new URL(`${origin}/auth/callback`)
    localCallback.searchParams.set("token_hash", tokenHash)
    localCallback.searchParams.set("type", "magiclink")
    const response = NextResponse.redirect(localCallback.toString())
    response.cookies.delete("google_oauth_state")
    return response
  }

  // Fallback para o action_link padrão do Supabase caso hashed_token não esteja disponível.
  const response = NextResponse.redirect(magicLinkData.properties.action_link)
  response.cookies.delete("google_oauth_state")
  return response
}
