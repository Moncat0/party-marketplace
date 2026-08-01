-- Provider UX: travel flag, cancel bookings, withdraw quotes

alter table services
  add column if not exists can_travel boolean not null default false;

comment on column services.can_travel is
  'When true, listing appears in location searches outside the host base / service city.';

-- booking_requests: cancelled status + audit / refund fields
alter table booking_requests
  drop constraint if exists booking_requests_status_check;

alter table booking_requests
  add constraint booking_requests_status_check
  check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled'));

alter table booking_requests
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text
    check (cancelled_by is null or cancelled_by in ('planner', 'provider')),
  add column if not exists cancel_reason text,
  add column if not exists refund_ore integer,
  add column if not exists stripe_refund_id text;

-- quotes: withdrawn status
alter table quotes
  drop constraint if exists quotes_status_check;

alter table quotes
  add constraint quotes_status_check
  check (status in ('pending', 'accepted', 'declined', 'withdrawn'));
