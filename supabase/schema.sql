-- FESTEN. — Party Services Marketplace
-- Database schema. Run this in the Supabase SQL Editor to create all tables.
-- All user-facing text in the app is in Swedish. The database stores raw data only.
--
-- Provider vs. Service model:
--   provider_profiles = the person/host identity (one per user): bio, city, Stripe Connect status,
--                        AI party-animal portrait.
--   services          = the actual bookable listing (one per provider, 1:1): title, description,
--                        category tags, price range, photos, publish status.
-- Everything a planner books, saves, or messages about is keyed off service_id.

-- ─────────────────────────────────────────
-- CLEAN SLATE
-- Drop all tables in reverse dependency order before recreating them.
-- This is safe to run on a fresh project — it just clears any partial setup.
-- ─────────────────────────────────────────
drop table if exists message_thread_archives cascade;
drop table if exists quick_replies cascade;
drop table if exists tracking_events cascade;
drop table if exists reviews cascade;
drop table if exists quotes cascade;
drop table if exists messages cascade;
drop table if exists shortlist_items cascade;
drop table if exists shortlists cascade;
drop table if exists booking_requests cascade;
drop table if exists services cascade;
drop table if exists provider_profiles cascade;
drop table if exists users cascade;

-- Enable the pgcrypto extension so Supabase can auto-generate UUIDs.
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- USERS
-- Every person who signs up, whether they are a provider, a planner, or both.
-- ─────────────────────────────────────────
create table users (
  id                                    uuid primary key default gen_random_uuid(),
  email                                 text unique not null,
  name                                  text,
  first_name                            text,
  last_name                             text,
  preferred_first_name                  text,
  phone                                 text,
  avatar_url                            text,
  user_type                             text not null default 'planner'
                                          check (user_type in ('provider', 'planner', 'both')),
  auth_provider                         text
                                          check (auth_provider in ('google', 'facebook', 'apple', 'email')),
  signup_source                         text default 'organic'
                                          check (signup_source in ('organic', 'shared_profile', 'shared_shortlist', 'invite')),
  referrer_id                           uuid references users (id) on delete set null,

  -- Address (Airbnb-style personal info)
  address_line1                         text,
  address_line2                         text,
  address_city                          text,
  address_postal_code                   text,
  address_country                       text,

  -- Privacy preferences
  privacy_read_receipts                 boolean not null default true,
  privacy_review_show_city              boolean not null default true,
  privacy_review_show_booked_services   boolean not null default false,

  -- Transactional notification preferences
  notif_booking_accepted                boolean not null default true,
  notif_booking_declined                boolean not null default true,
  notif_new_message                     boolean not null default true,
  notif_review_reminder                 boolean not null default true,

  -- Marketing notification preferences
  notif_marketing                       boolean not null default true,
  notif_provider_news                   boolean not null default true,
  notif_provider_regs                   boolean not null default true,
  notif_festen_news                     boolean not null default true,
  notif_festen_feedback                 boolean not null default true,

  suggested_replies_enabled             boolean not null default true,

  data_export_requested_at              timestamptz,
  deactivated_at                        timestamptz,

  -- Auth compliance (email confirm + legal)
  email_verified_at                     timestamptz,
  terms_accepted_at                     timestamptz,
  age_confirmed_at                      timestamptz,

  -- Stripe Customer id only (card numbers never stored in FESTEN)
  stripe_customer_id                    text,

  created_at                            timestamptz not null default now()
);

comment on column users.email_verified_at is 'When the user confirmed email (synced from auth; Google set on create)';
comment on column users.terms_accepted_at is 'When the user accepted Användarvillkor';
comment on column users.age_confirmed_at is 'When the user confirmed they are 18+';

comment on column users.privacy_read_receipts is 'When true, others can see when this user has read their messages';
comment on column users.privacy_review_show_city is 'When true, show home city on reviews written by this user';
comment on column users.privacy_review_show_booked_services is 'When true, show booked service info on reviews written by this user';
comment on column users.notif_provider_news is 'Marketing: provider program/feature updates';
comment on column users.notif_provider_regs is 'Marketing: local rules and regulations for providers';
comment on column users.notif_festen_news is 'Marketing: FESTEN news and programs';
comment on column users.notif_festen_feedback is 'Marketing: feedback requests from FESTEN';

-- ─────────────────────────────────────────
-- PROVIDER PROFILES
-- The provider's identity — one per user. Holds Stripe Connect status, bio, and the
-- AI party-animal portrait. Listing content (title, price, photos…) lives on `services`.
-- ─────────────────────────────────────────
create table provider_profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references users (id) on delete cascade unique,
  city                      text default 'Stockholm',
  location_id               text not null default 'stockholm',
  bio                       text,
  party_animal_portrait_url text,
  stripe_account_id         text,
  stripe_onboarded          boolean not null default false,
  created_at                timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SERVICES
