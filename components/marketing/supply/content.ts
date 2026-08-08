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
      'Lägg din Festly-sida i Instagram-bion, i offerter eller i nästa DM till en kund.',
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
    title: 'Bli bokad, få betalt',
    description: 'Kunden betalar via Festly. Pengarna är dina så snart jobbet är klart.',
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

/** FAQ copy from supply handoff — fee wording matches `PLATFORM_FEE_PERCENT` (not the prototype’s 99 kr). */
export const SUPPLY_FAQS = [
  {
    q: 'Kostar det något att skapa min sida?',
    a: `Nej, det är gratis att skapa din sida och bygga din profil på Festly. Vi tar ${PLATFORM_FEE_PERCENT}% i serviceavgift per genomförd betalning — det är så vi kan hålla Festly igång.`,
  },
  {
    q: 'Vem kan skapa en sida?',
    a: 'Alla som erbjuder tjänster till fester och event — DJ:s, fotografer, kockar, makeupartister och mer. Just nu satsar vi extra på Stockholm, så det är där du märker av flest förfrågningar.',
  },
  {
    q: 'Jag har ingen erfarenhet, kan jag ändå skapa en sida?',
    a: 'Absolut. Festly handlar inte om hur många år du jobbat — det handlar om vad du kan visa upp. Lägg upp dina bästa bilder, sätt dina priser och låt kunderna hitta dig.',
  },
  {
    q: 'Måste jag ha eget företag?',
    a: 'Vi rekommenderar det starkt — det gör bokföring och skatt betydligt enklare för dig. Men det är inget krav för att skapa en sida på Festly, och vi tar inget ansvar för hur du hanterar din egen beskattning.',
  },
  {
    q: 'Hur får jag betalt?',
    a: `Kunden betalar när offerten accepteras. Beloppet hålls säkert tills tjänsten är levererad — sen betalas det ut till dig, minus vår serviceavgift på ${PLATFORM_FEE_PERCENT}%.`,
  },
  {
    q: 'Hur fungerar avgiften?',
    a: `Du sätter ditt pris som vanligt. När kunden bokar och betalar drar vi ${PLATFORM_FEE_PERCENT}% — resten går till dig. Inga dolda kostnader, inget du behöver hålla koll på själv.`,
  },
  {
    q: 'Hur tar jag emot bokningar?',
    a: 'Arrangörer skickar förfrågningar direkt till dig i appen. Du väljer själv vilka du vill acceptera.',
  },
  {
    q: 'Kan jag erbjuda tjänster riktade mot barn, som kalas eller barnprogramledare?',
    a: 'Inte just nu. Vi kan i dagsläget inte säkerställa utdrag ur belastningsregistret för dem som är aktiva på Festly, och det är en förutsättning vi inte vill kompromissa med när det gäller barn. Vi jobbar på en lösning för det här, men tills den finns på plats kan vi inte stödja tjänster riktade specifikt mot barn.',
  },
  {
    q: 'Är Festly bara för Stockholm?',
    a: 'Nej. Du kan skapa din sida oavsett var du är. Just nu är det Stockholm där flest arrangörer söker, men vi växer vidare — och du vill helst redan vara på plats när vi gör det.',
  },
] as const
