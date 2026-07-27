-- Fast inbox meta: last message + unread per booking without downloading full threads.

create or replace function public.inbox_thread_meta(
  p_booking_ids uuid[],
  p_viewer uuid
)
returns table (
  booking_request_id uuid,
  last_content text,
  last_image_url text,
  last_created_at timestamptz,
  last_sender_id uuid,
  unread_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    b.id as booking_request_id,
    lm.content as last_content,
    lm.image_url as last_image_url,
    lm.created_at as last_created_at,
    lm.sender_id as last_sender_id,
    coalesce((
      select count(*)::bigint
      from messages m2
      where m2.booking_request_id = b.id
        and m2.read_at is null
        and m2.sender_id <> p_viewer
    ), 0) as unread_count
  from unnest(p_booking_ids) as b(id)
  left join lateral (
    select m.content, m.image_url, m.created_at, m.sender_id
    from messages m
    where m.booking_request_id = b.id
    order by m.created_at desc
    limit 1
  ) lm on true;
$$;

grant execute on function public.inbox_thread_meta(uuid[], uuid) to authenticated;
grant execute on function public.inbox_thread_meta(uuid[], uuid) to service_role;
