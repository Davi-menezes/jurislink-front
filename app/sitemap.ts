import { MetadataRoute } from 'next'
import { buildApiUrl } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jurislink.com.br'

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/planos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const response = await fetch(buildApiUrl("/api/public/sitemap"), { cache: "no-store" })
  const payload = response.ok ? await response.json() : null
  const areas = Array.isArray(payload?.areas) ? payload.areas : []
  const lawyers = Array.isArray(payload?.lawyers) ? payload.lawyers : []

  const areaPages: MetadataRoute.Sitemap = areas?.map((area) => ({
    url: `${baseUrl}/buscar?area=${area.slug}`,
    lastModified: new Date(area.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []

  const lawyerPages: MetadataRoute.Sitemap = lawyers?.map((lawyer) => ({
    url: `${baseUrl}/advogado/${lawyer.slug}`,
    lastModified: new Date(lawyer.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })) || []

  return [...staticPages, ...areaPages, ...lawyerPages]
}
