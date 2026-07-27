-- Privacy preferences + data export tracking on users
alter table users
  add column if not exists privacy_read_receipts boolean not null default true,
  add column if not exists privacy_review_show_city boolean not null default true,
  add column if not exists privacy_review_show_booked_services boolean not null default false,
  add column if not exists data_export_requested_at timestamptz;

comment on column users.privacy_read_receipts is 'When true, others can see when this user has read their messages';
comment on column users.privacy_review_show_city is 'When true, show home city on reviews written by this user';
comment on column users.privacy_review_show_booked_services is 'When true, show booked service info on reviews written by this user';
