# Party Services Marketplace — Project Spec
**Version:** MVP 1.0
**Market:** Stockholm, Sweden
**Last updated:** May 2026

---

## 1. Who we're building for

### Planners
Young adults aged 20–35 in Stockholm. Social, spontaneous, and used to finding everything online. They might be throwing their own birthday party, organising a friend's bachelorette, or pulling together a last-minute work event. They don't have a big budget or a professional network — they just want to find someone great, fast, and feel confident they made a good choice.

They share things when they're excited. They ask friends for opinions. They co-plan. This behaviour is the engine of our growth.

### Providers
Anyone who offers a service at parties — singers, DJs, makeup artists, photographers, entertainers, chefs, face painters, dancers, balloon artists, live painters, and more. Category is free text, not a fixed list. Based in Stockholm at launch.

---

## 2. Tech stack

| Layer | Tool | What it does | Cost |
|-------|------|-------------|------|
| Framework | Next.js 14 (App Router) | The app itself | Free |
| Styling | Tailwind CSS | All visual design | Free |
| Database | Supabase (PostgreSQL) | Stores all data | Free tier |
| Auth | Supabase Auth | Login with Google, Facebook, Apple, email | Free tier |
| File storage | Supabase Storage | Provider photos | Free tier |
| Email | Resend | All notification emails | Free tier (3,000/month) |
| Analytics | PostHog | Tracks every event and funnel | Free tier (1M events/month) |
| Hosting | Vercel | Makes the site live | Free tier |

**Total cost at launch: €0**

---

## 3. Database tables

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email | text | Unique |
| name | text | |
| avatar_url | text | From social login or upload |
| user_type | text | 'provider', 'planner', or 'both' |
| auth_provider | text | 'google', 'facebook', 'apple', 'email' |
| signup_source | text | 'organic', 'shared_profile', 'shared_shortlist', 'invite' |
| referrer_id | uuid | FK → users (who referred them) |
| created_at | timestamp | |

### provider_profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| service_title | text | e.g. "Jazz Singer" |
| service_description | text | Free text bio |
| category_tags | text[] | e.g. ["singer", "jazz", "wedding"] |
| city | text | e.g. "Stockholm" |
| price_range_min | integer | Optional, in SEK |
| price_range_max | integer | Optional, in SEK |
| photos | text[] | Array of Supabase Storage URLs |
| party_animal_portrait_url | text | AI-generated portrait URL |
| is_published | boolean | False until profile is complete |
| profile_views | integer | Running total |
| created_at | timestamp | |

### booking_requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| planner_id | uuid | FK → users |
| provider_profile_id | uuid | FK → provider_profiles |
| event_date | date | |
| event_location | text | |
| guest_count | integer | |
| event_type | text | 'birthday', 'wedding', 'corporate', 'kids', 'other' |
| description | text | What they need |
| status | text | 'pending', 'accepted', 'declined', 'completed' |
| created_at | timestamp | |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| booking_request_id | uuid | FK → booking_requests |
| sender_id | uuid | FK → users |
| content | text | |
| read_at | timestamp | Null if unread |
| created_at | timestamp | |

### shortlists
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| planner_id | uuid | FK → users |
| share_token | text | Unique token for shareable link |
| created_at | timestamp | |

### shortlist_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| shortlist_id | uuid | FK → shortlists |
| provider_profile_id | uuid | FK → provider_profiles |
| added_at | timestamp | |

### reviews
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| booking_request_id | uuid | FK → booking_requests |
| reviewer_id | uuid | FK → users |
| reviewee_id | uuid | FK → users |
| rating | integer | 1–5 |
| comment | text | Optional |
| created_at | timestamp | |

### tracking_events
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Nullable — anonymous before signup |
| event_name | text | See section 8 |
| properties | jsonb | Flexible event metadata |
| session_id | text | Anonymous session before signup |
| created_at | timestamp | |

---

## 4. Pages & routes

| Route | Page | Auth required |
|-------|------|--------------|
| `/` | Homepage — browse and search | No |
| `/providers/[id]` | Provider profile page | No |
| `/shortlist/[token]` | Shared shortlist view | No |
| `/signup` | Signup and login | No |
| `/onboarding` | Provider profile creation flow | Yes — provider |
| `/dashboard` | Provider dashboard | Yes — provider |
| `/dashboard/requests` | Incoming booking requests | Yes — provider |
| `/dashboard/messages` | All message threads | Yes — provider |
| `/dashboard/profile` | Edit provider profile | Yes — provider |
| `/planner/shortlist` | My saved shortlist | Yes — planner |
| `/planner/bookings` | My sent booking requests | Yes — planner |
| `/booking/[id]/messages` | Booking message thread | Yes — both |
| `/review/[booking_id]` | Leave a review | Yes — both |

