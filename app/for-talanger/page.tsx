import type { Metadata } from 'next'
import { Anton, Caveat, Quicksand } from 'next/font/google'
import SupplyLanding from '@/components/marketing/supply/SupplyLanding'

const anton = Anton({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-supply-display',
  display: 'swap',
})

const quicksand = Quicksand({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-supply-body',
  display: 'swap',
})

const caveat = Caveat({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-supply-hand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'För talanger — erbjud din tjänst',
  description:
    'Skapa din sida gratis och bli hittad av arrangörer i Stockholm. Få förfrågningar, skicka offerter och få betalt säkert.',
}

/** Provider (supply) marketing landing — visual fidelity to design handoff. */
export default function ForTalangerPage() {
  return (
    <div className={`supply-landing ${anton.variable} ${quicksand.variable} ${caveat.variable}`}>
      <SupplyLanding />
    </div>
  )
}
