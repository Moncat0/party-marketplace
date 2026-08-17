export type HelpRole = 'planner' | 'provider'

export type HelpArticle = {
  slug: string
  role: HelpRole | 'both'
  title: string
  summary: string
  body: string[]
}

export type HelpGuide = {
  title: string
  description: string
  href: string
  /** Soft gradient accent for the card media */
  accent: string
}

export const HELP_GUIDES: HelpGuide[] = [
  {
    title: 'Kom igång som planerare',
    description: 'Hitta talang, spara favoriter och skicka din första förfrågan.',
    href: '/sa-funkar-det',
    accent: 'from-[#FFF0E8] to-[#FFE0D0]',
  },
  {
    title: 'Erbjud din tjänst',
    description: 'Skapa profil, ta emot förfrågningar och växa i Stockholm.',
    href: '/for-talanger',
    accent: 'from-[#F0F0F0] to-[#E8E8E8]',
  },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'kosta-boka',
    role: 'planner',
    title: 'Kostar det något att boka?',
    summary:
      'Det är gratis att skapa konto, spara talanger och skicka förfrågningar. Du betalar först när ni går vidare med en bokning.',
    body: [
      'Det är gratis att skapa konto, spara talanger på din önskelista och skicka förfrågningar på Gigtorget',
      'När du och talangen kommit överens betalar du säkert via plattformen. Du betalar inget förrän bokningen är bekräftad.',
    ],
  },
  {
    slug: 'andra-eller-avboka',
    role: 'planner',
    title: 'Ändra eller avboka en förfrågan',
    summary:
      'Du följer status under Bokningar. Behöver du ändra datum eller avbryta, skriv i chatten eller skicka en ny förfrågan.',
    body: [
      'Öppna Bokningar för att se status på dina förfrågningar — väntar på svar, bekräftad eller avböjd.',
      'Behöver du ändra detaljer innan talangen svarat, skicka en ny förfrågan eller skriv i meddelanden om chatten redan är öppen.',
      'Har ni redan bekräftat bokningen? Kontakta talangen via meddelanden så ni kan lösa ombokning tillsammans.',
    ],
  },
  {
    slug: 'talang-avboker',
    role: 'planner',
    title: 'Om talangen avböjer eller inte kan',
    summary:
      'Då kan du enkelt skicka en ny förfrågan till någon annan på din sparlista — utan kostnad.',
    body: [
      'Om en talang avböjer eller inte kan på ditt datum förlorar du ingenting — förfrågan är gratis.',
      'Gå tillbaka till din önskelista eller sök igen, och skicka en ny förfrågan till en annan talang.',
    ],
  },
  {
    slug: 'svarstid',
    role: 'planner',
    title: 'Hur snabbt svarar talangerna?',
    summary: 'De flesta svarar inom 24 timmar. Du följer statusen under Bokningar och i meddelanden.',
    body: [
      'De flesta talanger svarar inom 24 timmar. Status syns under Bokningar.',
      'När förfrågan accepteras kan ni chatta vidare om detaljer, tider och upplägg.',
    ],
  },
  {
    slug: 'betalning-planerare',
    role: 'planner',
    title: 'När och hur betalar jag?',
    summary:
      'Du betalar säkert via Gigtorget när ni kommit överens. Vi ser till att talangen får sin ersättning.',
    body: [
      'Betalning sker via Gigtorget när bokningen är bekräftad och ni är överens om villkoren.',
      'Du behöver inte betala utanför plattformen. Det skyddar både dig och talangen.',
    ],
  },
  {
    slug: 'spara-favoriter',
    role: 'planner',
    title: 'Spara och dela favoriter',
    summary: 'Lägg talanger i din önskelista och dela listan med vänner eller din partner.',
    body: [
      'Tryck på hjärtat på en profil för att spara till en önskelista.',
      'Du kan skapa flera listor och dela en länk så andra kan se dina favoriter.',
    ],
  },
  {
    slug: 'gratis-profil',
    role: 'provider',
    title: 'Kostar det något att vara med som talang?',
    summary:
      'Det är gratis att skapa profil. Vi tar en serviceavgift på genomförda betalningar — du betalar inget om du inte tjänar.',
    body: [
      'Att skapa och publicera din profil är gratis.',
      'Gigtorget tar en serviceavgift först när en betalning genomförs. Inga bokningar — ingen avgift.',
    ],
  },
  {
    slug: 'skapa-profil',
    role: 'provider',
    title: 'Skapa och publicera din profil',
    summary: 'Följ onboarding-stegen: titel, kategori, foton, beskrivning och pris. Publicera när du är redo.',
    body: [
      'Gå till Erbjud din tjänst och fyll i profilen steg för steg — tjänstetitel, kategorier, foton och prisintervall.',
      'När allt ser bra ut publicerar du profilen så att planerare i Stockholm kan hitta dig.',
    ],
  },
  {
    slug: 'forfragningar',
    role: 'provider',
    title: 'Ta emot och svara på förfrågningar',
    summary: 'Du ser eventinfo innan du svarar, och väljer själv om du vill acceptera eller avböja.',
    body: [
      'Nya förfrågningar syns under Förfrågningar i din översikt.',
      'Läs datum, plats och meddelande innan du accepterar eller avböjer. Du styr själv vilka jobb du tar.',
    ],
  },
  {
    slug: 'utbetalning',
    role: 'provider',
    title: 'Hur fungerar utbetalning?',
    summary: 'Via Stripe Connect. Du ansluter ditt konto en gång, sedan sköter Gigtorget betalningsflödet.',
    body: [
      'Anslut Stripe Connect från din instrumentpanel så utbetalningar kan nå dig.',
      'När en planerare betalar via Gigtorget hanteras flödet automatiskt enligt våra villkor.',
    ],
  },
  {
    slug: 'logga-in',
    role: 'both',
    title: 'Logga in eller skapa konto',
    summary:
      'Logga in med Google, Apple eller e-post. Samma konto fungerar som planerare och talang.',
    body: [
      'Du kan logga in med Google, Apple eller e-post via Logga in i menyn.',
      'Samma konto fungerar både när du bokar och när du erbjuder en tjänst. Byt läge i menyn när du vill.',
    ],
  },
  {
    slug: 'bade-planerare-talang',
    role: 'both',
    title: 'Kan jag både boka och erbjuda tjänster?',
    summary:
      'Ja. Börja som planerare och klicka Erbjud din tjänst när du vill skapa en talangprofil — eller byt läge i menyn.',
    body: [
      'Många använder Gigtorget både för att boka till egna fester och för att erbjuda sin egen tjänst.',
      'Byt till talangläge eller planerarläge från kontomenyn när du behöver byta perspektiv.',
    ],
  },
]

export const HELP_EXPLORE = [
  {
    title: 'Våra community-regler',
    description: 'Hur vi bygger tillit mellan planerare och talanger.',
    href: '/terms',
  },
  {
    title: 'Integritet & säkerhet',
    description: 'Hur vi hanterar dina uppgifter och skyddar ditt konto.',
    href: '/privacy',
  },
]

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find(a => a.slug === slug)
}

export function articlesForRole(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter(a => a.role === role || a.role === 'both')
}