---

## 5. Build order

### Phase 1 — Foundation
- [ ] Set up Next.js 14 project with Tailwind CSS
- [ ] Set up Supabase project (database + auth + storage)
- [ ] Configure Google, Facebook and Apple social login
- [ ] Deploy to Vercel — confirm site is live on a URL
- [ ] Set up PostHog and confirm events are firing

### Phase 2 — Provider core
- [ ] Provider signup and onboarding flow
- [ ] Provider profile page (public, no auth required)
- [ ] Provider dashboard (basic)

### Phase 3 — Planner core
- [ ] Homepage with provider card grid and search
- [ ] Booking request form
- [ ] Soft signup gate (triggered on save or request, never on page load)
- [ ] Shortlist — save, view, share as link

### Phase 4 — Booking flow
- [ ] Accept and decline booking requests
- [ ] In-platform messaging (unlocked after request is sent)
- [ ] Email notifications via Resend

### Phase 5 — Growth features
- [ ] Share button on every provider profile
- [ ] Provider shares their own profile from dashboard
- [ ] Post-event review flow (auto-triggered 24h after event date)
- [ ] Invite a provider flow
- [ ] All tracking events wired throughout

### Phase 6 — Brand and polish
- [ ] Full brand implementation — colours, typography, spacing
- [ ] AI party animal portrait generated on provider signup
- [ ] Mobile responsiveness pass on all pages
- [ ] Empty states, error pages and loading states

---

## 6. MVP features per page

### `/` — Homepage
- Grid of published provider cards
- Each card: photo, name, service title, city, star rating
- Search by service type and city
- Sort by newest and most reviewed
- No login required

### `/providers/[id]` — Provider profile
- Photos, bio, category tags, price range, city, reviews
- "Request this service" — soft gate if not logged in
- "Save to shortlist" — soft gate if not logged in
- "Share this provider" — always visible, no login required
- No login required to view

### `/shortlist/[token]` — Shared shortlist
- All providers saved by the sharing planner
- Viewable without login
- Each card links to the provider's full profile
- "Save this shortlist" CTA triggers signup for the viewer

### `/signup` — Signup and login
- Google, Facebook, Apple buttons
- Email and password as fallback
- Only reached via soft gate or direct link — never shown unprompted

### `/onboarding` — Provider profile creation
- Step 1: Service title (free text)
- Step 2: Category tags (free text with suggestions)
- Step 3: City
- Step 4: Bio
- Step 5: Price range (optional)
- Step 6: Photo upload (up to 5)
- Profile not published until title, city and at least one photo are added
- On publish: trigger AI party animal portrait generation

### `/dashboard` — Provider dashboard
- Count of pending requests
- Count of unread messages
- Link to edit profile
- Link to view live profile

### `/dashboard/requests` — Booking requests
- List of all requests with status (pending, accepted, declined)
- Each request shows: planner name, event date, event type, guest count, description
- Accept and Decline buttons on pending requests
- Accepting unlocks messaging with that planner

### `/dashboard/messages` — Messages
- List of all message threads
- Unread indicator per thread

### `/dashboard/profile` — Edit profile
- Edit all fields set during onboarding
- Add or remove photos
- Toggle published / unpublished

### `/planner/shortlist` — My shortlist
- All saved providers
- Remove a provider from shortlist
- Share shortlist button — generates a shareable link

### `/planner/bookings` — My booking requests
- All requests sent, with status
- Link to message thread for accepted requests

### `/booking/[id]/messages` — Message thread
- Simple chat between planner and provider
- Only accessible to the two parties in that booking
- Email notification on each new message

### `/review/[booking_id]` — Leave a review
- Star rating 1–5
- Optional comment
- Triggered by email 24 hours after event date
- Both planner and provider receive the prompt

---

## 7. Growth loops

### Loop 1 — Shared provider profile (core loop)
**Trigger:** Planner taps "Share this provider."
**What happens:** Link is shared via WhatsApp, Instagram or copy. Recipient opens the profile without logging in. When they tap "Request" or "Save" the soft gate appears. They sign up and become a new planner who can share too.
**Why it matters:** Every excited planner becomes a distribution channel.

