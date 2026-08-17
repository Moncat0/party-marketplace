---
version: beta
name: Gigtorget-marketing-website
description: >-
  Marketing website design system for Gigtorget / Gigtorget public pages. Airbnb
  marketplace structure (search pill, listing cards, soft chrome) with Gigtorget
  brand kit color, type, motion, components, and Swedish tone of voice. Source
  kit: repo `design system/`. Playground: /dev/design-lab. Not for logged-in
  app chrome (ember).
---

# Design System: Gigtorget Marketing Website

**Subject:** Stockholm party-talent marketplace — planners book DJs, chefs, makeup, photo; talent gets discovered.

**Audience:** Arrangörer + talanger evaluating the public site.

**Job:** Warm marketplace (Airbnb bones) with party-poster soul (Gigtorget kit). Marketing website only.

**Signature:** Anton poster headlines + pink pill CTAs / search orb + Caveat vibe notes. Soft marketplace chrome by default; flat offset poster shadow only for expressive marketing moments.

**Canonical kit:** `design system/` (tokens, guidelines, components, `ui_kits/marketplace/`, tone guide).

---

## Sources (what was added)

| File / folder | Role |
|---------------|------|
| `design system/tokens/*` | Colors, type, spacing, radius, shadows/motion |
| `design system/guidelines/*` | Specimen cards (brand, color, type, spacing, borders, motion) |
| `design system/components/*` | Button, IconButton, Badge, Tag, Card, forms, feedback, Tabs |
| `design system/ui_kits/marketplace/` | Browse, vendor profile, booking request, host dashboard |
| `design system/uploads/gigtorget-tone-of-voice-guide-sv.md` | Swedish tone of voice (source language) |
| `design system/assets/logos/` | Wordmark + monogram |
| `design system/readme.md` + `SKILL.md` | Kit index + Claude skill entry |
| `/for-talanger` | Live marketing page already on these tokens |

---

## Visual theme & atmosphere

From Gigtorget brand kit + Airbnb marketplace restraint:

- **Cream** (`#FFF3E6`) is a first-class page atmosphere (bands, soft canvas). **White** sits on cream for cards, inputs, search pill.
- Color is bold and mostly **flat** — solid fills over gradients (hero photo panels may use brand color blocks).
- **Soft, subtle borders** (`#E8DDCE` / 1–1.5px) define most contained UI — Airbnb restraint for browse chrome.
- **Flat offset ink shadows** (`3–8px 0 blur`) reserved for posters, hero moments, expressive cards — not default dropdowns/tooltips.
- **Soft blurred shadows** for quiet elevation (search pill, floating notes, menus).
- Primary voltage: **pink** `#FF2E8A`. Secondary/warmth: **orange** `#FF6A00`.
- No ember `#FF6B35`, no Airbnb Rausch `#FF385C` on shipping marketing pages.

---

## Color palette

### Core four

| Name | Hex | Role |
|------|-----|------|
| Pink | `#FF2E8A` | Primary — CTAs, search orb, active hearts, focus energy |
| Orange | `#FF6A00` | Secondary — stars, warm accents, secondary fills |
| Ink | `#111111` | Text, strong borders when needed |
| Cream | `#FFF3E6` | Atmosphere / alt background |

### Token map (`design system/tokens/colors.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--pink-500` / `--color-primary` | `#FF2E8A` | Primary actions |
| `--pink-600` / `--color-primary-hover` | `#E01F74` | Hover |
| `--pink-700` / `--color-primary-active` | `#B0165C` | Active |
| `--pink-50` | `#FFE6F2` | Soft badges |
| `--orange-500` / `--color-secondary` | `#FF6A00` | Secondary / warning warmth |
| `--orange-50` / `--cream-50` | `#FFF3E6` | Cream surface |
| `--cream-100` | `#FFF8EF` | Sunken / alt cream |
| `--ink-900` | `#111111` | Headlines, body |
| `--ink-500` | `#5C5C5C` | Muted |
| `--ink-300` | `#9A9A9A` | Placeholders |
| `--color-border-subtle` | `#E8DDCE` | Default UI outline |
| `--color-success` | `#1F8A52` | Live / success |
| `--color-danger` | `#D62B2B` | Errors |
| `--white` | `#FFFFFF` | Cards, inputs on cream |

