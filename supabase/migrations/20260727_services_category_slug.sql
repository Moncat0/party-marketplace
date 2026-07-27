-- Canonical browse category for services (separate from booking event_type).
alter table public.services
  add column if not exists category_slug text;

alter table public.services
  drop constraint if exists services_category_slug_check;

alter table public.services
  add constraint services_category_slug_check
  check (
    category_slug is null
    or category_slug in (
      'dj',
      'fotograf',
      'musik',
      'makeup',
      'underhallning',
      'catering',
      'barnkalas',
      'brollop'
    )
  );

create index if not exists services_category_slug_idx
  on public.services (category_slug);

-- Backfill from legacy free-text category_tags (labels + aliases).
update public.services s
set category_slug = matched.slug
from (
  select
    id,
    case
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('dj')
      ) then 'dj'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('fotograf', 'fotografi')
      ) then 'fotograf'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('musik', 'artist', 'sångare', 'sangare', 'band', 'musik & artister')
      ) then 'musik'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('makeup', 'makeupartist', 'styling', 'makeup & styling')
      ) then 'makeup'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('underhållning', 'underhallning', 'trollkonstnär', 'trollkonstnar', 'komiker', 'underhållare', 'underhallare')
      ) then 'underhallning'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('catering', 'kock', 'mat', 'catering & kock')
      ) then 'catering'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('barnkalas', 'barn', 'barnunderhållning', 'barnunderhallning', 'ballongkonstnär', 'ballongkonstnar')
      ) then 'barnkalas'
      when exists (
        select 1 from unnest(coalesce(category_tags, '{}')) t
        where lower(t) in ('bröllop', 'brollop', 'wedding')
      ) then 'brollop'
      else null
    end as slug
  from public.services
) matched
where s.id = matched.id
  and s.category_slug is null
  and matched.slug is not null;

-- Keep category_tags[0] aligned with slug for legacy readers.
update public.services
set category_tags = array[category_slug]
where category_slug is not null
  and (
    category_tags is null
    or cardinality(category_tags) = 0
    or lower(category_tags[1]) is distinct from category_slug
  );
