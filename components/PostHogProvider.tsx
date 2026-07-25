'use client'

// PostHog is now initialised only after cookie consent is given.
// See components/CookieBanner.tsx for the init logic.

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
