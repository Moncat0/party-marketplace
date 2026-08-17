import { formatCategoryFromSlug, resolveCategorySlug } from '@/lib/categories'

export type ServiceShareInput = {
  id: string
  title: string | null
  city: string | null
  category_slug?: string | null
  category_tags?: string[] | null
  /** Absolute origin, e.g. window.location.origin */
  origin: string
}

export type ServiceSharePayload = {
  title: string
  text: string
  url: string
}

/** Build Web Share / clipboard payload for a service listing. */
export function buildServiceSharePayload(input: ServiceShareInput): ServiceSharePayload {
  const title = input.title?.trim() || 'Min tjänst'
  const url = `${input.origin.replace(/\/$/, '')}/tjanster/${input.id}`
  const category =
    formatCategoryFromSlug(
      resolveCategorySlug({
        category_slug: input.category_slug,
        category_tags: input.category_tags,
      })
    ) ?? 'Tjänst'
  const city = input.city?.trim() || 'Stockholm'

  const text = `Kolla in ${title} på Gigtorget\n${category} i ${city}.\n\n${url}`

  return {
    title: `${title} | Gigtorget`,
    text,
    url,
  }
}

export type ShareResult = { method: 'native' | 'copy'; shared: boolean }

/**
 * Native share sheet when available; otherwise copy the full message (incl. URL).
 * Returns whether the user completed a share/copy (native cancel → shared: false).
 */
export async function shareServiceListing(input: ServiceShareInput): Promise<ShareResult> {
  const payload = buildServiceSharePayload(input)

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      })
      return { method: 'native', shared: true }
    } catch (err) {
      // User dismissed the sheet — not an error
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { method: 'native', shared: false }
      }
      // Fall through to clipboard
    }
  }

  await navigator.clipboard.writeText(payload.text)
  return { method: 'copy', shared: true }
}
