import type { Metadata } from 'next'
import { Anton, Plus_Jakarta_Sans } from 'next/font/google'
import SupplyLanding from '@/components/marketing/supply/SupplyLanding'

const anton = Anton({
  weight: '400',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-supply-display',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-supply-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'For talanger — erbjud din tjänst',
  description:
    'Skapa din sida gratis och bli hittad av arrangorer i Stockholm. Fa forfrågningar, skicka offerter och fa betalt sakert.',
}

/** Provider (supply) marketing landing. */
export default function ForTalangerPage() {
  return (
    <div className={`supply-landing ${anton.variable} ${jakarta.variable}`}>
      <SupplyLanding />
    </div>
  )
}
