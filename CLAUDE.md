# CLAUDE.md — Party Services Marketplace

Read this file at the start of every session before writing any code.
Also read SPEC.md / `party-marketplace-spec.md` for the full product specification.

---

## What we are building

A two-sided marketplace where party planners in Stockholm can discover and book local talent — singers, DJs, makeup artists, photographers, chefs, and anyone who makes a party unforgettable. Providers create a free profile and get discovered. Planners browse, save, and request.

Built for growth through sharing. Every booking, every saved shortlist, every great party is designed to bring new users in.

---

## Stack

- **Framework:** Next.js 14 App Router — always use the App Router, never the Pages Router
- **Language:** TypeScript everywhere — no plain JavaScript files
- **Styling:** Tailwind CSS only — no CSS modules, no styled-components, no inline styles
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth — Google, Facebook, Apple, and email
- **Storage:** Supabase Storage — for provider photos and AI portraits
- **Email:** Resend — for all transactional notifications
- **Analytics:** PostHog — for all tracking events
- **Image generation:** OpenAI DALL-E 3 — for AI party animal portraits
- **Payments:** Stripe Connect escrow (`PLATFORM_FEE_PERCENT` in `lib/platform-fee.ts`)
- **Hosting:** Vercel

---

## Environment variables

All secrets live in `.env.local`. Never hardcode them.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
OPENAI_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_PLACES_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## Project structure

```
party-marketplace/
├── CLAUDE.md
├── docs/
│   └── design-handoffs/       ← design references (not runtime tokens)
│       └── supply-landing/    ← provider marketing page handoff
├── app/
│   ├── layout.tsx
│   ├── page.tsx               ← homepage / browse
│   ├── for-talanger/          ← provider (supply) marketing landing
│   ├── sok/                   ← search results
│   ├── tjanster/[id]/         ← public service listing
│   ├── onboarding/            ← provider wizard hub + flow (authenticated)
│   ├── dashboard/             ← provider host chrome
│   ├── planner/               ← planner guest chrome
│   └── …
├── components/
│   ├── ui/                    ← shadcn + FESTEN primitives
│   ├── marketing/supply/      ← /for-talanger sections
│   ├── listings/
│   ├── messages/
│   └── shared/
├── lib/
│   ├── platform-fee.ts        ← client-safe fee % (keep in sync with Stripe)
│   ├── supabase.ts
│   └── …
├── public/
│   └── images/supply/         ← supply landing hero photography
├── supabase/
│   └── schema.sql
└── design system/             ← raw handoff dump (see docs/ for curated copy)
```

---

## Brand

### Source of truth (app chrome)

Marketplace UI (browse, dashboard, listings) uses FESTEN tokens in `app/globals.css` + `tailwind.config.js`:
- Primary ember `#FF6B35`, ink `#222222`, white canvas, Plus Jakarta Sans.

### Supply marketing landing (`/for-talanger`)

Uses the **Festly handoff visual system** scoped under `.supply-landing`:
- Colors: orange `#FF6A00`, pink `#FF2E8A` (primary actions), cream `#FFF3E6`, ink `#111` — **no ember/amber**
- Fonts + sizes from handoff tokens (`--fs-display-xl: 88px`, `--fs-display-md: 44px`, `--fs-h3: 22px`, `--fs-body-lg: 19px`, etc.)
- Wordmark: `public/images/supply/festly-wordmark.svg`
- Tokens stylesheet: `components/marketing/supply/supply-landing.css`
- Owns `MarketplaceHeader` + `BrowseSearch`; SiteNav is excluded
- Design ref: `docs/design-handoffs/supply-landing/`
- “Erbjud din tjänst” across the app links here

Do **not** apply Festly pink/cream/Anton to the rest of the product unless a handoff explicitly says so.

### Design principles
- Mobile first — design every screen at 390px wide first
- Soft signup gate — never show login wall on page load, only on action
- Never show empty star ratings — see star system rules below
- Marketing handoffs: match layout, copy, **and** visual system when the handoff includes a design system; restyle only when the brief says the product brand overrides it

---

## Supply (provider) landing

### `/for-talanger`
- Live page: `app/for-talanger/page.tsx` → `components/marketing/supply/*`
- Nav: `MarketplaceHeader` + `BrowseSearch`; SiteNav skipped
- FAQ fee copy matches `PLATFORM_FEE_PERCENT` (currently 20%)
- Design reference: `docs/design-handoffs/supply-landing/`
- Primary “Erbjud din tjänst” destination; CTAs → soft auth → `/onboarding` (dashboard if they already have a provider profile)
- `/skapa-annons` permanently redirects here

