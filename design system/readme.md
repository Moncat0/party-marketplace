# Gigtorget Design System

Gigtorget is a marketplace that connects people planning events with vendors and venues — caterers, photographers, musicians, party spaces. Product copy from the brand kit: "Gigtorget connects you with the best vendors and venues. So you can focus on what matters." The tone is upbeat, casual and trustworthy — like a friend who already knows the best people to call.

## Sources
- `uploads/Gigtorget monogram logo .svg`, `uploads/Gigtorget wordmark logo .svg` — brand logos
- `uploads/Gigtorget colorpalette.svg` — core 4-color palette (exported from Coolors.co)
- `uploads/Typography system gigtorget.png` — headline/body/handwritten type system reference
- `uploads/gigtorget-tone-of-voice-guide-sv.md` — tone of voice guide (Swedish original)
- GitHub: [Moncat0/party-marketplace](https://github.com/Moncat0/party-marketplace) — now connected in-repo:
  - Live marketing page: `/for-talanger` (`components/marketing/supply/`)
  - Curated Claude summary: `docs/design-system/marketing/DESIGN.md`
  - Interactive playground: `/dev/design-lab`
  - Marketplace UI patterns also borrow Airbnb structure (search pill, 3/2 listing cards) with Gigtorget tokens

## Index
- `styles.css` — root stylesheet, imports everything in `tokens/`
- `tokens/` — colors, typography, spacing, radius, shadows/motion
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Foundations, Brand groups in the Design System tab)
- `assets/logos/` — monogram + wordmark SVGs
- `components/core/` — Button, IconButton, Badge, Tag, Card
- `components/forms/` — Input, Select, Checkbox, Radio, Switch
- `components/feedback/` — Dialog, Tooltip, Toast
- `components/navigation/` — Tabs
- `ui_kits/marketplace/` — click-through recreation of the Gigtorget vendor marketplace (home/browse, vendor profile, booking request, host dashboard)
- `SKILL.md` — portable skill file for using this system in Claude Code

### Intentional additions
No component source was accessible (repo not connected), so this system authors a standard primitive set sized to a two-sided marketplace: Button, IconButton, Badge, Tag, Card, Input, Select, Checkbox, Radio, Switch, Dialog, Tooltip, Toast, Tabs. Treat these as a reasonable starting kit, not a copy of the real product's inventory — replace/extend once the codebase is connected.

## Content fundamentals
Source: `uploads/gigtorget-tone-of-voice-guide-sv.md` (Swedish, original language — summarized here in English).

- **Core idea**: Gigtorget is the most self-assured voice at the party — and it talks to everyone the same way. No separate "planner voice" and "vendor voice"; one personality, aimed in every direction. Gigtorget is simply a fan of good parties, which is what holds the voice together no matter who's reading. The confidence isn't American-style hype — it's Swedish: dry, direct, calmly sure of itself. Gigtorget doesn't brag, it just *knows*, and says so briefly.
- **Five principles**:
  1. Outcome first, always — lead with the result, not the process. Not "your booking has been registered" but "Booked. It's yours."
  2. A fan of the party, not of one side — Gigtorget roots for good parties happening, equally for the person hiring and the person hired.
  3. Short sentences, ordinary words — confidence doesn't need complicated phrasing. No "we would like to inform you that." Just say the thing.
  4. Reassuring, not overhyped — the confidence is in *how* something is said, not in promising more than is true. No "guaranteed," no invented promises.
  5. Serious things get a still face — money, cancellations, disputes, safety, data: the tone settles down here. Still warm, still direct, but no jokes. This is where trust is won or lost.
