import { redirect } from 'next/navigation'
import { authEntryUrl, parseAuthIntent } from '@/lib/auth-intent'

type Props = {
  searchParams: { intent?: string; next?: string; error?: string }
}

/**
 * Legacy /signup route — soft-gate to the homepage auth modal instead of a full-page wall.
 */
export default function SignupPage({ searchParams }: Props) {
  redirect(
    authEntryUrl({
      intent: parseAuthIntent(searchParams.intent) ?? undefined,
      next: searchParams.next,
    })
  )
}
