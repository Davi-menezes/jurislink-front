export function getApiBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL,
    "https://jurislink-back.onrender.com",
  ]

  for (const candidate of candidates) {
    const raw = candidate?.trim()
    if (!raw) continue

    try {
      const parsed = new URL(raw)
      const normalized = parsed.toString()
      return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized
    } catch {
      continue
    }
  }

  return "https://jurislink-back.onrender.com"
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const base = getApiBaseUrl()
  return new URL(normalizedPath, `${base}/`).toString()
}
