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
