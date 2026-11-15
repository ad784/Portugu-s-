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
