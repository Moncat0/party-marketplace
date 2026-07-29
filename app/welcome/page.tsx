import AccountOnboarding from '@/components/auth/AccountOnboarding'
import { parseWelcomeNext } from '@/lib/profile-completeness'

export const metadata = { title: 'Välkommen till FESTEN.' }

export default function WelcomePage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const nextPath = parseWelcomeNext(searchParams.next) ?? '/'
  return <AccountOnboarding nextPath={nextPath} />
}
