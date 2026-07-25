-- Messaging extras: quick replies, archived threads, suggested-replies pref.
-- Run in Supabase SQL Editor if tables are missing.

create table if not exists quick_replies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users (id) on delete cascade,
  title       text not null,
  body        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists message_thread_archives (
  user_id             uuid not null references users (id) on delete cascade,
  booking_request_id  uuid not null references booking_requests (id) on delete cascade,
  archived_at         timestamptz not null default now(),
  primary key (user_id, booking_request_id)
);

alter table users add column if not exists suggested_replies_enabled boolean not null default true;

create index if not exists quick_replies_user_id_idx on quick_replies (user_id);
create index if not exists message_thread_archives_user_id_idx on message_thread_archives (user_id);

alter table quick_replies enable row level security;
alter table message_thread_archives enable row level security;

create policy "Users manage own quick replies"
  on quick_replies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own archives"
  on message_thread_archives for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
