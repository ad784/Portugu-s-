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
