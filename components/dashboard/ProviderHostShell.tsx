import type { ReactNode } from 'react'
import ProviderHostChrome from '@/components/dashboard/ProviderHostChrome'
import { loadProviderShellData } from '@/components/dashboard/load-provider-shell'

type Props = {
  children: ReactNode
  flush?: boolean
  wide?: boolean
}

/** Auth + host chrome for provider dashboard pages. */
export default async function ProviderHostShell({ children, flush, wide }: Props) {
  const data = await loadProviderShellData()
  return (
    <ProviderHostChrome flush={flush} wide={wide} unreadMessages={data.unreadMessages}>
      {children}
    </ProviderHostChrome>
  )
}
