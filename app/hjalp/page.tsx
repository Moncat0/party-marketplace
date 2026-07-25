import Link from 'next/link'
import type { Metadata } from 'next'
import SettingsSection from '@/components/settings/SettingsSection'
import SettingsButton from '@/components/settings/SettingsButton'
import { settingsTokens as t } from '@/components/settings/tokens'

export const metadata: Metadata = {
  title: 'Hjälpcenter',
  description: 'Vanliga frågor om FESTEN. — boka talanger eller erbjud din tjänst i Stockholm.',
}

const sections = [
  {
    title: 'För dig som planerar fest',
    items: [
      {
        q: 'Kostar det något att boka?',
        a: 'Det är gratis att skapa konto, spara talanger och skicka förfrågningar. Du betalar först när du går vidare med en bokning via FESTEN.',
      },
      {
        q: 'Hur snabbt svarar talangerna?',
        a: 'De flesta svarar inom 24 timmar. Du följer statusen på din förfrågan under Bokningar och i meddelanden.',
      },
      {
        q: 'Vad händer om talangen inte kan?',
        a: 'Då kan du enkelt skicka en ny förfrågan till någon annan på din sparlista — utan kostnad.',
      },
      {
        q: 'Sker betalningen via FESTEN.?',
        a: 'Ja. När ni kommit överens betalar du säkert via FESTEN., och vi ser till att talangen får sin ersättning.',
      },
    ],
  },
  {
    title: 'För dig som erbjuder en tjänst',
    items: [
      {
        q: 'Kostar det något att vara med?',
        a: 'Det är gratis att skapa profil. Vi tar en serviceavgift på genomförda betalningar — du betalar inget om du inte tjänar.',
      },
      {
        q: 'Vem kan vara med?',
        a: 'Alla som erbjuder tjänster till events i Stockholm — artister, fotografer, kockar, makeupartister, DJ:s och mer.',
      },
      {
        q: 'Hur hanteras betalning?',
        a: 'Via Stripe Connect. Du ansluter ditt konto en gång, sedan sköter FESTEN. betalningsflödet automatiskt.',
      },
      {
        q: 'Kan jag avböja förfrågningar?',
        a: 'Absolut. Du ser information om eventet innan du svarar, och väljer själv om du vill acceptera eller avböja.',
      },
    ],
  },
  {
    title: 'Konto & säkerhet',
    items: [
      {
        q: 'Hur loggar jag in?',
        a: 'Du kan logga in med Google, Facebook, Apple eller e-post via Logga in i menyn. Samma konto fungerar både som planerare och talang.',
      },
      {
        q: 'Kan jag både boka och erbjuda tjänster?',
        a: 'Ja. Börja som planerare och klicka Erbjud din tjänst när du vill skapa en talangprofil — eller byt läge i menyn.',
      },
    ],
  },
]

export default function HelpCenterPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 space-y-6">
        <header>
          <p className="text-[14px] font-medium text-[#FF6B35] mb-2">Hjälpcenter</p>
          <h1 className="text-[22px] font-medium leading-[1.18] tracking-[-0.44px] text-[#222222] mb-3">
            Hur kan vi hjälpa dig?
          </h1>
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">
            Här samlar vi vanliga frågor. Mer innehåll kommer — under tiden kan du också läsa{' '}
            <Link href="/sa-funkar-det" className="underline hover:text-[#222222]">
              Så funkar det
            </Link>{' '}
            och{' '}
            <Link href="/for-talanger" className="underline hover:text-[#222222]">
              För talanger
            </Link>
            .
          </p>
        </header>

        {sections.map(section => (
          <SettingsSection key={section.title} title={section.title}>
            <ul className="divide-y" style={{ borderColor: t.colors.hairlineSoft }}>
              {section.items.map(item => (
                <li
                  key={item.q}
                  className="py-4 first:pt-0 last:pb-0"
                  style={{ borderColor: t.colors.hairlineSoft }}
                >
                  <p className="text-[14px] font-medium text-[#222222] mb-1.5">{item.q}</p>
                  <p className="text-[14px] leading-[1.43] text-[#6a6a6a]">{item.a}</p>
                </li>
              ))}
            </ul>
          </SettingsSection>
        ))}

        <SettingsSection title="Hittar du inte svaret?">
          <p className="text-[14px] leading-[1.43] text-[#6a6a6a] mb-5">
            Vi bygger ut hjälpen löpande. Hör gärna av dig via din bokningskonversation eller
            kontosidor.
          </p>
          <Link href="/" className="inline-block">
            <SettingsButton>Tillbaka till FESTEN.</SettingsButton>
          </Link>
        </SettingsSection>
      </div>
    </main>
  )
}
