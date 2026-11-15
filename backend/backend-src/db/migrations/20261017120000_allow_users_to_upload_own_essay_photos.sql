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
