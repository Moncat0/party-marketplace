import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'För talanger — erbjud din tjänst',
  description: 'Bli hittad av hundratals arrangörer i Stockholm. Skapa din profil gratis och börja ta emot bokningsförfrågningar idag.',
}

const steps = [
  {
    number: '01',
    emoji: '✍️',
    title: 'Skapa din profil',
    description: 'Berätta vad du erbjuder, ladda upp dina bästa foton och sätt ditt pris. Det tar mindre än 10 minuter.',
  },
  {
    number: '02',
    emoji: '🔍',
    title: 'Bli hittad',
    description: 'Din profil syns direkt för arrangörer i Stockholm som söker just din typ av tjänst.',
  },
  {
    number: '03',
    emoji: '📩',
    title: 'Ta emot förfrågningar',
    description: 'Arrangörer skickar förfrågningar direkt till dig. Du väljer själv vilka du vill acceptera.',
  },
  {
    number: '04',
    emoji: '💸',
    title: 'Gör det du älskar',
    description: 'Chatta med arrangören, stäm av detaljer och leverera. Betalning hanteras säkert via FESTEN.',
  },
]

const perks = [
  {
    emoji: '🆓',
    title: 'Enkel prissättning',
    description: 'Du sätter priset, vi tar en liten serviceavgift. Inga dolda kostnader.',
  },
  {
    emoji: '💳',
    title: 'Säker betalning',
    description: 'Betalning hanteras via Stripe. Du får dina pengar direkt till ditt konto.',
  },
  {
    emoji: '⭐',
    title: 'Bygg ditt rykte',
    description: 'Samla recensioner och visa upp dina betyg för framtida kunder.',
  },
  {
    emoji: '🎯',
    title: 'Rätt målgrupp',
    description: 'Arrangörer som söker på FESTEN. vet vad de vill ha — kvalificerade leads.',
  },
]

const faqs = [
  {
    q: 'Kostar det något att vara med?',
    a: 'Det är gratis att skapa profil. Vi tar en serviceavgift på 20% per genomförd betalning — du betalar inget om du inte tjänar.',
  },
  {
    q: 'Vem kan ansöka?',
    a: 'Alla som erbjuder tjänster till events i Stockholm — artister, fotografer, kockar, makeupartister, DJ:s och mer.',
  },
  {
    q: 'Hur hanteras betalning?',
    a: 'Via Stripe Connect. Du ansluter ditt bankkonto en gång, sen sköter FESTEN. betalningsflödet automatiskt.',
  },
  {
    q: 'Kan jag avböja förfrågningar?',
    a: 'Absolut. Du ser all information om eventet innan du svarar, och väljer själv om du vill acceptera eller avböja.',
  },
]

export default function ForTalangerPage() {
  return (
    <main className="min-h-screen bg-[#FFF8F3]">

      {/* Nav */}
      <header className="border-b border-[#E8E3DC] bg-[#FFF8F3]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-[#1A1A2E]">FESTEN.</Link>
          <nav className="flex items-center gap-6">
            <Link href="/sa-funkar-det" className="text-sm text-[#717171] hover:text-[#1A1A2E] transition-colors">
              För arrangörer
            </Link>
            <Link href="/" className="text-sm text-[#717171] hover:text-[#1A1A2E] transition-colors">
              Bläddra
            </Link>
            <Link
              href="/onboarding"
              className="rounded-xl bg-[#FF6B35] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
            >
              Skapa din profil
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <p className="text-6xl mb-6">🎤</p>
        <h1 className="text-5xl font-bold text-[#1A1A2E] leading-tight mb-5 max-w-2xl mx-auto">
          Bli hittad av hundratals arrangörer
        </h1>
        <p className="text-lg text-[#717171] leading-relaxed max-w-xl mx-auto mb-10">
          Skapa din profil på FESTEN. och börja ta emot bokningsförfrågningar från arrangörer i Stockholm — helt gratis.
        </p>
        <Link
          href="/onboarding"
          className="inline-block rounded-xl bg-[#FF6B35] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors"
        >
          Skapa din profil gratis
        </Link>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-4 gap-6 relative">
          <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-[#E8E3DC] hidden lg:block" />
          {steps.map((step, i) => (
            <div key={i} className="relative bg-white rounded-2xl border border-[#EBEBEB] p-6 text-center hover:shadow-sm transition-shadow">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#FFF8F3] border border-[#E8E3DC] mb-4 mx-auto">
                <span className="text-2xl">{step.emoji}</span>
              </div>
              <span className="block text-xs font-bold text-[#FF6B35] mb-2 tracking-wide">{step.number}</span>
              <h2 className="font-bold text-[#1A1A2E] mb-2">{step.title}</h2>
              <p className="text-sm text-[#717171] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-8 text-center">Varför FESTEN.?</h2>
        <div className="grid grid-cols-4 gap-6">
          {perks.map((perk, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
              <p className="text-3xl mb-3">{perk.emoji}</p>
              <p className="font-bold text-[#1A1A2E] mb-2">{perk.title}</p>
              <p className="text-sm text-[#717171] leading-relaxed">{perk.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-[#1A1A2E] px-12 py-14 flex items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Redo att börja?</h2>
            <p className="text-white/60">Skapa din profil gratis — det tar mindre än 10 minuter.</p>
          </div>
          <Link
            href="/onboarding"
            className="flex-shrink-0 rounded-xl bg-[#FF6B35] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#e55a26] transition-colors whitespace-nowrap"
          >
            Skapa din profil gratis
          </Link>
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
            <Link href="/sa-funkar-det" className="text-xs text-[#717171] hover:text-[#1A1A2E] transition-colors">För arrangörer</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
