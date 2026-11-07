-- Durable per-account limits shared by serverless instances. Clients cannot
-- edit counters. A lease prevents parallel AI requests and expires on crashes.
create table if not exists public.correction_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day_start timestamptz not null default now(), day_count integer not null default 0,
  minute_start timestamptz not null default now(), minute_count integer not null default 0,
  active_until timestamptz, reservation uuid
);
alter table public.correction_usage enable row level security;
revoke all on public.correction_usage from anon, authenticated;
create or replace function public.reserve_correction()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare usage public.correction_usage; stamp timestamptz := clock_timestamp(); ticket uuid := gen_random_uuid();
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.correction_usage(user_id) values(auth.uid()) on conflict do nothing;
  select * into usage from public.correction_usage where user_id = auth.uid() for update;
  if usage.active_until > stamp then return jsonb_build_object('allowed', false, 'retry_after', ceil(extract(epoch from usage.active_until - stamp))); end if;
  if usage.day_start + interval '24 hours' <= stamp then usage.day_start := stamp; usage.day_count := 0; end if;
  if usage.minute_start + interval '1 minute' <= stamp then usage.minute_start := stamp; usage.minute_count := 0; end if;
  if usage.day_count >= 30 then return jsonb_build_object('allowed', false, 'retry_after', ceil(extract(epoch from usage.day_start + interval '24 hours' - stamp))); end if;
  if usage.minute_count >= 4 then return jsonb_build_object('allowed', false, 'retry_after', ceil(extract(epoch from usage.minute_start + interval '1 minute' - stamp))); end if;
  update public.correction_usage set day_start = usage.day_start, day_count = usage.day_count + 1,
    minute_start = usage.minute_start, minute_count = usage.minute_count + 1,
    active_until = stamp + interval '120 seconds', reservation = ticket where user_id = auth.uid();
  return jsonb_build_object('allowed', true, 'reservation', ticket);
end;
$$;
create or replace function public.release_correction(reservation uuid)
returns void language sql security definer set search_path = '' as $$
  update public.correction_usage set active_until = null, reservation = null
  where user_id = auth.uid() and correction_usage.reservation = $1;
$$;
revoke all on function public.reserve_correction() from public;
revoke all on function public.release_correction(uuid) from public;
grant execute on function public.reserve_correction() to authenticated;
grant execute on function public.release_correction(uuid) to authenticated;
