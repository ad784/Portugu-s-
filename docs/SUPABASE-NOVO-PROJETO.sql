-- SOMENTE PARA UM BANCO NOVO. Em banco existente, execute apenas migrations ainda não aplicadas.
BEGIN;

-- 20260805162000_create_profiles_and_redacoes.sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  created_at timestamptz not null default now()
);

create table if not exists public.redacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('texto', 'foto')),
  conteudo text,
  resultado text not null,
  nota integer check (nota between 0 and 1000),
  linhas integer check (linhas >= 0),
  created_at timestamptz not null default now()
);

create index if not exists redacoes_user_id_created_at_idx
  on public.redacoes (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.redacoes enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create policy "Users read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.is_admin());

create policy "Users read their own essays"
on public.redacoes for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

create policy "Users insert their own essays"
on public.redacoes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data ->> 'nome')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, nome)
select id, raw_user_meta_data ->> 'nome'
from auth.users
on conflict (id) do nothing;


-- 20260805170000_add_photo_storage.sql
alter table public.redacoes
  add column if not exists imagem_path text;

insert into storage.buckets (id, name, public)
values ('redacoes', 'redacoes', false)
on conflict (id) do nothing;


-- 20260830190000_add_theme_and_storage_policies.sql
alter table public.redacoes
  add column if not exists tema text;

-- Repara bancos configurados manualmente onde a tabela existe, mas as
-- políticas originais não foram executadas. Sem estas políticas, uma sessão
-- válida pode abrir a tela de histórico, porém não consegue gravar ou ler as
-- próprias redações por causa do RLS.
alter table public.redacoes enable row level security;

drop policy if exists "Users read their own essays" on public.redacoes;
create policy "Users read their own essays"
on public.redacoes for select
to authenticated
using (
  (select auth.uid()) = user_id
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
);

drop policy if exists "Users insert their own essays" on public.redacoes;
create policy "Users insert their own essays"
on public.redacoes for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- Cada estudante pode acessar somente as imagens da própria pasta no bucket privado.
drop policy if exists "Users read their own essay photos" on storage.objects;
create policy "Users read their own essay photos"
on storage.objects for select
to authenticated
using (
  bucket_id = 'redacoes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users delete their own essay photos" on storage.objects;
create policy "Users delete their own essay photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'redacoes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);


-- 20261013120000_allow_users_to_insert_own_profile.sql
-- A rota de perfil usa upsert. Permita inserir somente a linha do proprio usuario.
drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);


-- 20261017120000_allow_users_to_upload_own_essay_photos.sql
-- O backend usa o token do proprio estudante para enviar fotos, sem uma
-- chave administrativa do Supabase. Cada conta so pode gravar na propria pasta.
drop policy if exists "Users upload their own essay photos" on storage.objects;
create policy "Users upload their own essay photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'redacoes'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);


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


-- 20261108120000_google_vision_privacy.sql
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


-- 20261125235731_exercise_attempts.sql
-- Practice history is separate from essay grades. Only its owner can read or insert rows.
create table public.exercise_attempts (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  skill_id text not null check (skill_id in ('introducao', 'tese', 'argumentacao', 'repertorio', 'coesao', 'conclusao')),
  theme_id text not null check (theme_id in ('inclusao-digital', 'alimentos', 'cultura', 'mobilidade')),
  answers integer[] not null check (cardinality(answers) = 3 and answers <@ array[0,1,2] and array_position(answers, null) is null),
  correct_count smallint not null check (correct_count between 0 and 3),
  question_count smallint not null default 3 check (question_count = 3),
  original_text text not null check (char_length(original_text) between 1 and 4000),
  revised_text text check (char_length(revised_text) between 1 and 4000),
  self_checks boolean[] not null check (cardinality(self_checks) = 3 and array_position(self_checks, null) is null),
  revision_checks boolean[] not null check (cardinality(revision_checks) = 3 and array_position(revision_checks, null) is null),
  material_version smallint not null default 1 check (material_version = 1),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index exercise_attempts_user_date_idx on public.exercise_attempts (user_id, created_at desc, id desc);
alter table public.exercise_attempts enable row level security;
revoke all on public.exercise_attempts from anon, authenticated;
grant select, insert on public.exercise_attempts to authenticated;
create policy exercise_attempts_read_own on public.exercise_attempts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy exercise_attempts_insert_own on public.exercise_attempts for insert to authenticated
  with check ((select auth.uid()) = user_id);


-- 20261126220041_exercise_difficulty_levels.sql
-- Existing v1 rows remain unchanged and distinct from the new difficulty rounds.
alter table public.exercise_attempts
  add column level_id text,
  add column question_ids text[],
  drop constraint exercise_attempts_answers_check,
  drop constraint exercise_attempts_correct_count_check,
  drop constraint exercise_attempts_question_count_check,
  drop constraint exercise_attempts_material_version_check;

alter table public.exercise_attempts
  add constraint exercise_attempts_answers_check check (
    cardinality(answers) = question_count and answers <@ array[0,1,2]
    and array_position(answers, null) is null
  ),
  add constraint exercise_attempts_correct_count_check check (correct_count between 0 and question_count),
  add constraint exercise_attempts_material_shape_check check (
    (material_version = 1 and level_id is null and question_ids is null and question_count = 3)
    or
    (material_version = 2 and level_id is not null and level_id in ('facil','medio','dificil')
      and question_ids is not null and cardinality(question_ids) = 20
      and array_position(question_ids, null) is null and question_count = 20)
  );

create index exercise_attempts_user_level_date_idx
  on public.exercise_attempts (user_id, level_id, created_at desc, id desc);


-- 20261126223008_technical_evaluations.sql
create table public.technical_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  evaluation_hash text not null check (evaluation_hash ~ '^[a-f0-9]{64}$'),
  mode text not null check (mode in ('concurso','enade')),
  task_type text not null check (task_type in ('redacao','questao') and (mode <> 'enade' or task_type = 'questao')),
  area text not null check (char_length(area) between 1 and 160),
  board text not null default '' check (char_length(board) <= 160),
  score numeric(8,2) not null check (score >= 0),
  max_score numeric(8,2) not null check (max_score > 0 and max_score <= 1000 and score <= max_score),
  reference_based boolean not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  result jsonb not null check (jsonb_typeof(result) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, evaluation_hash)
);
create index technical_evaluations_user_date_idx on public.technical_evaluations(user_id, created_at desc, id desc);
alter table public.technical_evaluations enable row level security;
revoke all on public.technical_evaluations from anon, authenticated;
grant select, insert on public.technical_evaluations to authenticated;
create policy technical_evaluations_select_own on public.technical_evaluations for select to authenticated using ((select auth.uid()) = user_id);
create policy technical_evaluations_insert_own on public.technical_evaluations for insert to authenticated with check ((select auth.uid()) = user_id);


COMMIT;
