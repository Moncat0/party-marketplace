import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Så funkar det — för arrangörer',
  description: 'Hitta och boka lokala artister, fotografer, kockar och mer till ditt kalas i Stockholm. Enkelt, snabbt och gratis.',
}

const steps = [
  {
    number: '01',
    emoji: '🔍',
    title: 'Bläddra bland talanger',
    description: 'Utforska hundratals lokala artister, fotografer, kockar och mer. Filtrera på kategori och hitta exakt det du söker.',
  },
  {
    number: '02',
    emoji: '♡',
    title: 'Spara dina favoriter',
    description: 'Lägg till talanger i din lista och jämför dem i lugn och ro. Dela listan med vänner eller din partner.',
  },
  {
    number: '03',
    emoji: '📩',
    title: 'Skicka en förfrågan',
    description: 'Berätta om ditt event — datum, plats och antal gäster. Talangen svarar direkt i chatten.',
  },
  {
    number: '04',
    emoji: '🎉',
    title: 'Njut av ditt kalas',
    description: 'När talangen accepterat stämmer ni av detaljer i chatten och löser resten direkt.',
  },
]

const faqs = [
  {
    q: 'Kostar det något att boka?',
    a: 'Nej, det är helt gratis att skapa konto och skicka förfrågningar på FESTEN.',
  },
  {
    q: 'Hur snabbt svarar talangerna?',
    a: 'De flesta svarar inom 24 timmar. Du ser statusen på din förfrågan i realtid.',
  },
  {
    q: 'Vad händer om talangen inte kan?',
    a: 'Inga problem — du kan enkelt skicka en ny förfrågan till en annan talang på din lista.',
  },
  {
    q: 'Sker betalningen via FESTEN.?',
    a: 'Ja, du betalar säkert via FESTEN. och vi ser till att talangen får sin ersättning.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#FFF8F3]">

      {/* Nav */}
      <header className="border-b border-[#E8E3DC] bg-[#FFF8F3]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</Link>
          <nav className="flex items-center gap-6">
            <Link href="/for-talanger" className="text-sm text-[#717171] hover:text-[#1A1A2E] transition-colors">
              För talanger
            </Link>
            <Link href="/" className="text-sm text-[#717171] hover:text-[#1A1A2E] transition-colors">
              Bläddra
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              Kom igång gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <p className="text-6xl mb-6">🎊</p>
        <h1 className="text-5xl font-bold text-[#1A1A2E] leading-tight mb-5 max-w-2xl mx-auto">
          Ditt drömkalas på 4 enkla steg
        </h1>
        <p className="text-lg text-[#717171] leading-relaxed max-w-xl mx-auto mb-10">
          FESTEN. kopplar ihop dig med de bästa lokala talangerna i Stockholm. Snabbt, enkelt och gratis.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-[#FF6B35] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
          >
            Skapa konto gratis
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-[#1A1A2E]/20 px-8 py-3.5 text-sm font-semibold text-[#1A1A2E] hover:bg-[#1A1A2E]/5 transition-colors"
          >
            Bläddra utan konto →
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-[#E8E3DC] hidden lg:block" />
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-2xl border border-[#EBEBEB] p-6 text-center hover:shadow-sm transition-shadow">
              <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#FFF8F3] border border-[#E8E3DC] mb-4 mx-auto">
                <span className="text-2xl">{step.emoji}</span>
              </div>
              <span className="block text-xs font-bold text-[#FF6B35] mb-2 tracking-wide">{step.number}</span>
              <h2 className="font-bold text-[#1A1A2E] mb-2">{step.title}</h2>
              <p className="text-sm text-[#717171] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-[#1A1A2E] px-12 py-14 flex items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Redo att planera ditt kalas?</h2>
            <p className="text-white/60">Skapa ett konto gratis och börja bläddra direkt — inga kortuppgifter krävs.</p>
          </div>
          <div className="flex-shrink-0 flex gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Bläddra direkt →
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors whitespace-nowrap"
            >
              Skapa konto gratis
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-8 text-center">Vanliga frågor</h2>
        <div className="grid grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl bg-white border border-[#EBEBEB] p-6">
              <p className="font-semibold text-[#1A1A2E] mb-2">{faq.q}</p>
              <p className="text-sm text-[#717171] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E3DC]">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-[#1A1A2E]">FESTEN.</Link>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-[#717171] hover:text-[#1A1A2E] transition-colors">Integritetspolicy</Link>
            <Link href="/terms" className="text-xs text-[#717171] hover:text-[#1A1A2E] transition-colors">Användarvillkor</Link>
            <Link href="/for-talanger" className="text-xs text-[#717171] hover:text-[#1A1A2E] transition-colors">För talanger</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
