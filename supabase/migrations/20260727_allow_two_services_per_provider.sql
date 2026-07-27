-- Allow up to 2 services per provider (app-enforced).
-- Was unique(provider_profile_id) at launch.

alter table public.services
  drop constraint if exists services_provider_profile_id_key;

create index if not exists services_provider_profile_id_idx
  on public.services (provider_profile_id);
