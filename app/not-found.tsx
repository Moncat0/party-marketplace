import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-6xl mb-6">🎭</p>
        <h1 className="text-2xl font-bold text-[#222222] mb-2">Sidan hittades inte</h1>
        <p className="text-sm text-[#6A6A6A] mb-8">
          Den här sidan verkar inte finnas. Kanske letade du efter något annat?
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#FF2E8A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#E01F74] transition-colors"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </main>
  )
}
