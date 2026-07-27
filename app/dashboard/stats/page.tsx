import { redirect } from 'next/navigation'

export const metadata = { title: 'Min statistik' }

/** Stats folded into /dashboard overview — keep URL friendly. */
export default function StatsPage() {
  redirect('/dashboard')
}
