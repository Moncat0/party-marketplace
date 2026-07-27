-- Provider → Services split (clean cut)
-- Creates services from listing fields on provider_profiles and rewires FKs.

-- 0. DEDUPE provider_profiles (keep oldest per user)
do $$
begin
  update public.booking_requests br
  set provider_profile_id = keeper.id
  from public.provider_profiles newer
  join public.provider_profiles keeper
    on keeper.user_id = newer.user_id
   and keeper.created_at < newer.created_at
  where br.provider_profile_id = newer.id;

  update public.shortlist_items si
  set provider_profile_id = keeper.id
  from public.provider_profiles newer
  join public.provider_profiles keeper
    on keeper.user_id = newer.user_id
   and keeper.created_at < newer.created_at
  where si.provider_profile_id = newer.id;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'quotes'
  ) then
    update public.quotes q
    set provider_profile_id = keeper.id
    from public.provider_profiles newer
    join public.provider_profiles keeper
      on keeper.user_id = newer.user_id
     and keeper.created_at < newer.created_at
    where q.provider_profile_id = newer.id;
  end if;

  delete from public.provider_profiles pp
  using public.provider_profiles newer
  where pp.user_id = newer.user_id
    and pp.created_at > newer.created_at;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'provider_profiles_user_id_key'
  ) then
    alter table public.provider_profiles
      add constraint provider_profiles_user_id_key unique (user_id);
  end if;
end $$;

create table if not exists public.services (
  id                  uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles (id) on delete cascade,
  title               text,
  description         text,
  category_tags       text[] default '{}',
  city                text default 'Stockholm',
  location_id         text not null default 'stockholm',
  price_range_min     integer,
  price_range_max     integer,
  photos              text[] default '{}',
  is_published        boolean not null default false,
  view_count          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (provider_profile_id)
);

create index if not exists services_is_published_idx on public.services (is_published);
create index if not exists services_city_idx on public.services (city);
create index if not exists services_location_id_idx on public.services (location_id);
create index if not exists services_provider_profile_id_idx on public.services (provider_profile_id);

insert into public.services (
  provider_profile_id, title, description, category_tags, city, location_id,
  price_range_min, price_range_max, photos, is_published, view_count, created_at, updated_at
)
select
  pp.id, pp.service_title, pp.service_description, coalesce(pp.category_tags, '{}'),
  coalesce(pp.city, 'Stockholm'), coalesce(pp.location_id, 'stockholm'),
  pp.price_range_min, pp.price_range_max, coalesce(pp.photos, '{}'),
  pp.is_published, coalesce(pp.profile_views, 0), pp.created_at, now()
from public.provider_profiles pp
where not exists (select 1 from public.services s where s.provider_profile_id = pp.id);

alter table public.booking_requests
  add column if not exists service_id uuid references public.services (id) on delete cascade;

update public.booking_requests br
set service_id = s.id
from public.services s
where s.provider_profile_id = br.provider_profile_id and br.service_id is null;

alter table public.shortlist_items
  add column if not exists service_id uuid references public.services (id) on delete cascade;

update public.shortlist_items si
set service_id = s.id
from public.services s
where s.provider_profile_id = si.provider_profile_id and si.service_id is null;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'quotes') then
    alter table public.quotes
      add column if not exists service_id uuid references public.services (id) on delete cascade;
    update public.quotes q
    set service_id = s.id
    from public.services s
    where s.provider_profile_id = q.provider_profile_id and q.service_id is null;
  end if;
end $$;

alter table public.reviews
  add column if not exists service_id uuid references public.services (id) on delete set null;

update public.reviews r
set service_id = br.service_id
from public.booking_requests br
where br.id = r.booking_request_id and r.service_id is null and br.service_id is not null;

delete from public.shortlist_items where service_id is null;
delete from public.booking_requests where service_id is null;

alter table public.booking_requests alter column service_id set not null;
alter table public.shortlist_items alter column service_id set not null;

alter table public.shortlist_items
  drop constraint if exists shortlist_items_shortlist_id_provider_profile_id_key;

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'shortlist_items' and constraint_name = 'shortlist_items_shortlist_id_service_id_key'
  ) then
    alter table public.shortlist_items
      add constraint shortlist_items_shortlist_id_service_id_key unique (shortlist_id, service_id);
  end if;
