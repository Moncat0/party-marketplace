-- Airbnb-style personal information fields
alter table public.users
  add column if not exists preferred_first_name text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists address_city text,
  add column if not exists address_postal_code text,
  add column if not exists address_country text;

-- Default preferred first name from legal first name where missing
update public.users
set preferred_first_name = first_name
where preferred_first_name is null
  and first_name is not null
  and length(trim(first_name)) > 0;
