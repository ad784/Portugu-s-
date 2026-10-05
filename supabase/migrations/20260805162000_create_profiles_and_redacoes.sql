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
