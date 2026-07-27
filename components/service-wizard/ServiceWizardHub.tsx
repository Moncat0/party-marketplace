'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import ServiceWizardChrome from '@/components/service-wizard/ServiceWizardChrome'
import {
  isIncompleteService,
  serviceStartedLabel,
} from '@/lib/service-wizard'
import { MAX_SERVICES_PER_PROVIDER } from '@/lib/services'

type HubService = {
  id: string
  title: string | null
  is_published: boolean
  created_at: string
}

type Props = {
  firstName: string
  services: HubService[]
  /** Base path for hub actions — `/onboarding` or `/dashboard/listings/new` */
  basePath?: string
  /** First-time onboarding copy */
  mode?: 'onboarding' | 'dashboard'
  maxServices?: number
}

export default function ServiceWizardHub({
  firstName,
  services,
  basePath = '/dashboard/listings/new',
  mode = 'dashboard',
  maxServices = MAX_SERVICES_PER_PROVIDER,
}: Props) {
  const incomplete = services.filter(s => isIncompleteService(s))
  const canCreate = services.length < maxServices
  const flowBase = `${basePath}/flow`

  const heading =
    mode === 'onboarding' && incomplete.length === 0 && services.length === 0
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

        {incomplete.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[18px] font-semibold text-[#222222]">
              {incomplete.length === 1 ? 'Slutför din tjänst' : 'Slutför dina tjänster'}
            </h2>
            <ul className="mt-4 space-y-3">
              {incomplete.map(service => (
                <li key={service.id}>
                  <Link
                    href={`${flowBase}?resume=1&id=${service.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-[#dddddd] p-4 transition hover:border-[#222222] hover:shadow-sm"
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
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={incomplete.length > 0 ? 'mt-12' : 'mt-10'}>
          <h2 className="text-[18px] font-semibold text-[#222222]">
            {mode === 'onboarding' && incomplete.length === 0 && services.length === 0
              ? 'Kom igång'
              : 'Skapa en ny tjänst'}
          </h2>
          {canCreate ? (
            <>
              <p className="mt-1 text-[14px] text-[#6a6a6a]">
                Du kan ha upp till {maxServices} tjänster ({services.length}/{maxServices}).
              </p>
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
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-[#ebebeb] p-5">
              <p className="text-[15px] text-[#6a6a6a]">
                Du har redan {maxServices} tjänster — det är max just nu. Redigera dem från
                Tjänster.
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
      <path d="M12 3l8 6v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9l8-6z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
