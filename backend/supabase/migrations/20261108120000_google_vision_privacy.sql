-- Apply BEFORE enabling PHOTO_READER=google. Compatible with the existing Groq reader.
-- Existing receipts are preserved, never upgraded without a new acceptance.
create or replace function public.record_signup_acceptance()
returns trigger language plpgsql security definer set search_path = '' as $$
declare privacy text := new.raw_user_meta_data ->> 'privacy_version';
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_version', '') <> '2026-10-30'
    or coalesce(privacy, '') not in ('2026-10-30', '2026-11-08')
    or coalesce(new.raw_user_meta_data ->> 'ai_consent', '') <> 'true' then
    raise exception 'Aceite os termos, a politica de privacidade e o processamento por IA.';
  end if;
  insert into public.legal_acceptances(user_id, terms_version, privacy_version, ai_consent)
    values(new.id, '2026-10-30', privacy, true);
  return new;
end;
$$;
create or replace function public.accept_current_terms(terms text, privacy text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if terms is distinct from '2026-10-30' or privacy is null or privacy not in ('2026-10-30', '2026-11-08') then raise exception 'Outdated documents'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  if exists(select 1 from public.legal_acceptances where user_id = auth.uid() and terms_version = terms and privacy_version = privacy and revoked_at is null) then return; end if;
  insert into public.legal_acceptances(user_id, terms_version, privacy_version, ai_consent)
  values(auth.uid(), terms, privacy, true)
  on conflict(user_id) do update set terms_version = excluded.terms_version, privacy_version = excluded.privacy_version, ai_consent = true, accepted_at = now(), revoked_at = null;
end;
$$;
revoke all on function public.record_signup_acceptance() from public;
revoke all on function public.accept_current_terms(text, text) from public;
grant execute on function public.accept_current_terms(text, text) to authenticated;
