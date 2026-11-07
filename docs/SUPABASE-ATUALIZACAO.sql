-- Para o projeto existente com as migrations anteriores a 29/10/2026 aplicadas.
BEGIN;

-- 20261029120000_deduplicate_corrections.sql
-- Torna o cache de avaliações durável e impede histórico duplicado entre instâncias.
alter table public.redacoes add column if not exists avaliacao_hash text;
create unique index if not exists redacoes_user_avaliacao_hash_unique
  on public.redacoes (user_id, avaliacao_hash);

-- Os índices e as políticas existentes continuam separando os dados por usuário.
alter table public.redacoes enable row level security;


-- 20261030120000_record_signup_acceptance.sql
-- Apply before deploying the updated signup form. Existing accounts are retained;
-- no acceptance is invented for them. Receipts cannot be edited by the client.
create table if not exists public.legal_acceptances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  ai_consent boolean not null check (ai_consent),
  accepted_at timestamptz not null default now()
);
alter table public.legal_acceptances enable row level security;
revoke all on public.legal_acceptances from anon, authenticated;
grant select on public.legal_acceptances to authenticated;
drop policy if exists "Users read their own acceptance" on public.legal_acceptances;
create policy "Users read their own acceptance" on public.legal_acceptances
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.record_signup_acceptance()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_version', '') <> '2026-10-30'
    or coalesce(new.raw_user_meta_data ->> 'privacy_version', '') <> '2026-10-30'
    or coalesce(new.raw_user_meta_data ->> 'ai_consent', '') <> 'true' then
    raise exception 'Aceite os termos, a politica de privacidade e o processamento por IA.';
  end if;
  insert into public.legal_acceptances (user_id, terms_version, privacy_version, ai_consent)
    values (new.id, '2026-10-30', '2026-10-30', true);
  return new;
end;
$$;
revoke all on function public.record_signup_acceptance() from public;
drop trigger if exists on_auth_user_legal_acceptance on auth.users;
create trigger on_auth_user_legal_acceptance after insert on auth.users
for each row execute function public.record_signup_acceptance();


-- 20261030130000_manage_consent.sql
alter table public.legal_acceptances add column if not exists revoked_at timestamptz;
create table if not exists public.legal_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null check (event in ('accepted', 'revoked')),
  terms_version text not null,
  privacy_version text not null,
  created_at timestamptz not null default now()
);
alter table public.legal_events enable row level security;
revoke all on public.legal_events from anon, authenticated;
grant select on public.legal_events to authenticated;
drop policy if exists "Users read their own legal events" on public.legal_events;
create policy "Users read their own legal events" on public.legal_events for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.accept_current_terms(terms text, privacy text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if terms is distinct from '2026-10-30' or privacy is distinct from '2026-10-30' then raise exception 'Outdated documents'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if exists(select 1 from public.legal_acceptances where user_id = auth.uid() and terms_version = terms and privacy_version = privacy and revoked_at is null) then return; end if;
  insert into public.legal_acceptances(user_id, terms_version, privacy_version, ai_consent)
  values(auth.uid(), terms, privacy, true)
  on conflict(user_id) do update set terms_version = excluded.terms_version, privacy_version = excluded.privacy_version, ai_consent = true, accepted_at = now(), revoked_at = null;
end;
$$;
create or replace function public.revoke_ai_consent()
returns void language plpgsql security definer set search_path = '' as $$
declare receipt public.legal_acceptances;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  update public.legal_acceptances set revoked_at = now() where user_id = auth.uid() and revoked_at is null returning * into receipt;
  if found then insert into public.legal_events(user_id, event, terms_version, privacy_version) values(auth.uid(), 'revoked', receipt.terms_version, receipt.privacy_version); end if;
end;
$$;
revoke all on function public.accept_current_terms(text, text) from public;
revoke all on function public.revoke_ai_consent() from public;
grant execute on function public.accept_current_terms(text, text) to authenticated;
grant execute on function public.revoke_ai_consent() to authenticated;
-- Record initial signup receipts as audit events without rewriting old history.
create or replace function public.audit_signup_acceptance()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.revoked_at is null then
  insert into public.legal_events(user_id, event, terms_version, privacy_version, created_at)
  values(new.user_id, 'accepted', new.terms_version, new.privacy_version, new.accepted_at);
  end if;
  return new;
end;
$$;
revoke all on function public.audit_signup_acceptance() from public;
drop trigger if exists on_legal_acceptance_created on public.legal_acceptances;
create trigger on_legal_acceptance_created after insert or update on public.legal_acceptances for each row execute function public.audit_signup_acceptance();


-- 20261030140000_shared_correction_limits.sql
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


COMMIT;
