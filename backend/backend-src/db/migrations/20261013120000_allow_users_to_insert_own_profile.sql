-- A rota de perfil usa upsert. Permita inserir somente a linha do proprio usuario.
drop policy if exists "Users insert their own profile" on public.profiles;
create policy "Users insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);
