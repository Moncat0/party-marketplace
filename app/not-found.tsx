import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-6xl mb-6">🎭</p>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Sidan hittades inte</h1>
        <p className="text-sm text-[#5F5E5A] mb-8">
          Den här sidan verkar inte finnas. Kanske letade du efter något annat?
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </main>
  )
}
