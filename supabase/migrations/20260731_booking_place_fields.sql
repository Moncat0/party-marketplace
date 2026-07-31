-- Structured place fields for booking event addresses (Google Places).
alter table public.booking_requests
  add column if not exists event_place_id text,
  add column if not exists event_lat double precision,
  add column if not exists event_lng double precision;

comment on column public.booking_requests.event_place_id is
  'Google Places place id when address was chosen from autocomplete';
comment on column public.booking_requests.event_lat is
  'Event location latitude from Places (WGS84)';
comment on column public.booking_requests.event_lng is
  'Event location longitude from Places (WGS84)';
