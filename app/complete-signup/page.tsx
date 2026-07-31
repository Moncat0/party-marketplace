import { Suspense } from 'react'
import CompleteSignupClient from './CompleteSignupClient'

export const metadata = { title: 'Slutför registrering' }

export default function CompleteSignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-dvh items-center justify-center bg-white">
          <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
        </main>
      }
    >
      <CompleteSignupClient />
    </Suspense>
  )
}
