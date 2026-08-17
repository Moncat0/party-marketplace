---
name: airbnb-marketplace-cards
description: >-
  Airbnb-accurate marketplace listing cards for Gigtorget (Services-style search
  and browse grids). Use when building, auditing, or restyling ListingCard,
  search results grids, homepage rows, or any photo+meta listing tile.
---

# Airbnb marketplace listing cards (Gigtorget)

Primary references (priority order — do not mix values across sources for the same property):

1. **Live audit** — `airbnb.com/s/Stockholm/services` (Jul 2026) ← **source of truth for /sok**
2. **[VoltAgent Airbnb DESIGN.md](airbnb-DESIGN.md)** — Homes/Experiences patterns only
3. Gigtorget brand — pink `#FF2E8A` replaces Rausch for CTAs/hearts/search orb; neutrals stay Airbnb

## Why Gigtorget looked different (Jul 2026 audit)

| Token | We had (wrong) | Live Services search |
|-------|----------------|----------------------|
| Photo aspect | `103 / 100` (~square) | **`3 / 2` landscape** (40 cards vs 7 at 103/100) |
| Photo radius | `20px` | **`24px`** |
| Page max width | 1344–1760 | **`1920px`** (`--explore_max-width`) |
| Inline padding | over-padded | **`24px` → `32px`** |
| Grid columns | ad-hoc breakpoints | **`--svc-grid_columns`: 2 → 3 → 4 → 5** |
| Column gap | 24–32 | **16 → 24 → 32** |
| Row gap | 40 flat | **24 → 32 → 40** |

`103/100` appears on other Airbnb surfaces (e.g. homepage rails) — **not** the Services search grid.

## Services search card — live tokens

| Token | Value |
|-------|--------|
| Photo aspect | `3 / 2` |
| Photo radius | `24px` |
| Image → meta gap | `8px` |
| Title | Optical `14px / 500 / 18px` (+ slight negative tracking) | Live token is 16px Cereal; Jakarta reads larger so we step down |
| Meta lines | `12px / 400 / 16px` · `#6A6A6A` | |
| Heart | `32×32` top-right |

### Meta hierarchy

```
{service title}                 ← titles-medium_16_20
{Category}                      ← theme.localizedTitle e.g. "Photography"
★ {score} · {count}             ← own line; count is bare number (no “reviews”)
Från {price} kr                 ← StructuredDisplayPrice “From …”
```

Data from live `ServiceSearchResult`:
- `listing.descriptions.name` → title
- `listing.themes.primaryTheme…localizedTitle` → category
- `listing.listingRatingStats.overallRatingStats` → `ratingAverage`, `ratingCount`
- `displayPrice.primaryLine` → “From kr 1,000 SEK” + “/ guest”

## Do not confuse with other Airbnb card types

| Product | Aspect | Where |
|---------|--------|--------|
| Homes `property-card` | `1 / 1` | Homes search |
| Experiences | `4 / 5` | Experiences |
| Homepage rails | often `103 / 100` | Explore carousels |
| **Services search** | **`3 / 2`** | **`/s/.../services` ← Gigtorget `/sok`** |

## Implementation checklist

- [ ] Landscape `aspect-[3/2]` + `rounded-[24px]` on media only
- [ ] No card border/shadow — photo clipping carries the shape
- [ ] Reviews never inline with category
- [ ] `/sok` uses `RESULTS_SHELL` (1920), not homepage `HOME_SHELL` (1344)
- [ ] Grid follows `--svc-grid_columns` breakpoints
- [ ] Hover: image scale only — no card lift

## Files

- Card: `components/listings/ListingCard.tsx`
- Results shell/grid: `app/sok/SearchResults.tsx`, `RESULTS_SHELL` in `ListingRow.tsx`
- Full DESIGN.md: [airbnb-DESIGN.md](airbnb-DESIGN.md)
