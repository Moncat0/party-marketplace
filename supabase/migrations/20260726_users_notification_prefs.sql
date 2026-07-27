-- Granular marketing notification preferences (Offers and updates tab)
alter table users
  add column if not exists notif_provider_news boolean not null default true,
  add column if not exists notif_provider_regs boolean not null default true,
  add column if not exists notif_festen_news boolean not null default true,
  add column if not exists notif_festen_feedback boolean not null default true;

comment on column users.notif_provider_news is 'Marketing: provider program/feature updates';
comment on column users.notif_provider_regs is 'Marketing: local rules and regulations for providers';
comment on column users.notif_festen_news is 'Marketing: FESTEN news and programs';
comment on column users.notif_festen_feedback is 'Marketing: feedback requests from FESTEN';