---

## Database

The Supabase client lives in `/lib/supabase.ts` (browser) and `/lib/supabase-server.ts` (server components and API routes).

Always use exact column names from `/supabase/schema.sql`.

Never use the service role key in client-side code. Service role key is only used in server-side API routes.

### Key tables
- `users` — all users (providers and planners)
- `provider_profiles` — provider host account
- `services` — bookable listings
- `booking_requests` — all booking requests with status
- `quotes` — provider offers on accepted chats
- `messages` — chat messages linked to booking requests
- `shortlists` + `shortlist_items` — planner saved lists
- `reviews` — post-event ratings
- `tracking_events` — all analytics events

---

## Authentication

Supabase Auth handles all login flows.

Social providers: Google, Facebook, Apple.
Email + password as fallback.

After social login, check if the user has a record in the `users` table. If not, create one. Store `auth_provider` and `signup_source`.

The soft signup gate appears when a non-logged-in user taps "Save to shortlist" or "Request this service". Never show it on page load.

---

## Tracking events

Every significant user action fires a tracking event. Two destinations:
1. Supabase `tracking_events` table — permanent record
2. PostHog — real-time analytics

Helper function lives in `/lib/posthog.ts`. Call it like:

```typescript
track('profile_viewed', {
  provider_id: provider.id,
  source: 'shared_link'
})
```

Full list of events is in SPEC.md section 8. Wire every event as you build each feature — don't leave it for later.

---

## Email notifications

All emails sent via Resend from `/lib/resend.ts`.

Emails to send:
- Welcome email on signup
- New booking request received (to provider)
- Booking accepted (to planner)
- Booking declined (to planner)
- New message received (to both)
- Review reminder 24h after event date (to both)

---

## Growth loops — build these in from the start

Do not leave growth features for later. Wire them as you build each page.

1. **Share button on every provider profile** — native Web Share API on mobile, copy link on desktop. Fires `provider_shared` event.
2. **Shareable shortlist link** — generate a unique `share_token` per shortlist. `/shortlist/[token]` is public.
3. **Post-event review trigger** — schedule an email 24h after `event_date` on every accepted booking.
4. **AI party animal portrait** — trigger generation when provider publishes profile. Uses OpenAI DALL-E 3. Save URL to `party_animal_portrait_url` on `provider_profiles`.
5. **Invite a provider** — simple form on the browse page. Sends an email via Resend.
6. **Supply landing** — “Erbjud din tjänst” goes to `/for-talanger`. CTAs → soft auth → onboarding (dashboard if they already have a provider profile).

---

## Star rating rules

- 0 reviews: show "New on platform" badge — no stars
- 1–4 reviews: show score as number with count, e.g. "4.8 · 3 reviews" — no star graphic
- 5+ reviews: show full star graphic + score + count, e.g. "★★★★★ 4.9 (23 reviews)"
- Never show empty or zero stars
- Never show rating without review count

---

## Build order

Work through phases in order. Complete and test each step before moving to the next.

### Phase 1 — Foundation
- [x] Next.js 14 + Tailwind CSS setup
- [x] Supabase project + schema
- [x] Google, Facebook, Apple social login
- [x] Vercel deployment
- [x] PostHog setup

### Phase 2 — Provider core
- [x] Provider signup and onboarding wizard
- [x] Provider profile / listing page (public)
- [x] Provider dashboard
- [x] Supply marketing landing (`/for-talanger`)

### Phase 3 — Planner core
- [x] Homepage browse grid and search
- [x] Booking request form
- [x] Soft signup gate
- [x] Shortlist — save, view, share

### Phase 4 — Booking flow
- [x] Accept / decline requests
- [x] Offers / quotes + cancel
- [x] In-platform messaging
- [x] Email notifications via Resend
- [x] Stripe escrow payments

### Phase 5 — Growth features
- [ ] Share buttons on provider profiles
- [ ] Post-event review flow
- [ ] AI party animal portrait generation
- [ ] Invite a provider
- [ ] All tracking events wired

### Phase 6 — Brand and polish
- [ ] Full brand implementation
- [x] Mobile responsiveness pass (ongoing)
- [ ] Empty states and error pages

---

## Rules for Claude Code

- One feature per session — build it, test it, then start the next
- Always reference SPEC.md for feature requirements
- Always reference schema.sql for exact column names
- Mobile first on every component
- Test in the browser after every change
- Commit to GitHub after every working feature
- If something is unclear, ask — do not guess
- Design handoffs: layout/copy/interaction only; always restyle with FESTEN tokens
