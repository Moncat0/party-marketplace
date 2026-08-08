import type { Metadata } from 'next'
import HelpCenterClient from './HelpCenterClient'

export const metadata: Metadata = {
  title: 'Hjälpcenter',
  description: 'Hitta svar om bokningar, konton och hur du erbjuder din tjänst på Festly',
}

export default function HelpCenterPage() {
  return <HelpCenterClient />
}
