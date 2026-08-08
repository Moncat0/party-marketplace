---
name: festly-design
description: >-
  Festly marketing website design system — pink/orange/cream/ink, Anton /
  Quicksand / Caveat, Airbnb marketplace structure, Swedish tone of voice.
  Use when building or restyling public marketing pages, /for-talanger, design
  lab, or Claude-uploadable brand docs. Not for logged-in app ember chrome.
---

# Festly design

## Read first (priority order)

1. [`docs/design-system/marketing/DESIGN.md`](../../../docs/design-system/marketing/DESIGN.md) — curated Stitch-style summary
2. [`design system/readme.md`](../../../design%20system/readme.md) — full kit index
3. [`design system/tokens/`](../../../design%20system/tokens/) — colors, type, spacing, radius, shadows
4. [`design system/uploads/festly-tone-of-voice-guide-sv.md`](../../../design%20system/uploads/festly-tone-of-voice-guide-sv.md) — Swedish voice (source)
5. Live reference: `/for-talanger` · playground: `/dev/design-lab`

## Non-negotiables

- **Primary** = pink `#FF2E8A` (CTAs, search orb). **Secondary** = orange `#FF6A00`.
- **Cream** `#FFF3E6` for atmosphere; **white** for cards/inputs on cream.
- Type: Anton (display, sparingly) · Quicksand (UI) · Caveat (hand notes only).
- Soft shadows for UI chrome; flat ink offset shadows only for poster/marketing moments.
- Airbnb marketplace bones for browse (pill search, 3/2 photo cards, quiet chrome).
- Voice: Swedish dry confidence, outcome first — one personality for planners and talent.
- App chrome already uses Festly **colors** (pink primary, white canvas) via `app/globals.css`.
- **Do not** pull Anton/Caveat or cream page backgrounds into app tool chrome.
- **Do not** use Airbnb Rausch `#FF385C` — use Festly pink.

## When invoked without a brief

Ask what surface they're building (landing, browse, profile, email), then propose tokens from DESIGN.md and either HTML artifacts or production Tailwind under `.supply-landing` / marketing routes.
