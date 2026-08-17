import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Användarvillkor',
  description: 'Villkor för användning av Gigtorget — marknadsplatsen för festunderhållning i Stockholm.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] px-4 py-10">
      <div className="mx-auto max-w-sm">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[#6A6A6A] hover:text-[#222222]">← Tillbaka</Link>
          <h1 className="mt-2 text-2xl font-bold text-[#222222]">Användarvillkor</h1>
          <p className="text-sm text-[#6A6A6A] mt-1">Senast uppdaterad: maj 2026</p>
        </div>

        <div className="space-y-6 text-sm text-[#222222] leading-relaxed">

          <section>
            <h2 className="font-semibold mb-2">Om tjänsten</h2>
            <p className="text-[#6A6A6A]">Gigtorget är en marknadsplats som kopplar samman arrangörer med talanger i Stockholm. Vi tillhandahåller plattformen — alla avtal om tjänster och betalning sker direkt mellan arrangör och talang.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Konton</h2>
            <p className="text-[#6A6A6A]">Du ansvarar för att hålla din inloggningsinformation säker. Du måste vara minst 18 år för att skapa ett konto. Falsk eller vilseledande information är inte tillåten.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">För talanger</h2>
            <ul className="text-[#6A6A6A] space-y-1 list-disc list-inside">
              <li>Du ansvarar för att din profil är korrekt och aktuell</li>
              <li>Du ansvarar för att leverera den tjänst du lovar</li>
              <li>Betalning och avtal hanteras direkt med arrangören</li>
              <li>Vi förbehåller oss rätten att ta bort profiler som bryter mot våra riktlinjer</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">För arrangörer</h2>
            <ul className="text-[#6A6A6A] space-y-1 list-disc list-inside">
              <li>Du ansvarar för att ge korrekt information i din förfrågan</li>
              <li>En skickad förfrågan är inte ett bindande avtal förrän talangen accepterar</li>
              <li>Eventuella tvister löses direkt med talangen</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Innehåll</h2>
            <p className="text-[#6A6A6A]">Du behåller äganderätten till det innehåll du publicerar. Genom att ladda upp bilder eller text ger du Gigtorget rätt att visa det på plattformen. Stötande, olagligt eller vilseledande innehåll är förbjudet.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Ansvarsbegränsning</h2>
            <p className="text-[#6A6A6A]">Gigtorget är en plattform och inte part i avtalen mellan arrangörer och talanger. Vi ansvarar inte för kvaliteten på utförda tjänster, uteblivna bokningar eller tvister mellan användare.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Ändringar</h2>
            <p className="text-[#6A6A6A]">Vi kan uppdatera dessa villkor. Vid väsentliga ändringar informerar vi dig via e-post. Fortsatt användning av tjänsten innebär att du godkänner de nya villkoren.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Kontakt</h2>
            <p className="text-[#6A6A6A]">Frågor om villkoren? Kontakta oss på <a href="mailto:hej@festen.se" className="text-[#FF2E8A] hover:underline">hej@festen.se</a></p>
          </section>

        </div>
      </div>
    </main>
  )
}
