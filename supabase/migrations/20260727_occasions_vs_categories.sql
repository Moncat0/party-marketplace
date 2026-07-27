-- Separate talent categories from party occasions.
-- services.occasions = which tillfällen the talent serves (multi).
-- booking_requests.occasions = tillfällen on the förfrågan (multi).
-- Keep event_type in sync with occasions[1] for older readers.

-- 1) Fix mixed category data (bröllop/barnkalas were occasions, not talent types)
update public.services
set
  category_slug = case category_slug
    when 'brollop' then 'fotograf'
    when 'barnkalas' then 'underhallning'
    else category_slug
  end,
  category_tags = case category_slug
    when 'brollop' then array['fotograf']::text[]
    when 'barnkalas' then array['underhallning']::text[]
    else category_tags
  end
where category_slug in ('brollop', 'barnkalas');

-- 2) Tighten category check to talent types only
alter table public.services drop constraint if exists services_category_slug_check;
alter table public.services
  add constraint services_category_slug_check
  check (
    category_slug is null
    or category_slug in (
      'dj', 'fotograf', 'musik', 'makeup', 'underhallning', 'catering'
    )
  );

-- 3) Occasions on services
alter table public.services
  add column if not exists occasions text[] not null default '{}';

comment on column public.services.occasions is
  'Party occasions this service is a good fit for (multi). Orthogonal to category_slug.';

-- 4) Occasions on booking requests
alter table public.booking_requests
  add column if not exists occasions text[] not null default '{}';

comment on column public.booking_requests.occasions is
  'Occasions selected on the förfrågan (multi). event_type mirrors occasions[1] when set.';

-- Backfill bookings from legacy single event_type
update public.booking_requests
set occasions = array[event_type]
where event_type is not null
  and event_type <> ''
  and (occasions is null or cardinality(occasions) = 0);

-- Expand event_type check to new occasion slugs (still single legacy column)
alter table public.booking_requests drop constraint if exists booking_requests_event_type_check;
alter table public.booking_requests
  add constraint booking_requests_event_type_check
  check (
    event_type is null
    or event_type in (
      'birthday', 'kids', 'wedding', 'corporate', 'graduation',
      'crayfish', 'midsommar', 'christmas', 'hen_stag', 'anniversary',
      'housewarming', 'other'
    )
  );
