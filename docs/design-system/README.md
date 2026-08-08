# Design systems — surfaces

App and marketing now share **Festly color tokens**. They still differ in **type, density, and atmosphere**.

## Surfaces

| | **Website (marketing)** | **App (product)** |
|---|---|---|
| Job | Convince, explain, acquire | Complete tasks daily |
| Feel | Poster, generous, expressive | Quiet, dense, efficient |
| **Colors** | Festly pink / orange / cream / ink | **Same Festly pink / orange / ink** |
| Page canvas | White or cream bands | **White** (cream only as optional sunken) |
| Type | Anton · Quicksand · Caveat | Plus Jakarta Sans |
| Scope | Public marketing pages | Logged-in + marketplace tool chrome |
| CSS root | `.supply-landing` + kit tokens | `:root` in `app/globals.css` |
| Components | `components/marketing/*` | `components/ui/*`, feature folders |
| Docs / skills | This folder + `festly-design` | Listing-card skill + app tokens |
| Playground | `/dev/design-lab` | Real product screens |

**Quick test:** Poster energy (Anton, Caveat, cream bands) → website. Tool density (Jakarta, white canvas) → app. **Primary CTA color is pink on both.**

### Website routes

- `/for-talanger` — supply acquisition landing (owns its header; SiteNav excluded)
- `/dev/design-lab` — marketing token playground
- Future public landings that opt into `.supply-landing`

### App routes

- Browse / search / listings (`/`, `/sok`, `/tjanster/…`)
- Auth, onboarding, dashboard, planner, messages, settings, admin

### Shared across both

- Festly colors: primary `#FF2E8A`, secondary `#FF6A00`, ink `#111111`, success `#1F8A52`
- Swedish tone principles
- Star-rating rules, soft signup gate, mobile-first 390px

### Website-only (do not pull into app chrome)

- Anton headlines, Caveat notes
- Cream as default page background
- Flat poster shadows as default elevation

**Policy:** Shared Festly **colors**; dual surface for **type / density / marketing atmosphere**.

---

## Website kit — where things live

| Path | What |
|------|------|
| [`design system/`](../../design%20system/) | Full Festly kit — tokens, guidelines, components, marketplace UI kit, tone of voice |
| [`marketing/DESIGN.md`](marketing/DESIGN.md) | Claude-uploadable Stitch-style summary |
| `/dev/design-lab` | Interactive playground |
| [`docs/design-handoffs/supply-landing/`](../design-handoffs/supply-landing/) | Original `/for-talanger` HTML handoff |
| Live reference page | `/for-talanger` |
| App token root | [`app/globals.css`](../../app/globals.css) |

## How to use with Claude

1. Decide **website vs app** for type/layout (table above) — colors are shared.
2. For website: [`marketing/DESIGN.md`](marketing/DESIGN.md) or `festly-design` skill + `design system/`.
3. For app: `app/globals.css` + UI primitives — primary is Festly pink.
4. Iterate expressive marketing tokens in `/dev/design-lab`.

## Brand in one line

Pink `#FF2E8A` actions · Orange `#FF6A00` warmth · White app canvas · Cream marketing atmosphere · Festly wordmark (`BrandLogo`) · Anton/Quicksand/Caveat on marketing · Jakarta in the app.
