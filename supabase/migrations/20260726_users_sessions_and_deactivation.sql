-- Soft account deactivation + device-history RPCs over auth.sessions

alter table public.users
  add column if not exists deactivated_at timestamptz;

create or replace function public.list_my_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamptz,
  user_agent text,
  ip text
)
language sql
security definer
set search_path = auth, public
stable
as $$
  select
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at::timestamptz,
    s.user_agent,
    host(s.ip)::text
  from auth.sessions s
  where s.user_id = auth.uid()
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_my_sessions() from public;
grant execute on function public.list_my_sessions() to authenticated;

create or replace function public.revoke_my_session(target_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  delete from auth.sessions
  where id = target_session_id
    and user_id = auth.uid();
  return found;
end;
$$;

revoke all on function public.revoke_my_session(uuid) from public;
grant execute on function public.revoke_my_session(uuid) to authenticated;

create or replace function public.revoke_my_other_sessions()
returns integer
language plpgsql
security definer
set search_path = auth, public
as $$
declare
  current_sid uuid;
  n integer;
begin
  begin
    current_sid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  exception when others then
    current_sid := null;
  end;

  delete from auth.sessions
  where user_id = auth.uid()
    and (current_sid is null or id <> current_sid);

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.revoke_my_other_sessions() from public;
grant execute on function public.revoke_my_other_sessions() to authenticated;
