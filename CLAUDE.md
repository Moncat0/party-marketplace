# CLAUDE.md — Party Services Marketplace

Read this file at the start of every session before writing any code.
Also read SPEC.md for the full product specification.

---

## What we are building

A two-sided marketplace where party planners in Stockholm can discover and book local talent — singers, DJs, makeup artists, photographers, chefs, and anyone who makes a party unforgettable. Providers create a free profile and get discovered. Planners browse, save, and request. Everything is free at launch.

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
```

---

## Project structure

```
party-marketplace/
├── CLAUDE.md                  ← this file
├── SPEC.md                    ← full product spec, read this too
├── .env.local                 ← secrets, never commit
├── app/
│   ├── layout.tsx             ← root layout
│   ├── page.tsx               ← homepage / browse
│   ├── providers/
│   │   └── [id]/
│   │       └── page.tsx       ← provider profile page
│   ├── shortlist/
│   │   └── [token]/
│   │       └── page.tsx       ← shared shortlist view
│   ├── signup/
│   │   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx           ← provider profile creation (6 steps)
│   ├── dashboard/
│   │   ├── page.tsx           ← provider dashboard
│   │   ├── requests/
│   │   │   └── page.tsx
│   │   ├── messages/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── planner/
│   │   ├── shortlist/
│   │   │   └── page.tsx
│   │   └── bookings/
│   │       └── page.tsx
│   ├── booking/
│   │   └── [id]/
│   │       └── messages/
│   │           └── page.tsx
│   └── review/
│       └── [booking_id]/
│           └── page.tsx
├── components/
│   ├── ui/                    ← reusable UI components
│   ├── provider/              ← provider-specific components
│   ├── planner/               ← planner-specific components
│   └── shared/                ← shared between both
├── lib/
│   ├── supabase.ts            ← Supabase client (browser)
│   ├── supabase-server.ts     ← Supabase client (server)
│   ├── posthog.ts             ← PostHog client
│   └── resend.ts              ← Resend email helpers
├── supabase/
│   └── schema.sql             ← full database schema
└── public/
```

---

## Brand

### Colours
```
Primary (warm ember):    #FF6B35
Dark (deep night):       #1A1A2E
Background (warm white): #FFF8F3
Card surface:            #F0EDE8
Text primary:            #1A1A2E
Text secondary:          #5F5E5A
Success:                 #1D9E75
```

### Typography
- Display / headlines: Plus Jakarta Sans (Google Fonts)
- Body / UI: Plus Jakarta Sans (Google Fonts)
- Mono: JetBrains Mono
- Use Plus Jakarta Sans for all UI text, buttons, labels, inputs, and headlines
- Closest free stand-in for Airbnb Cereal VF (soft geometric sans)

### Design principles
- Mobile first — design every screen at 390px wide first
- Warm ember orange (#FF6B35) is the primary action colour — buttons, CTAs, progress bars
- Never show empty star ratings — see star system rules in SPEC.md
- Soft signup gate — never show login wall on page load, only on action

---

## Database

The Supabase client lives in `/lib/supabase.ts` (browser) and `/lib/supabase-server.ts` (server components and API routes).

Always use exact column names from `/supabase/schema.sql`.

Never use the service role key in client-side code. Service role key is only used in server-side API routes.

### Key tables
- `users` — all users (providers and planners)
- `provider_profiles` — provider listings
- `booking_requests` — all booking requests with status
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
- [ ] Next.js 14 + Tailwind CSS setup
- [ ] Supabase project + schema
- [ ] Google, Facebook, Apple social login
- [ ] Vercel deployment
- [ ] PostHog setup

### Phase 2 — Provider core
- [ ] Provider signup and 6-step onboarding flow
- [ ] Provider profile page (public)
- [ ] Provider dashboard

### Phase 3 — Planner core
- [ ] Homepage browse grid and search
- [ ] Booking request form
- [ ] Soft signup gate
- [ ] Shortlist — save, view, share

### Phase 4 — Booking flow
- [ ] Accept / decline requests
- [ ] In-platform messaging
- [ ] Email notifications via Resend

### Phase 5 — Growth features
- [ ] Share buttons on provider profiles
- [ ] Post-event review flow
- [ ] AI party animal portrait generation
- [ ] Invite a provider
- [ ] All tracking events wired

### Phase 6 — Brand and polish
- [ ] Full brand implementation
- [ ] Mobile responsiveness pass
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
