/**
 * Shared marketplace chrome — keep every top nav (marketplace, host, account,
 * wizard) on the same height, logo size, and side gutters.
 * Change these in one place only.
 */
export const siteChromePad =
  'w-full px-4 min-[375px]:px-6 min-[950px]:px-8 min-[1440px]:px-12'

/** Canonical bar height — 80px default, 96px on wide viewports (Airbnb). */
export const siteHeaderHeight = 'h-20 min-[1440px]:h-24'

/** Default header row (logo · optional center · right chrome). */
export const siteHeaderRow = `relative flex items-center ${siteHeaderHeight}`

/** @deprecated Prefer `BrandLogo` — text wordmark class kept for rare fallbacks. */
export const siteLogoClass = 'text-xl font-bold tracking-tight text-primary'
