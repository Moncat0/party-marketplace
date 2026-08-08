import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Integritetspolicy',
  description: 'Hur Festly samlar in, använder och skyddar dina personuppgifter.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#6A6A6A] hover:text-[#222222]">← Tillbaka</Link>
          <h1 className="mt-2 text-2xl font-bold text-[#222222]">Integritetspolicy</h1>
          <p className="text-sm text-[#6A6A6A] mt-1">Senast uppdaterad: maj 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[#222222] leading-relaxed">

          <section>
            <h2 className="font-semibold mb-2">Vem vi är</h2>
            <p className="text-[#6A6A6A]">Festly är en tjänst för att hitta och boka underhållning till evenemang i Stockholm. Vi värnar om din integritet och behandlar dina personuppgifter i enlighet med GDPR (EU:s dataskyddsförordning).</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Vilka uppgifter vi samlar in</h2>
            <ul className="text-[#6A6A6A] space-y-1 list-disc list-inside">
              <li>Namn och e-postadress (vid registrering)</li>
              <li>Profilfoton (om du är talang)</li>
              <li>Bokningsinformation och meddelanden</li>
              <li>Teknisk data som IP-adress och webbläsartyp</li>
              <li>Användningsdata via cookies (med ditt samtycke)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Varför vi samlar in uppgifterna</h2>
            <ul className="text-[#6A6A6A] space-y-1 list-disc list-inside">
              <li>För att tillhandahålla tjänsten och hantera ditt konto</li>
              <li>För att matcha arrangörer med talanger</li>
              <li>För att skicka relevanta e-postnotifikationer</li>
              <li>För att förbättra tjänsten via analys (med samtycke)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Hur länge vi sparar dina uppgifter</h2>
            <p className="text-[#6A6A6A]">Vi sparar dina uppgifter så länge ditt konto är aktivt. Om du avslutar ditt konto raderar vi dina personuppgifter inom 30 dagar.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Dina rättigheter</h2>
            <p className="text-[#6A6A6A] mb-2">Enligt GDPR har du rätt att:</p>
            <ul className="text-[#6A6A6A] space-y-1 list-disc list-inside">
              <li>Få tillgång till de uppgifter vi har om dig</li>
              <li>Rätta felaktiga uppgifter</li>
              <li>Begära att dina uppgifter raderas</li>
              <li>Invända mot behandling av dina uppgifter</li>
              <li>Återkalla ditt samtycke när som helst</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Cookies och analys</h2>
            <p className="text-[#6A6A6A]">Vi använder PostHog för analys av hur tjänsten används. Cookies sätts bara om du godkänner det via vår cookie-banner. Du kan när som helst ändra dina inställningar.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Tredjepartsleverantörer</h2>
            <p className="text-[#6A6A6A]">Vi använder Supabase (databas och autentisering) och Resend (e-post). Dessa leverantörer hanterar data i enlighet med GDPR.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Kontakta oss</h2>
            <p className="text-[#6A6A6A]">Har du frågor om hur vi hanterar dina uppgifter? Kontakta oss på <a href="mailto:hej@festen.se" className="text-[#FF2E8A] hover:underline">hej@festen.se</a></p>
          </section>

        </div>
      </div>
    </main>
  )
}
