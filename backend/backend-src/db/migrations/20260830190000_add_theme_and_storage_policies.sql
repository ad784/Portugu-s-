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
