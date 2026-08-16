import { notFound } from 'next/navigation'
import Link from 'next/link'
import ServiceWizard from '@/components/service-wizard/ServiceWizard'
import {
  isServiceWizardStep,
  type ServiceWizardStep,
} from '@/lib/service-wizard'

export const metadata = { title: 'Dev — Provider onboarding preview' }

type Props = {
  searchParams: { step?: string }
}

export default function DevProviderOnboardingPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV === 'production') notFound()

  const rawStep = searchParams.step
  const step =
    rawStep && isServiceWizardStep(rawStep)
      ? (rawStep as ServiceWizardStep)
      : undefined

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#ffe0d4] bg-[#FFF0EB] px-4 py-2 text-center text-[12px] text-[#222222]">
        Local preview · provider listing wizard (category + tillfällen) ·{' '}
        <Link href="/dev/onboarding" className="font-semibold underline underline-offset-2">
          All flows
        </Link>
        {step ? (
          <span className="ml-2 text-[#6a6a6a]">(?step={step})</span>
        ) : (
          <span className="ml-2 text-[#6a6a6a]">tip: ?step=occasions · ?step=publish</span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden [&_[data-wizard-chrome]]:h-full [&_[data-wizard-chrome]]:max-h-full">
        <ServiceWizard
          previewMode
          previewStep={step}
          userId="00000000-0000-0000-0000-000000000000"
          emailVerified
          hubPath="/dev/onboarding"
          afterSavePath="/dev/onboarding"
          afterPublishPath="/dev/onboarding"
          firstBackPath="/dev/onboarding"
          service={{
            id: '00000000-0000-0000-0000-000000000001',
            // Seed enough to exercise later steps; empty start uses ?step= omit / intro1
            title: step && step !== 'intro1' && step !== 'title' ? 'DJ för fest & bröllop' : null,
            description:
              step === 'photos' ||
              step === 'price' ||
              step === 'publish' ||
              step === 'description'
                ? 'Spellistor, trådlös mick och dansgolv som inte dör. Baserad i Stockholm.'
                : null,
            category_slug:
              !step || step === 'intro1' || step === 'title' || step === 'category'
                ? null
                : 'dj',
            category_tags: ['dj'],
            occasions:
              !step ||
              step === 'intro1' ||
              step === 'title' ||
              step === 'category' ||
              step === 'occasions'
                ? []
                : ['wedding', 'birthday', 'corporate'],
            location_id: 'stockholm',
            photos: [],
            price_range_min: step === 'price' || step === 'publish' ? 4500 : null,
            price_range_max: step === 'price' || step === 'publish' ? 11000 : null,
            is_published: false,
            created_at: new Date().toISOString(),
          }}
        />
      </div>
    </div>
  )
}