- **Scale** (what Gigtorget leans toward vs. avoids): confident, not humble/apologetic; dry and calm, not hyped-up with exclamation points; personal ("you"), not institutional/"dear customer"; playful as a baseline, serious when it counts (never jokey around money/safety); direct and punchy, not long-winded or over-explained.
- **Word choices**: favors words like *booked, yours, done, found, ready, let's go, for real, right here, official, in*. Avoids *please, we would like to inform you that, in order to, in accordance with, dear customer, at this time*, and saves *unfortunately* for things that are actually unfortunate — don't spend it needlessly.
- **Writing habits**: short sentences over compound ones; one exclamation point does more than three — use sparingly so it means something; always address the reader as "you," never an impersonal or formal register; no bureaucratic hedge phrases ("we believe," "we are pleased to," "we regret to inform").
- **Volume comes down for**: payments and payouts, cancellations and disputes, safety/trust/data, suspended accounts or policy violations, real customer-support problems. Here: still direct, still warm, zero jokes, zero exclamation points — confidence here means clarity, not personality.
- **The simple test**: before publishing, ask "Would the life of the party say it like this?" If it sounds like a form, a policy, or an apology, it's not Gigtorget yet. If it sounds like someone genuinely excited this party is happening — ship it.
- **Examples** (translated from the guide's touchpoint bank):
  - New booking request: not "You have a new booking request" — instead "Someone wants to book YOU for their party."
  - Booking confirmed (planner): not "Your booking has been confirmed" — instead "Booked. It's yours for the night."
  - Vendor welcome email: not "Welcome to Party Marketplace. Please complete your profile to get started" — instead "Let's go. Load up your best material — this is your stage."
  - Payout sent: not "Your payment has been processed" — instead "Paid. 1,200 kr is on its way to your account."
  - Booking cancelled: not "We regret to inform you that your booking has been cancelled" — instead "The booking's cancelled. Here's what happens next."
  - Empty search results: not "No results found for your search" — instead "Nothing here yet — try another search."
  - 404 page: not "Page not found" — instead "This one's not on the guest list."
- **Emoji**: none seen in source material. Don't add them.

## Visual foundations
- **Color**: four-color core palette — pink `#ff2e8a` (primary/energy), orange `#ff6a00` (secondary/accent), ink `#111111` (text, borders, headlines), cream `#fff3e6` (base surface/background). Cream is the default page background, not white — white is reserved for cards/inputs sitting on cream. Color is used boldly and flat: solid fills, not gradients.
- **Type**: three-layer system.
  1. **Headlines** (Anton) — bold, loud, condensed, all caps, tight line-height. Used for hero statements and section titles.
  2. **UI/body** (Quicksand) — clean, clear, rounded geometric sans for all interface copy, paragraphs, and buttons.
  3. **Handwritten** (Caveat) — the "personality layer." Used sparingly, like a handwritten note, for asides and trust markers ("Chef's pick", "Always a vibe"). Never used for functional UI text.
- **Spacing**: 4px base unit scaling to 4/8/12/16/20/24/32/40/48/64/80/96.
- **Backgrounds**: flat cream or white; no photography treatments defined yet, no textures or patterns in the source kit. Full-bleed color blocks (as in the palette export) are the closest motif to a "background" — treat solid color panels as a legitimate hero/section-break device.
- **Borders & shape**: bold 2px black outlines are a signature move — buttons, cards, and badges are commonly black-outlined rather than borderless. Corner radii are medium (10px buttons/inputs, 16px cards), not sharp and not fully rounded, except pills (tags, badges) which go fully round.
- **Shadow**: prefer a flat, offset "poster" shadow (`3-8px` hard offset, no blur, black) over soft blurred shadows — matches the bold graphic feel of the logo and palette export. A soft blurred shadow token exists for quieter surfaces (dropdowns, tooltips) where a hard shadow would be too loud.
- **Motion**: fast and a little springy — 120–200ms, with a bounce easing on press/toggle interactions (buttons scale down on press, switches thumb-slide with overshoot). No slow, cinematic transitions.
- **Hover/press states**: hover slightly darkens the fill (brightness ~0.94) or lifts a card (shadow grows, card shifts up-left 2px); press scales content down to ~0.95. No color inversion on hover.
- **Transparency/blur**: used minimally — only for modal scrims (45% black overlay). No frosted-glass/backdrop-blur surfaces in the source material.
- **Imagery**: no photography or illustration assets were provided. Vendor/venue photos in the UI kit are placeholders — swap in real photography (warm, natural light tone would suit the brand voice) once available.

## Iconography
No icon set, icon font, or SVG icon library was included in the uploaded brand kit, and the codebase wasn't accessible to check its own icon usage. The UI kit below substitutes **Lucide** icons (CDN, matching a clean, medium-stroke line style that pairs well with Quicksand) for functional icons (search, heart, calendar, arrow). This is a flagged substitution — replace with Gigtorget's real icon set once available. No emoji or unicode-glyph icons are used anywhere in the brand material or this system.

## Components
Core: **Button**, **IconButton**, **Badge**, **Tag**, **Card**
Forms: **Input**, **Select**, **Checkbox**, **Radio**, **Switch**
Feedback: **Dialog**, **Tooltip**, **Toast**
Navigation: **Tabs**

## UI kits
- `ui_kits/marketplace/` — Browse (search + filter vendors/venues), Vendor profile (tabs, packages, reviews, booking CTA), Booking request (form + confirmation dialog), Host dashboard (incoming requests). Built from the brand kit only (no product screens were available) — these are original layouts using the visual foundations above, not a copy of an existing screen. Revisit once the codebase or Figma is connected.

## Caveats
- The GitHub repo was not connected for this build, so no real product screens, component inventory, or existing UI patterns informed this system — everything here is built from the 4 brand-kit files only.
- No icon set or photography was supplied — icons substituted from Lucide (flagged above), imagery left as placeholders.
- Fonts are loaded from Google Fonts (Anton, Quicksand, Caveat) as the closest available match to the typography reference image — no original font files were provided to confirm exact typefaces.

**Ask**: connect the `Moncat0/party-marketplace` repo (or a Figma file) so the UI kit can be rebuilt from real screens instead of original layouts, and share icon/photography assets if they exist — then I can bring this system in line with the actual product in one more pass.
