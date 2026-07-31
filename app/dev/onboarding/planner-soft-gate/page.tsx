import { notFound } from 'next/navigation'
import Link from 'next/link'
import AccountOnboarding from '@/components/auth/AccountOnboarding'

export const metadata = { title: 'Dev — Soft-gate name preview' }

export default function DevPlannerSoftGatePreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#ffe0d4] bg-[#FFF0EB] px-4 py-2 text-center text-[12px] text-[#222222]">
        Local preview · soft-gate name ·{' '}
        <Link href="/dev/onboarding" className="font-semibold underline underline-offset-2">
          All flows
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden [&_[data-wizard-chrome]]:h-full [&_[data-wizard-chrome]]:max-h-full">
        <AccountOnboarding nextPath="/tjanster/preview-service-id" previewMode />
      </div>
    </div>
  )
}
