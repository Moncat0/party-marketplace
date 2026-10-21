import { CATEGORIES } from '@/lib/categories'
import { PLATFORM_FEE_PERCENT } from '@/lib/platform-fee'

/** Hero photography — files live in `public/images/supply/`. */
export const SUPPLY_HERO_PHOTOS = [
  { src: '/images/supply/hero-dj.png', label: 'DJ' },
  { src: '/images/supply/hero-chef.png', label: 'Catering' },
  { src: '/images/supply/hero-band.png', label: 'Musik & Artister' },
  { src: '/images/supply/hero-makeup.png', label: 'Makeup' },
] as const

export const SUPPLY_BENEFITS = [
  {
    title: 'Visa upp ditt arbete',
    description:
      'Ladda upp bilder, beskriv dina tjänster och sätt dina priser — precis som en portfolio.',
    icon: 'portfolio' as const,
  },
  {
    title: 'Recensioner som syns',
    description:
      'Samla omdömen från riktiga kunder direkt på din sida, synliga för alla som hittar dig.',
    icon: 'star' as const,
  },
  {
    title: 'En länk att dela överallt',
    description:
      'Lägg din Gigtorget-sida i Instagram-bion, i offerter eller i nästa DM till en kund.',
    icon: 'link' as const,
  },
  {
    title: 'Inga startavgifter',
    description: 'Det kostar ingenting att skapa din sida. Du betalar aldrig för att synas.',
    icon: 'free' as const,
  },
] as const

export const SUPPLY_STEPS = [
  {
    badge: 'STEG 1',
    title: 'Bygg din sida',
    description: 'Lägg till bilder av ditt arbete, beskriv dina tjänster och sätt dina priser.',
    mock: 'profile' as const,
  },
  {
    badge: 'STEG 2',
    title: 'Ta emot förfrågningar',
    description: 'Kunder skickar förfrågningar direkt till dig. Du väljer själv vilka du svarar på.',
    mock: 'requests' as const,
  },
  {
    badge: 'STEG 3',
    title: 'Skicka en offert',
    description: 'Svara i chatten och skicka ett pris direkt — inget krångel med separata mejl.',
    mock: 'offer' as const,
  },
  {
    badge: 'STEG 4',
    title: 'Bli bokad',
    description: 'Kunden bekräftar din offert och bokningen är klar. Ni kommunicerar direkt i chatten — du sköter resten.',
    mock: 'paid' as const,
  },
] as const

export const SUPPLY_FEATURES = [
  {
    badge: 'DIN SIDA',
    title: 'Bygg en sida som säljer åt dig',
    description:
      'Bildgalleri, priser och tjänster — allt på en egen delbar länk. Recensionerna byggs upp av sig själv, bokning efter bokning.',
    placeholder: 'Skärmdump: profilsida med bildgalleri, priser och recensioner',
    size: 'large' as const,
  },
  {
    badge: 'KOMMUNIKATION & BOKNING',
    title: 'Sköt hela affären på ett ställe',
    description:
      'Chatt, offerter och schema — allt samlat på ett ställe. Inget som studsar mellan mejl och SMS.',
    placeholder: 'Skärmdump: chatt, offert och förfrågningslista',
    size: 'small' as const,
  },
  {
    badge: 'BETALNING',
    title: 'Trygg betalning, varje gång',
    description: 'Kunden betalar via Stripe. Pengarna går till ditt konto när jobbet är klart.',
    placeholder: 'Skärmdump: bokning betald via Stripe',
    size: 'small' as const,
  },
] as const

export const SUPPLY_CATEGORY_LABELS = CATEGORIES.map(c => c.label)

export const SUPPLY_FAQS = [
  {
    q: 'Kostar det något?',
    a: 'Nej, det är helt gratis att skapa din sida på Gigtorget. Ingen startavgift, ingen månadskostnad. Vi tar en liten avgift på 90 kr per genomförd bokning — detta är endast för att kunna hålla tjänsten igång för dig.',
  },
  {
    q: 'Vem kan skapa en sida? Behöver jag ha erfarenhet?',
    a: 'Alla som erbjuder tjänster till fester och event — DJ:s, fotografer, kockar, makeupartister och mer. Det spelar ingen roll om du precis börjat eller jobbat i branschen länge. Det handlar om vad du kan visa upp.',
  },
  {
    q: 'Måste jag ha eget företag?',
    a: 'Vi rekommenderar det starkt — det gör bokföring och skatt betydligt enklare för dig. Men det är inget krav för att skapa en sida på Gigtorget, och vi tar inget ansvar för hur du hanterar din egen beskattning.',
  },
  {
    q: 'Hur tar jag emot bokningar och får betalt?',
    a: 'Kunder skickar förfrågningar direkt till dig i appen. Du väljer vilka du svarar på, skickar en offert i chatten — och om kunden accepterar är bokningen bekräftad. Betalning sköter ni direkt med varandra.',
  },
  {
    q: 'Är Gigtorget bara för Stockholm?',
    a: 'Nej. Du kan skapa din sida oavsett var du är. Just nu är det Stockholm där flest kunder söker, men vi växer vidare — och du vill helst redan vara på plats när vi gör det.',
  },
] as const
