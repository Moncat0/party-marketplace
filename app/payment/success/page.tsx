import Link from 'next/link'

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#EBEBEB] p-10 text-center mb-4">
          <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-[#1D9E75]/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">Betalning genomförd!</h1>
          <p className="text-sm text-[#717171] leading-relaxed">
            Din bokning är nu bekräftad och betald. Vi har skickat ett kvitto till din e-post.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href="/planner/bookings"
            className="flex items-center justify-between rounded-2xl bg-[#FF6B35] px-5 py-4 hover:bg-[#e55a26] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-sm font-semibold text-white">Se dina bokningar</span>
            </div>
            <span className="text-white text-sm">→</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-between rounded-2xl bg-white border border-[#EBEBEB] px-5 py-4 hover:bg-[#F7F7F7] transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span className="text-sm font-medium text-[#1A1A2E]">Hitta fler talanger</span>
            </div>
            <span className="text-[#FF6B35] text-sm">→</span>
          </Link>
        </div>
      </div>
    </main>
  )
}
