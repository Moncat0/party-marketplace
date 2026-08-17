import type { Metadata } from 'next'
import {
  Anton,
  Archivo_Black,
  Bebas_Neue,
  Caveat,
  DM_Sans,
  Kalam,
  Nunito,
  Patrick_Hand,
  Plus_Jakarta_Sans,
  Quicksand,
} from 'next/font/google'
import DesignLabClient from './DesignLabClient'

const anton = Anton({ weight: '400', subsets: ['latin', 'latin-ext'], variable: '--lab-anton' })
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--lab-bebas' })
const archivo = Archivo_Black({ weight: '400', subsets: ['latin'], variable: '--lab-archivo' })
const jakartaDisplay = Plus_Jakarta_Sans({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--lab-jakarta-display',
})

const quicksand = Quicksand({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--lab-quicksand',
})
const jakarta = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--lab-jakarta',
})
const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--lab-dm',
})
const nunito = Nunito({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--lab-nunito',
})

const caveat = Caveat({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--lab-caveat' })
const patrick = Patrick_Hand({ weight: '400', subsets: ['latin'], variable: '--lab-patrick' })
const kalam = Kalam({ weight: ['400', '700'], subsets: ['latin'], variable: '--lab-kalam' })

export const metadata: Metadata = {
  title: 'Design lab — marketing website',
  robots: { index: false, follow: false },
}

/** Interactive playground: Airbnb marketplace bones × Gigtorget color/type. */
export default function DesignLabPage() {
  const fontVars = [
    anton.variable,
    bebas.variable,
    archivo.variable,
    jakartaDisplay.variable,
    quicksand.variable,
    jakarta.variable,
    dmSans.variable,
    nunito.variable,
    caveat.variable,
    patrick.variable,
    kalam.variable,
  ].join(' ')

  return (
    <div className={fontVars}>
      <DesignLabClient />
    </div>
  )
}
