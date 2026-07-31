import { notFound } from 'next/navigation'
import Link from 'next/link'
import AccountOnboarding from '@/components/auth/AccountOnboarding'
import {
  PLANNER_SEARCH_STEPS,
  type PlannerSearchStep,
} from '@/lib/planner-search-wizard'

export const metadata = { title: 'Dev — Planner welcome preview' }

type Props = {
  searchParams: { step?: string }
}

export default function DevPlannerWelcomePreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()

  const step = PLANNER_SEARCH_STEPS.includes(
    searchParams.step as PlannerSearchStep
  )
    ? (searchParams.step as PlannerSearchStep)
    : undefined

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#ffe0d4] bg-[#FFF0EB] px-4 py-2 text-center text-[12px] text-[#222222]">
        Local preview · planner welcome ·{' '}
        <Link href="/dev/onboarding" className="font-semibold underline underline-offset-2">
          All flows
        </Link>
        {step ? (
          <span className="ml-2 text-[#6a6a6a]">(?step={step})</span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden [&_[data-wizard-chrome]]:h-full [&_[data-wizard-chrome]]:max-h-full">
        <AccountOnboarding nextPath="/" previewMode previewStep={step} />
      </div>
    </div>
  )
}
