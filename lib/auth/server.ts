import { cookies } from "next/headers"
import { authConfig } from "@/lib/auth/config"
import { buildApiUrl } from "@/lib/api"

export type AuthenticatedUser = {
  id: string
  email: string
  role: "CLIENT" | "LAWYER" | "ADMIN"
  fullName: string
  status: string
  isEmailVerified: boolean
  avatarUrl: string | null
  state: string | null
  city: string | null
  phone: string | null
  isActive: boolean
  profile: Record<string, unknown> | null
}

export async function getSessionTokenFromCookies() {
  const cookieStore = await cookies()
  return cookieStore.get(authConfig.sessionCookieName)?.value || null
}

async function fetchBackend<T>(path: string, token: string) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as T
}

export async function getCurrentUser() {
  const token = await getSessionTokenFromCookies()
  if (!token) {
    return null
  }

  const payload = await fetchBackend<{ user?: AuthenticatedUser }>("/api/auth/me", token)
  return payload?.user || null
}

export async function getDashboardData<T>(path: string) {
  const token = await getSessionTokenFromCookies()
  if (!token) {
    return null
  }

  return fetchBackend<T>(path, token)
}
