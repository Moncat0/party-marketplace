-- Pause listings (hide from search) + allow providers to delete their services.

alter table public.services
  add column if not exists is_disabled boolean not null default false;

create index if not exists services_is_disabled_idx
  on public.services (is_disabled)
  where is_disabled = false;

drop policy if exists "Published services are publicly readable" on public.services;
create policy "Published services are publicly readable"
  on public.services for select
  using (
    (is_published = true and is_disabled = false)
    or auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );

drop policy if exists "Providers can delete their own services" on public.services;
create policy "Providers can delete their own services"
  on public.services for delete
  using (
    auth.uid() = (select user_id from provider_profiles where id = provider_profile_id)
  );
