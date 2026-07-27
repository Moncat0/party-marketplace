'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ServiceWizardChrome from '@/components/service-wizard/ServiceWizardChrome'
import {
  isIncompleteService,
  serviceStartedLabel,
} from '@/lib/service-wizard'

type Props = {
  firstName: string
  service: {
    id: string
    title: string | null
    is_published: boolean
    created_at: string
  } | null
  /** Base path for hub actions — `/onboarding` or `/dashboard/listings/new` */
  basePath?: string
  /** First-time onboarding copy */
  mode?: 'onboarding' | 'dashboard'
}

export default function ServiceWizardHub({
  firstName,
  service,
  basePath = '/dashboard/listings/new',
  mode = 'dashboard',
}: Props) {
  const incomplete = isIncompleteService(service)
  const canCreate = !service || !service.is_published
  const flowBase = `${basePath}/flow`

  const heading =
    mode === 'onboarding' && !incomplete
      ? firstName
        ? `Välkommen, ${firstName}`
        : 'Välkommen'
      : firstName
        ? `Välkommen tillbaka, ${firstName}`
        : 'Välkommen tillbaka'

  return (
    <ServiceWizardChrome hideFooter contentClassName="mx-auto w-full max-w-[640px] justify-center">
      <div className="w-full">
        <h1 className="text-[32px] font-semibold tracking-[-0.6px] text-[#222222] sm:text-[40px]">
          {heading}
        </h1>
        {mode === 'onboarding' && (
          <p className="mt-3 text-[16px] text-[#6a6a6a]">
            Skapa din tjänst så att planerare i Stockholm kan hitta och boka dig.
          </p>
        )}

        {incomplete && service && (
          <section className="mt-10">
            <h2 className="text-[18px] font-semibold text-[#222222]">Slutför din tjänst</h2>
            <Link
              href={`${flowBase}?resume=1`}
              className="mt-4 flex items-center gap-4 rounded-2xl border border-[#dddddd] p-4 transition hover:border-[#222222] hover:shadow-sm"
            >
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#f2f2f2] text-[#222222]">
                <ServiceIcon />
              </span>
              <span className="min-w-0 flex-1 text-[16px] font-medium leading-snug text-[#222222]">
                {service.title?.trim()
                  ? service.title
                  : `Din tjänst påbörjad ${serviceStartedLabel(service.created_at)}`}
              </span>
            </Link>
          </section>
        )}

        <section className={incomplete ? 'mt-12' : 'mt-10'}>
          <h2 className="text-[18px] font-semibold text-[#222222]">
            {mode === 'onboarding' && !incomplete ? 'Kom igång' : 'Skapa en ny tjänst'}
          </h2>
          {canCreate ? (
            <Link
              href={`${flowBase}?fresh=1`}
              className="mt-2 flex items-center gap-4 border-b border-[#ebebeb] py-5 transition hover:bg-[#fafafa]"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center text-[#222222]">
                <PlusHouseIcon />
              </span>
              <span className="flex-1 text-[16px] font-medium text-[#222222]">
                Skapa en ny tjänst
              </span>
              <ChevronIcon />
            </Link>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#ebebeb] p-5">
              <p className="text-[15px] text-[#6a6a6a]">
                Du har redan en publicerad tjänst. Just nu kan varje talang ha en tjänst —
                redigera den från Tjänster.
              </p>
              <Button asChild variant="dark" className="mt-4 rounded-xl">
                <Link href="/dashboard/listings">Gå till Tjänster</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </ServiceWizardChrome>
  )
}

function ServiceIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3l8 6v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9l8-6z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function PlusHouseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3l8 6v11a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1V9l8-6z" />
      <path d="M19 3v6M16 6h6" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="text-[#222222]">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