end $$;

alter table public.booking_requests drop constraint if exists booking_requests_provider_profile_id_fkey;
alter table public.booking_requests drop column if exists provider_profile_id;
alter table public.shortlist_items drop constraint if exists shortlist_items_provider_profile_id_fkey;
alter table public.shortlist_items drop column if exists provider_profile_id;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes' and column_name = 'provider_profile_id'
  ) then
    delete from public.quotes where service_id is null;
    alter table public.quotes drop constraint if exists quotes_provider_profile_id_fkey;
    alter table public.quotes drop column if exists provider_profile_id;
    begin
      alter table public.quotes alter column service_id set not null;
    exception when others then null;
    end;
  end if;
end $$;

create index if not exists booking_requests_service_id_idx on public.booking_requests (service_id);
create index if not exists shortlist_items_service_id_idx on public.shortlist_items (service_id);
create index if not exists reviews_service_id_idx on public.reviews (service_id);

alter table public.provider_profiles add column if not exists bio text;
alter table public.provider_profiles drop column if exists service_title;
alter table public.provider_profiles drop column if exists service_description;
alter table public.provider_profiles drop column if exists category_tags;
alter table public.provider_profiles drop column if exists price_range_min;
alter table public.provider_profiles drop column if exists price_range_max;
alter table public.provider_profiles drop column if exists photos;
alter table public.provider_profiles drop column if exists is_published;
alter table public.provider_profiles drop column if exists profile_views;

alter table public.services enable row level security;

drop policy if exists "Published profiles are publicly readable" on public.provider_profiles;
drop policy if exists "Providers can insert their own profile" on public.provider_profiles;
drop policy if exists "Providers can update their own profile" on public.provider_profiles;

create policy "Provider profiles are publicly readable"
  on public.provider_profiles for select using (true);
create policy "Providers can insert their own profile"
  on public.provider_profiles for insert with check (auth.uid() = user_id);
create policy "Providers can update their own profile"
  on public.provider_profiles for update using (auth.uid() = user_id);

drop policy if exists "Published services are publicly readable" on public.services;
drop policy if exists "Providers can insert their own services" on public.services;
drop policy if exists "Providers can update their own services" on public.services;

create policy "Published services are publicly readable"
  on public.services for select
  using (
    is_published = true
    or auth.uid() = (select user_id from public.provider_profiles where id = provider_profile_id)
  );
create policy "Providers can insert their own services"
  on public.services for insert
  with check (
    auth.uid() = (select user_id from public.provider_profiles where id = provider_profile_id)
  );
create policy "Providers can update their own services"
  on public.services for update
  using (
    auth.uid() = (select user_id from public.provider_profiles where id = provider_profile_id)
  );

drop policy if exists "Planners can read their own requests" on public.booking_requests;
drop policy if exists "Providers can update request status" on public.booking_requests;

create policy "Planners can read their own requests"
  on public.booking_requests for select
  using (
    auth.uid() = planner_id
    or auth.uid() = (
      select pp.user_id from public.services s
      join public.provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );
create policy "Providers can update request status"
  on public.booking_requests for update
  using (
    auth.uid() = (
      select pp.user_id from public.services s
      join public.provider_profiles pp on pp.id = s.provider_profile_id
      where s.id = service_id
    )
  );

drop policy if exists "Booking participants can read messages" on public.messages;
drop policy if exists "Booking participants can send messages" on public.messages;

create policy "Booking participants can read messages"
  on public.messages for select
  using (
    auth.uid() = sender_id
    or auth.uid() = (select planner_id from public.booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from public.booking_requests br
      join public.services s on s.id = br.service_id
      join public.provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  );
create policy "Booking participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and (
      auth.uid() = (select planner_id from public.booking_requests where id = booking_request_id)
      or auth.uid() = (
        select pp.user_id from public.booking_requests br
        join public.services s on s.id = br.service_id
        join public.provider_profiles pp on pp.id = s.provider_profile_id
        where br.id = booking_request_id
      )
    )
  );