-- The bookable listing for a provider — what planners see when they browse.
-- One provider may have up to 2 services (soft limit enforced in app).
-- ─────────────────────────────────────────
create table services (
  id                  uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references provider_profiles (id) on delete cascade,
  title               text,
  description         text,
  -- Canonical browse category (talent type). Orthogonal to occasions.
  category_slug       text
                          check (
                          category_slug is null
                          or category_slug in (
                            'dj', 'fotograf', 'musik', 'makeup',
                            'underhallning', 'catering'
                          )
                          ),
  -- Legacy / specialty tags — kept in sync with category_slug[0] on write.
  category_tags       text[] default '{}',
  -- Party occasions this service fits (multi). See lib/occasions.ts.
  occasions           text[] not null default '{}',
  city                text default 'Stockholm',
  location_id         text not null default 'stockholm',
  price_range_min     integer,
  price_range_max     integer,
  photos              text[] default '{}',
  -- Airbnb-style cancel preset shown on listing + copied onto quotes
  cancellation_policy text
                        check (
                          cancellation_policy is null
                          or cancellation_policy in ('flexible', 'moderate', 'strict')
                        ),
  -- When true, listing matches location searches even outside host/service city
  can_travel          boolean not null default false,
  is_published        boolean not null default false,
  is_disabled         boolean not null default false,
  view_count          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index on services (category_slug);

-- ─────────────────────────────────────────
-- BOOKING REQUESTS
-- When a planner wants to book a provider's service for their event.
-- ─────────────────────────────────────────
create table booking_requests (
  id                          uuid primary key default gen_random_uuid(),
  planner_id                  uuid not null references users (id) on delete cascade,
  service_id                  uuid not null references services (id) on delete cascade,
  event_date                  date,
  event_location              text,
  event_place_id              text,
  event_lat                   double precision,
  event_lng                   double precision,
  guest_count                 integer,
  event_type                  text
                                check (event_type in (
                                  'birthday', 'kids', 'wedding', 'corporate', 'graduation',
                                  'crayfish', 'midsommar', 'christmas', 'hen_stag',
                                  'anniversary', 'housewarming', 'other'
                                )),
  -- Multi-select occasions on the förfrågan (mirrors / supersedes event_type).
  occasions                   text[] not null default '{}',
  description                 text,
  status                      text not null default 'pending'
                                check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),

  cancelled_at                timestamptz,
  cancelled_by                text check (cancelled_by is null or cancelled_by in ('planner', 'provider')),
  cancel_reason               text,
  refund_ore                  integer,
  stripe_refund_id            text,

  -- Escrow payment (charged on quote accept; held on platform until release)
  price_ore                   integer,
  payment_status              text check (payment_status in (
                                'unpaid',
                                'held',
                                'pending_release',
                                'released',
                                'refunded',
                                'partially_refunded',
                                'disputed'
                              )),
  paid_at                     timestamptz,
  held_at                     timestamptz,
  pending_release_at          timestamptz,
  release_deadline_at         timestamptz,
  released_at                 timestamptz,
  disputed_at                 timestamptz,
  refunded_at                 timestamptz,
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  stripe_transfer_id          text,
  platform_fee_ore            integer,
  provider_payout_ore         integer,

  created_at                  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- QUOTES
-- A price quote a provider sends inside a conversation. When accepted, its price
-- is copied onto the booking request so the planner can pay.
-- ─────────────────────────────────────────
create table quotes (
  id                     uuid primary key default gen_random_uuid(),
  booking_request_id     uuid not null references booking_requests (id) on delete cascade,
  service_id             uuid not null references services (id) on delete cascade,
  price_ore              integer not null,
  description            text,
  duration               text,
  event_date             date,
  location               text,
  cancellation_policy    text,
  status                 text not null default 'pending'
                           check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at             timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MESSAGES
-- Chat messages between a planner and a provider, tied to a booking request.
-- Messaging is only available after a booking request has been sent.
-- A message may carry an image, a quote, or plain text.
-- ─────────────────────────────────────────
create table messages (
  id                  uuid primary key default gen_random_uuid(),
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
  sender_id           uuid not null references users (id) on delete cascade,
  content             text,
  image_url           text,
  quote_id            uuid references quotes (id) on delete set null,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SHORTLISTS
-- A planner's saved collection of services they are interested in.
-- Each shortlist has a unique share_token so it can be shared as a link.
-- ─────────────────────────────────────────
create table shortlists (
  id          uuid primary key default gen_random_uuid(),
  planner_id  uuid not null references users (id) on delete cascade,
  name        text not null default 'Favoriter',
  share_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  event_date  date,
  guest_count integer,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SHORTLIST ITEMS
-- The individual services inside a shortlist.
-- ─────────────────────────────────────────
create table shortlist_items (
  id          uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references shortlists (id) on delete cascade,
  service_id  uuid not null references services (id) on delete cascade,
  note        text,
  added_at    timestamptz not null default now(),
  unique (shortlist_id, service_id)
);

-- ─────────────────────────────────────────
-- REVIEWS
-- Star ratings left by planners and providers after an event.
-- Both sides can review each other (reviewer_id → reviewee_id).
-- service_id is nullable and used to aggregate ratings on a service's public page.
-- ─────────────────────────────────────────
create table reviews (
  id                  uuid primary key default gen_random_uuid(),
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
  service_id          uuid references services (id) on delete set null,
  reviewer_id         uuid not null references users (id) on delete cascade,
  reviewee_id         uuid not null references users (id) on delete cascade,
  rating              integer not null check (rating between 1 and 5),
  comment             text,
  created_at          timestamptz not null default now(),
  unique (booking_request_id, reviewer_id)
);

-- ─────────────────────────────────────────
-- TRACKING EVENTS
-- A permanent log of every significant action in the app.
-- Also sent to PostHog in real time for analytics dashboards.
-- user_id is nullable because some actions happen before signup.
-- ─────────────────────────────────────────
create table tracking_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users (id) on delete set null,
  event_name  text not null,
  properties  jsonb default '{}',
  session_id  text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- MESSAGING EXTRAS (quick replies, archives)
-- ─────────────────────────────────────────────
create table quick_replies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  title       text not null,
  body        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table message_thread_archives (
  user_id             uuid not null references users (id) on delete cascade,
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
  archived_at         timestamptz not null default now(),
  primary key (user_id, booking_request_id)
);

-- ─────────────────────────────────────────
-- INDEXES
-- These speed up the most common queries — e.g. "show me all published services in
-- Stockholm", "load all messages for this booking", "find this shortlist by its share token".
-- ─────────────────────────────────────────
create index on provider_profiles (user_id);
create index on provider_profiles (city);
create index on provider_profiles (location_id);
create index on services (provider_profile_id);
create index on services (is_published);
create index on services (is_disabled);
create index on services (city);
create index on services (location_id);
create index on booking_requests (planner_id);
create index on booking_requests (service_id);
create index on booking_requests (status);
create index on quotes (booking_request_id);
create index on quotes (service_id);
create index on messages (booking_request_id);
create index on messages (sender_id);
create index on messages (quote_id);
create index on shortlists (planner_id);
create index on shortlists (share_token);
create index on shortlist_items (shortlist_id);
create index on shortlist_items (service_id);
create index on reviews (reviewee_id);
create index on reviews (service_id);
create index on tracking_events (user_id);
create index on tracking_events (event_name);
create index on tracking_events (created_at);
create index on quick_replies (user_id);
create index on message_thread_archives (user_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- This is Supabase's built-in security layer.
-- It means users can only see and edit their own data — not other people's.
-- Think of it as locking each row in the database to the person it belongs to.
-- ─────────────────────────────────────────

alter table users enable row level security;
alter table provider_profiles enable row level security;
alter table services enable row level security;
alter table booking_requests enable row level security;
alter table quotes enable row level security;
alter table messages enable row level security;
alter table shortlists enable row level security;
alter table shortlist_items enable row level security;
alter table reviews enable row level security;
alter table tracking_events enable row level security;
alter table quick_replies enable row level security;
alter table message_thread_archives enable row level security;

-- USERS policies
-- Anyone can read any user's basic info (needed to show names).
-- You can only update your own profile.
create policy "Users are publicly readable"
  on users for select using (true);

create policy "Users can update their own record"
  on users for update using (auth.uid() = id);

create policy "Users can insert their own record"
  on users for insert with check (auth.uid() = id);

-- PROVIDER PROFILES policies
-- Provider identity rows are publicly readable (host name/avatar/bio show on listings).
-- Providers can only edit their own profile.
create policy "Provider profiles are publicly readable"
  on provider_profiles for select using (true);

create policy "Providers can insert their own profile"
  on provider_profiles for insert
  with check (auth.uid() = user_id);

create policy "Providers can update their own profile"
  on provider_profiles for update
  using (auth.uid() = user_id);

-- SERVICES policies
-- Published services are visible to everyone (for browsing). A provider can always see
-- and edit their own service, published or not.
create policy "Published services are publicly readable"
  on services for select
  using (
    (is_published = true and is_disabled = false)
    or auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );

create policy "Providers can insert their own services"
  on services for insert
  with check (
    auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );

create policy "Providers can update their own services"
  on services for update
  using (
    auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );

create policy "Providers can delete their own services"
  on services for delete
  using (
    auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );

-- BOOKING REQUESTS policies
-- A planner can see their own requests. A provider can see requests sent to their service.
create policy "Planners can read their own requests"
  on booking_requests for select
  using (
    auth.uid() = planner_id
    or auth.uid() = (
      select pp.user_id from services s
      join provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );

create policy "Planners can create booking requests"
  on booking_requests for insert
  with check (auth.uid() = planner_id);

create policy "Providers can update request status"
  on booking_requests for update
  using (
    auth.uid() = (
      select pp.user_id from services s
      join provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );

-- QUOTES policies
-- Only the two parties on the underlying booking can read or write a quote.
create policy "Booking participants can read quotes"
  on quotes for select
  using (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from services s
      join provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );

create policy "Providers can create quotes for their service"
  on quotes for insert
  with check (
    auth.uid() = (
      select pp.user_id from services s
      join provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );

create policy "Planners can update quote status"
  on quotes for update
  using (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
  );

-- MESSAGES policies
-- Only the planner and provider involved in a booking can read or send messages.
create policy "Booking participants can read messages"
  on messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join services s on s.id = br.service_id
      join provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  );

create policy "Booking participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and (
      auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
      or auth.uid() = (
        select pp.user_id from booking_requests br
        join services s on s.id = br.service_id
        join provider_profiles pp on pp.id = s.provider_profile_id
        where br.id = booking_request_id
      )
    )
  );

create policy "Booking participants can mark messages read"
  on messages for update
  using (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join services s on s.id = br.service_id
      join provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  )
  with check (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join services s on s.id = br.service_id
      join provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  );

-- Authenticated clients may only update read_at (mark as read).
-- grant update (read_at) on messages to authenticated;

-- SHORTLISTS policies
-- Anyone can view a shortlist (needed for the shared link feature).
-- Only the owner can create or delete.
create policy "Shortlists are publicly readable"
  on shortlists for select using (true);

create policy "Planners can create shortlists"
  on shortlists for insert
  with check (auth.uid() = planner_id);

create policy "Planners can delete their own shortlists"
  on shortlists for delete
  using (auth.uid() = planner_id);

create policy "Planners can update their own shortlists"
  on shortlists for update
  using (auth.uid() = planner_id)
  with check (auth.uid() = planner_id);

-- SHORTLIST ITEMS policies
create policy "Shortlist items are publicly readable"
  on shortlist_items for select using (true);

create policy "Planners can add to their shortlist"
  on shortlist_items for insert
  with check (
    auth.uid() = (
      select planner_id from shortlists where id = shortlist_id
    )
  );

create policy "Planners can remove from their shortlist"
  on shortlist_items for delete
  using (
    auth.uid() = (
      select planner_id from shortlists where id = shortlist_id
    )
  );

create policy "Planners can update their shortlist items"
  on shortlist_items for update
  using (
    auth.uid() = (
      select planner_id from shortlists where id = shortlist_id
    )
  )
  with check (
    auth.uid() = (
      select planner_id from shortlists where id = shortlist_id
    )
  );

-- REVIEWS policies
-- Reviews are public (they show on service pages).
-- Only the reviewer can create their own review.
create policy "Reviews are publicly readable"
  on reviews for select using (true);

create policy "Users can submit their own reviews"
  on reviews for insert
  with check (auth.uid() = reviewer_id);

-- TRACKING EVENTS policies
-- Users can log their own events. Anonymous events (no user_id) are also allowed.
create policy "Users can insert tracking events"
  on tracking_events for insert
  with check (user_id is null or auth.uid() = user_id);

-- QUICK REPLIES / ARCHIVES policies
create policy "Users manage own quick replies"
  on quick_replies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own archives"
  on message_thread_archives for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- SESSION MANAGEMENT RPCs
-- Lets a signed-in user list and revoke their own auth.sessions (device history).
-- ─────────────────────────────────────────
create or replace function public.list_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = auth, public
stable
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at::timestamptz,
    s.user_agent,
    host(s.ip)::text
  from auth.sessions s
  where s.user_id = auth.uid()
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_my_sessions() from public;
grant execute on function public.list_my_sessions() to authenticated;

create or replace function public.revoke_my_session(target_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions
  where id = target_session_id
    and user_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.revoke_my_session(uuid) from public;
grant execute on function public.revoke_my_session(uuid) to authenticated;

create or replace function public.revoke_my_other_sessions()
returns integer
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  current_sid uuid;
  n integer;
begin
  begin
    current_sid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  exception when others then
    current_sid := null;
  end;

  delete from auth.sessions
  where user_id = auth.uid()
    and (current_sid is null or id <> current_sid);

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.revoke_my_other_sessions() from public;
grant execute on function public.revoke_my_other_sessions() to authenticated;
