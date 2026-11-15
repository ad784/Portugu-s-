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
