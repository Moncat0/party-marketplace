-- Messaging hardening: column-level update + realtime for live threads.

-- 1) Only read_at may be updated by authenticated clients (mark-as-read).
revoke update on table public.messages from authenticated, anon;
grant update (read_at) on table public.messages to authenticated;

-- Keep existing participant RLS for UPDATE; column grant enforces field scope.
drop policy if exists "Booking participants can mark messages read" on public.messages;
create policy "Booking participants can mark messages read"
  on public.messages for update
  using (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join services s on s.id = br.service_id
      join provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  )
  with check (
    auth.uid() = (select planner_id from booking_requests where id = booking_request_id)
    or auth.uid() = (
      select pp.user_id from booking_requests br
      join services s on s.id = br.service_id
      join provider_profiles pp on pp.id = s.provider_profile_id
      where br.id = booking_request_id
    )
  );

-- 2) Enable Realtime for messages (idempotent)
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
