import { Suspense } from 'react'
import SetPasswordClient from './SetPasswordClient'

export const metadata = { title: 'Säkra ditt konto — FESTEN.' }

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4">
          <p className="text-[14px] text-[#6a6a6a]">Laddar…</p>
        </main>
      }
    >
      <SetPasswordClient />
    </Suspense>
  )
}
