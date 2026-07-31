import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Dev — Onboarding previews' }

/**
 * Local-only index of onboarding UI previews (no login required).
 * Blocked in production by middleware.
 */
export default function DevOnboardingIndexPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const links: { href: string; title: string; blurb: string }[] = [
    {
      href: '/dev/onboarding/auth',
      title: 'Auth modal',
      blurb:
        'Email-only identify → password or compact finish signup (full checklist) → confirm email',
    },
    {
      href: '/dev/onboarding/complete-signup',
      title: 'Finish signup (Google)',
      blurb: 'Agree and continue after Google OAuth (no password)',
    },
    {
      href: '/dev/onboarding/planner',
      title: 'Planner welcome',
      blurb: 'Name → plats → kategori → tillfälle',
    },
    {
      href: '/dev/onboarding/planner-soft-gate',
      title: 'Planner soft-gate name',
      blurb: 'Name-only step after save/request while logged in',
    },
    {
      href: '/dev/onboarding/provider',
      title: 'Provider onboarding',
      blurb: 'Listing wizard only → publish (no name/bio)',
    },
  ]

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-12">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#FF6B35]">
        Local preview
      </p>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#222222]">
        Onboarding flows
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-[#6a6a6a]">
        No login. Nothing is saved. Production blocks these routes.
      </p>

      <ul className="mt-8 space-y-3">
        {links.map(link => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-2xl border border-[#dddddd] px-5 py-4 transition hover:border-[#222222]"
            >
              <p className="text-[16px] font-semibold text-[#222222]">{link.title}</p>
              <p className="mt-1 text-[13px] text-[#6a6a6a]">{link.blurb}</p>
              <p className="mt-2 font-mono text-[12px] text-[#6a6a6a]">{link.href}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[13px] text-[#6a6a6a]">
        <Link href="/" className="font-medium text-[#222222] underline underline-offset-2">
          ← Back to home
        </Link>
      </p>
    </main>
  )
}
