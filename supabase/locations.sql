-- Controlled provider locations (Stockholm launch)

alter table provider_profiles
  add column if not exists location_id text not null default 'stockholm';

-- Backfill from legacy free-text city
update provider_profiles
set location_id = case
  when lower(trim(coalesce(city, ''))) in ('göteborg', 'goteborg', 'gothenburg') then 'goteborg'
  when lower(trim(coalesce(city, ''))) in ('malmö', 'malmo') then 'malmo'
  when lower(trim(coalesce(city, ''))) = 'uppsala' then 'uppsala'
  else 'stockholm'
end
where location_id is null or location_id = 'stockholm';

-- Keep city label in sync for existing display code
update provider_profiles set city = 'Stockholm' where location_id = 'stockholm';
update provider_profiles set city = 'Göteborg' where location_id = 'goteborg';
update provider_profiles set city = 'Malmö' where location_id = 'malmo';
update provider_profiles set city = 'Uppsala' where location_id = 'uppsala';

create index if not exists provider_profiles_location_id_idx on provider_profiles (location_id);
