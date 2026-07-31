'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Legacy URL — send people to the homepage auth modal on the forgot step.
 * Keeps old bookmarks / emails working.
 */
export default function ForgotPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?auth=1&view=forgot&mode=login')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <p className="text-[14px] text-[#6a6a6a]">Öppnar återställning…</p>
    </main>
  )
}
