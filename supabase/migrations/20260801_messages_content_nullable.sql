-- Quote/image messages may have null body text (matches schema.sql intent).
alter table public.messages alter column content drop not null;

comment on column public.messages.content is
  'Plain text body; null when the message is quote-only or image-only.';
