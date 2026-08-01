-- Escrow payments: platform hold → release transfer; Stripe customer id; service cancel policies.

-- ── users: Stripe Customer (no card PANs stored) ───────────────────────────
alter table users
  add column if not exists stripe_customer_id text;

create unique index if not exists users_stripe_customer_id_key
  on users (stripe_customer_id)
  where stripe_customer_id is not null;

-- ── services: Airbnb-style cancellation presets ────────────────────────────
alter table services
  add column if not exists cancellation_policy text
    check (cancellation_policy is null or cancellation_policy in ('flexible', 'moderate', 'strict'));

-- ── booking_requests: expand payment lifecycle ─────────────────────────────
-- Drop old check, migrate paid → released, add new columns + check.
alter table booking_requests
  drop constraint if exists booking_requests_payment_status_check;

update booking_requests
set payment_status = 'released'
where payment_status = 'paid';

alter table booking_requests
  add column if not exists held_at timestamptz,
  add column if not exists pending_release_at timestamptz,
  add column if not exists release_deadline_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists disputed_at timestamptz,
  add column if not exists refunded_at timestamptz,
  add column if not exists stripe_transfer_id text,
  add column if not exists platform_fee_ore integer,
  add column if not exists provider_payout_ore integer;

alter table booking_requests
  add constraint booking_requests_payment_status_check
  check (
    payment_status is null
    or payment_status in (
      'unpaid',
      'held',
      'pending_release',
      'released',
      'refunded',
      'partially_refunded',
      'disputed'
    )
  );

-- Quotes: store preset slug (flexible|moderate|strict) going forward; free text still allowed for legacy.
comment on column services.cancellation_policy is
  'Airbnb-style preset: flexible | moderate | strict. Required before publish when payments are live.';

comment on column booking_requests.payment_status is
  'Escrow: unpaid → held → pending_release → released (or refunded/disputed).';
