-- FESTEN. — Party Services Marketplace
-- Database schema. Run this in the Supabase SQL Editor to create all tables.
-- All user-facing text in the app is in Swedish. The database stores raw data only.

-- ─────────────────────────────────────────
-- CLEAN SLATE
-- Drop all tables in reverse dependency order before recreating them.
-- This is safe to run on a fresh project — it just clears any partial setup.
-- ─────────────────────────────────────────
drop table if exists tracking_events cascade;
drop table if exists reviews cascade;
drop table if exists messages cascade;
drop table if exists shortlist_items cascade;
drop table if exists shortlists cascade;
drop table if exists booking_requests cascade;
drop table if exists provider_profiles cascade;
drop table if exists users cascade;

-- Enable the pgcrypto extension so Supabase can auto-generate UUIDs.
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- USERS
-- Every person who signs up, whether they are a provider, a planner, or both.
-- ─────────────────────────────────────────
create table users (
  id              uuid primary key default gen_random_uuid(),
  email           text unique not null,
  name            text,
  avatar_url      text,
  user_type       text not null default 'planner'
                    check (user_type in ('provider', 'planner', 'both')),
  auth_provider   text
                    check (auth_provider in ('google', 'facebook', 'apple', 'email')),
  signup_source   text default 'organic'
                    check (signup_source in ('organic', 'shared_profile', 'shared_shortlist', 'invite')),
  referrer_id     uuid references users (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PROVIDER PROFILES
-- The public listing for each provider — what planners see when they browse.
-- ─────────────────────────────────────────
create table provider_profiles (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references users (id) on delete cascade,
  service_title             text,
  service_description       text,
  category_tags             text[] default '{}',
  city                      text default 'Stockholm',
  price_range_min           integer,
  price_range_max           integer,
  photos                    text[] default '{}',
  party_animal_portrait_url text,
  is_published              boolean not null default false,
  profile_views             integer not null default 0,
  created_at                timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- BOOKING REQUESTS
-- When a planner wants to book a provider for their event.
-- ─────────────────────────────────────────
create table booking_requests (
  id                  uuid primary key default gen_random_uuid(),
  planner_id          uuid not null references users (id) on delete cascade,
  provider_profile_id uuid not null references provider_profiles (id) on delete cascade,
  event_date          date,
  event_location      text,
  guest_count         integer,
  event_type          text
                        check (event_type in ('birthday', 'wedding', 'corporate', 'kids', 'other')),
  description         text,
  status              text not null default 'pending'
                        check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MESSAGES
-- Chat messages between a planner and a provider, tied to a booking request.
-- Messaging is only available after a booking request has been sent.
-- ─────────────────────────────────────────
create table messages (
  id                  uuid primary key default gen_random_uuid(),
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
  sender_id           uuid not null references users (id) on delete cascade,
  content             text not null,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SHORTLISTS
-- A planner's saved collection of providers they are interested in.
-- Each shortlist has a unique share_token so it can be shared as a link.
-- ─────────────────────────────────────────
create table shortlists (
  id          uuid primary key default gen_random_uuid(),
  planner_id  uuid not null references users (id) on delete cascade,
  share_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- SHORTLIST ITEMS
-- The individual providers inside a shortlist.
-- ─────────────────────────────────────────
create table shortlist_items (
  id                  uuid primary key default gen_random_uuid(),
  shortlist_id        uuid not null references shortlists (id) on delete cascade,
  provider_profile_id uuid not null references provider_profiles (id) on delete cascade,
  added_at            timestamptz not null default now(),
  unique (shortlist_id, provider_profile_id)
);

-- ─────────────────────────────────────────
-- REVIEWS
-- Star ratings left by planners and providers after an event.
-- Both sides can review each other (reviewer_id → reviewee_id).
-- ─────────────────────────────────────────
create table reviews (
  id                  uuid primary key default gen_random_uuid(),
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
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

-- ─────────────────────────────────────────
-- INDEXES
-- These speed up the most common queries — e.g. "show me all providers in Stockholm",
-- "load all messages for this booking", "find this shortlist by its share token".
-- ─────────────────────────────────────────
create index on provider_profiles (is_published);
create index on provider_profiles (city);
create index on provider_profiles (user_id);
create index on booking_requests (planner_id);
create index on booking_requests (provider_profile_id);
create index on booking_requests (status);
create index on messages (booking_request_id);
create index on messages (sender_id);
create index on shortlists (planner_id);
create index on shortlists (share_token);
create index on shortlist_items (shortlist_id);
create index on reviews (reviewee_id);
create index on tracking_events (user_id);
create index on tracking_events (event_name);
create index on tracking_events (created_at);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- This is Supabase's built-in security layer.
-- It means users can only see and edit their own data — not other people's.
-- Think of it as locking each row in the database to the person it belongs to.
-- ─────────────────────────────────────────

alter table users enable row level security;
alter table provider_profiles enable row level security;
alter table booking_requests enable row level security;
alter table messages enable row level security;
alter table shortlists enable row level security;
alter table shortlist_items enable row level security;
alter table reviews enable row level security;
alter table tracking_events enable row level security;

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
-- Published profiles are visible to everyone (for browsing).
-- Providers can only edit their own profile.
create policy "Published profiles are publicly readable"
  on provider_profiles for select
  using (is_published = true or auth.uid() = user_id);

create policy "Providers can insert their own profile"
  on provider_profiles for insert
  with check (auth.uid() = user_id);

create policy "Providers can update their own profile"
  on provider_profiles for update
  using (auth.uid() = user_id);

-- BOOKING REQUESTS policies
-- A planner can see their own requests. A provider can see requests sent to them.
create policy "Planners can read their own requests"
  on booking_requests for select
  using (
    auth.uid() = planner_id
    or auth.uid() = (
      select user_id from provider_profiles where id = provider_profile_id
    )
  );

create policy "Planners can create booking requests"
  on booking_requests for insert
  with check (auth.uid() = planner_id);

create policy "Providers can update request status"
  on booking_requests for update
  using (
    auth.uid() = (
      select user_id from provider_profiles where id = provider_profile_id
    )
  );

-- MESSAGES policies
-- Only the planner and provider involved in a booking can read or send messages.
create policy "Booking participants can read messages"
  on messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = (
      select planner_id from booking_requests where id = booking_request_id
    )
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join provider_profiles pp on pp.id = br.provider_profile_id
      where br.id = booking_request_id
    )
  );

create policy "Booking participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id
    and (
      auth.uid() = (
        select planner_id from booking_requests where id = booking_request_id
      )
      or auth.uid() = (
        select pp.user_id from booking_requests br
        join provider_profiles pp on pp.id = br.provider_profile_id
        where br.id = booking_request_id
      )
    )
  );

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

-- REVIEWS policies
-- Reviews are public (they show on provider profiles).
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
