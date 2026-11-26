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
