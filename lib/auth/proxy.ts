import { buildApiUrl } from "@/lib/api"

export async function proxyToBackend(
  path: string,
  init?: RequestInit,
) {
  return fetch(buildApiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.headers || {}),
    },
  })
}
