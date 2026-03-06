import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next")
  const safeNext = next && next.startsWith("/") ? next : null

  const supabase = await createClient()

  // Fluxo OTP (magic link, signup, recovery, etc.)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (error) {
      console.warn("Erro ao verificar OTP no callback:", error.message)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  } else if (code) {
    // Fluxo PKCE (exchange code)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.warn("Erro ao trocar code por sessão no callback:", error.message)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  } else {
    console.warn("Callback sem code e sem token_hash/type")
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.warn("Callback sem usuário após autenticação:", userError?.message)
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  // Verificar se já tem perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.warn("Erro ao buscar perfil no callback:", profileError.message)
  }

  // Se não tem perfil, criar um (OAuth ou verificação)
  if (!profile) {
    const role = user.user_metadata?.role || "CLIENT"
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Usuário"

    const profilePayload = {
      id: user.id,
      full_name: fullName,
      role,
      email: user.email?.toLowerCase() || null,
      email_verified: !!user.email_confirmed_at,
      lgpd_accepted: true,
      lgpd_accepted_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from("profiles").insert(profilePayload)

    // Fallback com chave admin quando a policy impedir o insert via sessão.
    if (insertError) {
      console.warn("Erro ao inserir profile via sessão. Tentando admin fallback:", insertError.message)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const adminClient = createAdminClient(supabaseUrl, serviceRoleKey)
        const { error: upsertError } = await adminClient
          .from("profiles")
          .upsert(profilePayload, { onConflict: "id" })

        if (upsertError) {
          console.warn("Erro ao upsert profile via admin fallback:", upsertError.message)
          return NextResponse.redirect(`${origin}/auth/error`)
        }
      } else {
        return NextResponse.redirect(`${origin}/auth/error`)
      }
    }

    if (safeNext) {
      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    if (role === "LAWYER") {
      return NextResponse.redirect(`${origin}/painel/advogado/perfil`)
    }
    return NextResponse.redirect(`${origin}/painel/cliente`)
  }

  if (safeNext) {
    return NextResponse.redirect(`${origin}${safeNext}`)
  }

  // Se já tem perfil, redirecionar baseado no role
  const userRole = profile?.role || user.user_metadata?.role || "CLIENT"
  if (userRole === "LAWYER") {
    return NextResponse.redirect(`${origin}/painel/advogado`)
  } else if (userRole === "ADMIN") {
    return NextResponse.redirect(`${origin}/painel/admin`)
  } else {
    return NextResponse.redirect(`${origin}/painel/cliente`)
    }

  // Se deu erro, redireciona pro erro
  return NextResponse.redirect(`${origin}/auth/error`)
}
