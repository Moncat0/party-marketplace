# Handoff: Festly Supply (Provider) Landing Page

## Overview
Marketing landing page for Festly aimed at service providers (DJs, photographers, caterers, makeup artists, etc.) in Stockholm — pitches "create your page for free, get discovered, get booked, get paid." Includes hero, benefits grid, how-it-works steps, feature showcase, category tags, FAQ, and closing CTA, plus a footer.

## About the Design Files
The bundled file (`Festly Join (Supply).dc.html`) is a **design reference built in HTML** — it renders directly in a browser as a working prototype of layout, copy, and interaction, but it is not production code to copy verbatim. The task is to **recreate this design in the real product's codebase** (`Moncat0/party-marketplace`, a Next.js + Tailwind + shadcn/ui app) using its existing patterns: Tailwind classes instead of inline styles, its `components/ui/*` primitives instead of the placeholder design-system components referenced here, and its own routing/data conventions.

**Important brand note:** this design was built against a placeholder "Festly" design system (orange `#FF6A00` / pink `#FF2E8A` / cream, Anton + Quicksand + Caveat fonts, bold black-outline "poster" style) invented before the real repo was reviewed. The actual product in the repo is branded **"FESTEN."**, uses a single ember-orange primary (`#FF6B35`) on white/neutral Airbnb-style grays, and a single typeface (Plus Jakarta Sans) — no pink, no cream, no hand-drawn accent font, no black outlines. **Do not port the colors/fonts/shadows below into the real app as-is.** Treat this file's layout, copy, and section structure as the design intent; restyle every surface using the app's real tokens (see `app/globals.css`, `tailwind.config.js`) and its real `Button`/`Badge`/`Card` components in `components/ui/`.

## Fidelity
**High-fidelity** for layout, copy, and interaction (hover states, FAQ accordion, hero image crossfade, scroll reveals). **Not fidelity-accurate for color/type/shadow tokens** — see brand note above. Rebuild visuals against FESTEN's real tokens.

## Screens / Views
Single scrolling page, `Festly Join (Supply).dc.html`, sections top to bottom:

1. **Top bar** — logo, centered search pill (Var / Tjänst fields + circular search button), right-side links (Erbjud din tjänst, menu icon, profile icon).
2. **Hero** — two-column: left = eyebrow badge, animated word-by-word headline ("GÖR DET DU ÄLSKAR. FÅ BETALT FÖR DET."), subhead, primary CTA button + handwritten aside ("Tar under 10 minuter"). Right = auto-crossfading photo card (4 example provider photos, 2.5s interval) with an offset color panel behind it and a floating "Alltid en vibe" note card.
3. **Varför Festly? (benefits)** — 4-card grid, icon + title + 1-sentence description each: Visa upp ditt arbete, Recensioner som syns, En länk att dela överallt, Inga startavgifter. Cards get a pink border + lift on hover.
4. **Så funkar det (how it works)** — 4 numbered steps, each with a small mockup illustration (fake profile card, fake booking list, fake chat/offer, fake payment confirmation) + step badge + title + description.
5. **CTA button** (repeated "Skapa din sida – gratis").
6. **Allt du behöver (feature showcase)** — bento grid: one large image slot + copy block ("Din sida"), stacked with two smaller image-slot + copy blocks ("Kommunikation & bokning", "Betalning"). Image slots are empty placeholders (drag-and-drop targets) awaiting real product screenshots.
7. **CTA button** (repeated).
8. **Oavsett vad du erbjuder (categories)** — cream panel with a heading, subhead, and a row of category tag pills (DJ, Fotograf, Musik & Artister, Makeup & Styling, Underhållning, Catering & Kock).
9. **Vanliga frågor (FAQ)** — 9-item accordion (native `<details>`), each with a question, plus/rotate icon, and answer paragraph.
10. **Final CTA banner** — dark full-width panel, heading + subhead + CTA button.
11. **Footer** — dark background, 3-column: brand blurb, category links, info links (Så funkar det, Hjälpcenter, Integritetspolicy, Användarvillkor), copyright line.

## Interactions & Behavior
- Hero photo crossfade: interval-driven opacity swap every 2.5s across 4 images (`heroPhotos` array in the component logic).
- Scroll reveal: sections marked `data-reveal` fade/slide in via `IntersectionObserver` at 15% visibility threshold, one-time (unobserves after firing).
- Card hover: benefit cards lift (`translateY(-5px)`) and gain a pink border + deeper shadow; FAQ items gain a pink border on hover.
- FAQ accordion: native `<details>/<summary>`, plus icon rotates 45° (→ ×) when open.
- Image slots (feature showcase) are drag-and-drop placeholders — replace with real screenshots/product photography before or during implementation.
- Logo height is a tweakable prop (`logoHeight`, 32–120px range) in the prototype's dev tooling — not needed in the real app; just set a fixed logo size.

## State Management
- `heroIndex` — which hero photo is currently shown (auto-advances).
- Static content arrays passed as props/data: `heroPhotos`, `categories`, `faqs` — in the real app these should likely come from CMS/config rather than being hardcoded, at the team's discretion.

## Design Tokens
**Do not use these as final values in FESTEN — see brand note above.** Included only so the prototype's own styling is traceable; copies are in `tokens/*.css`.

Placeholder-system values used in this file:
- Colors: orange `#ff6a00`/`#e05e00`, pink `#ff2e8a`/`#e01f74`, ink `#111111`/`#5c5c5c`, cream `#fff3e6`, border `#e8ddce`.
- Type: Anton (display), Quicksand (body/UI), Caveat (handwritten accents). Sizes 12–88px, see `tokens/typography.css`.
- Radius/shadow: see `tokens/radius.css`, `tokens/shadows.css`.

Real FESTEN tokens to design against instead (from `app/globals.css` / `tailwind.config.js` in the repo):
- Primary: `--color-ember: #ff6b35` (hover `#e55a26`).
- Neutrals: foreground `#222222`, secondary text `#6a6a6a`, surface `#f2f2f2`/`#ebebeb`, divider `#dddddd`, canvas white.
- Font: Plus Jakarta Sans (`--font-jakarta`) for everything — no separate display/handwritten faces.
- Radius: control 8px, card 12px, search pill 32px.
- Existing components to reuse: `components/ui/button.tsx` (variants: default/dark/outline/secondary/ghost/link), `components/ui/badge.tsx`, `components/ui/card.tsx`.

## Assets
- `assets/festly-wordmark.svg` — placeholder wordmark logo used in nav/footer (swap for FESTEN's real logo).
- `uploads/*` — placeholder hero photography (DJ, chef, band, makeup artist) — swap for real/licensed photography.
- Feature-showcase image slots are empty — need real product screenshots.

## Files
- `Festly Join (Supply).dc.html` — the full design reference (open directly in a browser).
- `tokens/*.css` — placeholder design-system tokens referenced by the HTML (for traceability only; do not port into FESTEN as-is).