### Loop 2 — Shared shortlist
**Trigger:** Planner saves several providers and shares the shortlist link with co-planners.
**What happens:** Each recipient views the shortlist without logging in. When they engage, the soft gate appears and they sign up. They now have their own account and start browsing and sharing.
**Why it matters:** Co-planning is natural behaviour. The shortlist turns a private decision into a multi-user event.

### Loop 3 — Post-event review
**Trigger:** 24 hours after the event date, both parties receive a review prompt by email.
**What happens:** Reviews appear publicly on the provider profile. More reviews means more credibility, which means more requests, which means more reviews.
**Why it matters:** Trust compounds over time. A provider with 20 reviews converts far better than one with zero.

### Loop 4 — Provider shares their own profile
**Trigger:** Provider wants more bookings and shares their profile link on Instagram, WhatsApp or TikTok.
**What happens:** Their existing audience lands on their profile. Some become planners and send requests. Those planners then share the platform further.
**Why it matters:** Providers do our marketing for free.

### Loop 5 — Invite a provider
**Trigger:** Planner searches for a type of talent that is not on the platform yet and nominates them.
**What happens:** The nominated provider receives a personalised email invite. They join and bring their own audience — triggering loop 4.
**Why it matters:** Demand creates supply. Planners actively recruit providers on our behalf.

### Loop 6 — AI party animal portrait
**Trigger:** Provider completes and publishes their profile.
**What happens:** An AI-generated party animal portrait is created for them. They are encouraged to share it on social media tagging the platform.
**Why it matters:** A unique personalised piece of art is one of the most shareable things you can give someone. Every share reaches a new audience at zero cost.

---

## 8. Tracking events

All events are logged to the `tracking_events` table and sent to PostHog.

| Event name | Fired when | Key properties |
|-----------|------------|----------------|
| `page_viewed` | Any page loads | page, referrer, session_id |
| `profile_viewed` | Provider profile opened | provider_id, source |
| `search_performed` | Search used | query, city, results_count |
| `provider_shared` | Share button tapped | provider_id, method |
| `shared_link_opened` | Shared profile link opened | provider_id, sharer_id |
| `shortlist_item_saved` | Provider saved to shortlist | provider_id, planner_id |
| `shortlist_shared` | Shortlist share tapped | shortlist_id, item_count |
| `shortlist_link_opened` | Shared shortlist link opened | shortlist_id, sharer_id |
| `signup_gate_triggered` | Soft gate appears | trigger, provider_id |
| `signup_completed` | Account created | auth_provider, signup_source, referrer_id |
| `onboarding_started` | Provider starts profile creation | user_id |
| `onboarding_completed` | Provider publishes profile | user_id, category_tags, city |
| `booking_request_sent` | Request form submitted | provider_id, event_type, event_date, guest_count |
| `booking_accepted` | Provider accepts | booking_id, response_time_hours |
| `booking_declined` | Provider declines | booking_id, response_time_hours |
| `message_sent` | Message sent | booking_id, sender_type, message_count |
| `review_submitted` | Review completed | booking_id, rating, reviewer_type |
| `provider_nominated` | Planner nominates a provider | nominated_by, provider_url |
| `portrait_generated` | AI portrait created | provider_id |
| `portrait_shared` | Provider shares portrait | provider_id, method |

### Metrics to check weekly
| Metric | Formula | Target |
|--------|---------|--------|
| Viral coefficient | Signups from shares ÷ total sharers | > 1.0 |
| Share rate | Profiles shared ÷ profiles viewed | > 5% |
| Request rate | Requests sent ÷ profile views | > 3% |
| Acceptance rate | Accepted ÷ total requests | > 70% |
| Review rate | Reviews left ÷ completed bookings | > 60% |
| Provider funnel | Published profiles ÷ started onboarding | > 50% |

---

## 9. Parking lot — v2 and beyond

| Feature | Why not in MVP |
|---------|---------------|
| Payments and escrow | Add once messages reveal how deals are actually made |
| Availability calendar | Providers manage dates manually via messages for now |
| Advanced search filters | Add once data shows what planners actually filter by |
| Verified profiles and ID check | Only needed when money changes hands |
| Dispute resolution | Handle manually by email until there is real volume |
| Provider packages and tiered pricing | Let providers explain options in messages first |
| Promoted listings | Needs real traffic before promotion has value |
| Native mobile app | Web first — build app when retention data justifies it |
| Expand beyond Stockholm | Only after Stockholm is working |
| Commission model | Introduce when providers are too invested to leave |

---

## Separate documents to create

- [ ] **Branding plan** — name, colours, typography, tone of voice, photography direction
- [ ] **Launch campaign plan** — party animal campaign, pre-launch waitlist, provider outreach