---

## Typography

Three layers — never Inter/Roboto as brand.

| Role | Family | Use |
|------|--------|-----|
| Display | **Anton** | Heroes, section punches. ALL CAPS, tight leading. Sparingly. |
| Body / UI | **Quicksand** 400–700 | Nav, buttons, cards, forms, paragraphs |
| Hand | **Caveat** 500–700 | Personality asides (“Alltid en vibe”). Never functional UI. |

### Scale (`tokens/typography.css`)

| Token | Size | Notes |
|-------|------|-------|
| `--fs-display-xl` | 88px | Hero (→ 44px mobile) |
| `--fs-display-lg` | 64px | |
| `--fs-display-md` | 44px | Section punch |
| `--fs-h1` … `--fs-h3` | 36 / 28 / 22 | Quicksand bold |
| `--fs-body-lg` … `--fs-caption` | 19 / 16 / 14 / 12 | UI density |
| `--fs-hand` / `--fs-hand-lg` | 24 / 34 | Caveat notes |
| `--tracking-display` | 0.5px | Anton |
| `--tracking-eyebrow` | 1.5px | Uppercase badges |

---

## Spacing, radius, borders, elevation

### Spacing (4px base)

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96` → `--space-1` … `--space-24`

### Radius

| Token | Value | Typical use |
|-------|-------|-------------|
| `--radius-sm` | 6px | Small controls |
| `--radius-md` | 10px | Inputs, compact buttons |
| `--radius-lg` | 16px | Cards, floating notes |
| `--radius-xl` | 24px | Large media / photo panels |
| `--radius-pill` | 999px | CTAs, search, badges, tags |

### Borders

- Default contained shapes: **1–1.5px** `--color-border-subtle`
- Strong ink border (`--border-width: 2px`) only when the moment needs poster punch
- Outline button: `1.5px solid var(--color-border-subtle)`

### Shadows (`tokens/shadows.css`)

| Token | Value | When |
|-------|-------|------|
| `--shadow-soft-sm` | `0 2px 8px rgba(17,17,17,0.08)` | Quiet chrome |
| `--shadow-soft-md` | `0 6px 20px rgba(17,17,17,0.10)` | Search pill, floating notes |
| `--shadow-flat-sm/md/lg` | `3/5/8px 3/5/8px 0 #111` | Marketing posters / hero cards only |

### Motion

- Fast + slightly springy: `120–200ms`
- `--ease-standard`: `cubic-bezier(.22,1,.36,1)`
- `--ease-bounce`: `cubic-bezier(.34,1.56,.64,1)` on press/toggle
- Hover: brightness ~0.95; press: scale ~0.95
- Modal scrim only transparency — no frosted glass

---

## Tone of voice (from Swedish guide)

**Core:** Gigtorget is the most self-assured voice at the party — Swedish dry confidence, not US hype. One personality for planners and talent.

**Five principles**
1. Outcome first — “Bokat. Den är din.” not “Din bokning har registrerats.”
2. Fan of the party, not one side
3. Short sentences, ordinary words
4. Reassuring, not overhyped — no fake guarantees
5. Serious topics (money, cancel, safety, data) get a still face — warm, direct, zero jokes

**Favored words:** bokat, din, klar, hittad, redo, kör, på riktigt  
**Avoid:** vänligen, vi vill informera, ärade kund, empty “tyvärr”  
**Emoji:** none  
**Test:** “Would the life of the party say it like this?”

Full Swedish source: `design system/uploads/gigtorget-tone-of-voice-guide-sv.md`

---

## Components (kit inventory)

Primitives authored in `design system/components/`:

