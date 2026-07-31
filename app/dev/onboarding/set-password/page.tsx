import { notFound } from 'next/navigation'
import Link from 'next/link'
import SetPasswordClient from '@/app/set-password/SetPasswordClient'

export const metadata = { title: 'Dev — Set password preview' }

export default function DevSetPasswordPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#ffe0d4] bg-[#FFF0EB] px-4 py-2 text-center text-[12px] text-[#222222]">
        Local preview · set-password ·{' '}
        <Link href="/dev/onboarding" className="font-semibold underline underline-offset-2">
          All flows
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden [&_main]:h-full [&_main]:max-h-full">
        <SetPasswordClient previewMode previewEmail="preview@festen.local" />
      </div>
    </div>
  )
}
