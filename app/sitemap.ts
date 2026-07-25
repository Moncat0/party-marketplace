import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase-server'
import { CATEGORIES } from '@/lib/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('provider_profiles')
    .select('id, created_at')
    .eq('is_published', true)

  const providerUrls: MetadataRoute.Sitemap = (profiles ?? []).map(p => ({
    url: `${siteUrl}/providers/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.map(c => ({
    url: `${siteUrl}/kategori/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/hjalp`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/sa-funkar-det`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/for-talanger`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...categoryUrls,
    ...providerUrls,
  ]
}
