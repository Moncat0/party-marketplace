import { notFound } from 'next/navigation'
import Link from 'next/link'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'

export const metadata = { title: 'Dev — Provider onboarding preview' }

export default function DevProviderOnboardingPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#ffe0d4] bg-[#FFF0EB] px-4 py-2 text-center text-[12px] text-[#222222]">
        Local preview · provider onboarding ·{' '}
        <Link href="/dev/onboarding" className="font-semibold underline underline-offset-2">
          All flows
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden [&_[data-wizard-chrome]]:h-full [&_[data-wizard-chrome]]:max-h-full">
        <ServiceWizard
          previewMode
          userId="00000000-0000-0000-0000-000000000000"
          emailVerified
          hubPath="/dev/onboarding"
          afterSavePath="/dev/onboarding"
          afterPublishPath="/dev/onboarding"
          firstBackPath="/dev/onboarding"
          service={{
            id: '00000000-0000-0000-0000-000000000001',
            title: null,
            description: null,
            category_slug: null,
            category_tags: [],
            occasions: [],
            location_id: 'stockholm',
            photos: [],
            price_range_min: null,
            price_range_max: null,
            is_published: false,
            created_at: new Date().toISOString(),
          }}
        />
      </div>
    </div>
  )
}