**Core:** Button · IconButton · Badge · Tag · Card  
**Forms:** Input · Select · Checkbox · Radio · Switch  
**Feedback:** Dialog · Tooltip · Toast  
**Navigation:** Tabs

### Button (shipping rule)

Pill shape, no heavy border on filled variants. Hover darkens fill.

| Variant | Fill | Notes |
|---------|------|-------|
| `primary` | Pink `#FF2E8A` | Main CTAs (Book, Send, Confirm) |
| `secondary` | Orange `#FF6A00` | Warm alternate |
| `outline` | Transparent + subtle border | Save / secondary |
| `ghost` | Transparent | Tertiary |

Sizes: `sm` / `md` / `lg` — Quicksand 600.

> Note: some kit `.prompt.md` files still say “primary = orange”; **tokens + Button.jsx use pink as primary** — follow tokens.

### Badge / Tag

- **Badge:** soft-tint pill (cream / soft orange / soft pink / success) — status, “Chef's pick”
- **Tag:** outlined filter chip, toggle selected — category rows

### Card

White on cream, `--radius-lg`, soft shadow by default; flat shadow only for poster moments.

### Forms

Cream-friendly inputs, subtle borders, ink focus ring, Quicksand labels.

### Feedback

Dialogs with 45% black scrim; Toast/Tooltip use soft shadow, not flat poster shadow.

---

## Marketplace patterns (Airbnb bones × Gigtorget skin)

### Top nav
- 80px, cream or white bar, Gigtorget wordmark ~32px, Quicksand 600
- Center: search pill · Right: “Erbjud din tjänst” pink pill

### Search pill
- White, `radius-pill`, subtle border + `--shadow-soft-md`
- Segments (Var / Tjänst) · **Pink circular search orb**

### Listing / service card
- Photo-first, Services grid aspect **3/2**, photo radius ~24px
- No heavy card chrome — photo clipping carries shape
- Meta: title · category · ★ rating own line · price
- Heart active = pink

### Floating notes
- Soft chip: border-subtle + soft-md shadow
- Caveat “Alltid en vibe” + SVG star
- Twin: green dot + Quicksand “Ny förfrågan”

### Marketing hero
- Anton uppercase thesis
- One Quicksand support line
- One CTA group + dominant media (pink offset panel OK)
- No stats strips / promo stickers on hero media

### UI kit screens
Browse · Vendor profile · Booking request · Host dashboard → `design system/ui_kits/marketplace/`

---

## Layout

1. Mobile-first 390px  
2. Marketing shell **1280**; dense browse up to **1920**  
3. One job per section  
4. Anton or photography is the anchor — not decorative gradients alone  
5. Cards only when they hold interaction  

---

## Logos & assets

- Wordmark / monogram: `design system/assets/logos/` and `public/images/supply/gigtorget-wordmark.svg`
- On cream: black wordmark · On pink/orange/ink: reversed lockups per `guidelines/brand-on-dark.html`
- Icons: Lucide substituted in kit — replace when Gigtorget icon set exists. No emoji icons.

---

## Do's and don'ts

**Do**
- Pink = action, orange = warmth/rating
- Soft chrome for browse; flat shadow for poster moments only
- Outcome-first Swedish copy
- Remap Airbnb Rausch moments → pink

**Don't**
- Anton on forms, tables, dense UI
- Ember on marketing pages
- Frosted glass / neon / purple SaaS gradients
- Empty star ratings
- Separate “planner voice” vs “vendor voice”

---

## Agent prompt guide

> Build this marketing surface with Gigtorget DESIGN.md: Airbnb marketplace structure (pill search, 3/2 photo cards, 80px nav, soft elevation) + Gigtorget tokens (primary `#FF2E8A`, secondary `#FF6A00`, cream `#FFF3E6`, Anton / Quicksand / Caveat). Primary CTAs are pink pills. Voice: Swedish dry confidence — outcome first. Flat ink shadows only on expressive marketing moments. No ember. No app dashboard chrome.

**Playground:** `/dev/design-lab`  
**Full kit:** `design system/`  
**Live page:** `/for-talanger`
