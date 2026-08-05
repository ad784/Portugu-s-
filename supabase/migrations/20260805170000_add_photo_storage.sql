alter table public.redacoes
  add column if not exists imagem_path text;

insert into storage.buckets (id, name, public)
values ('redacoes', 'redacoes', false)
on conflict (id) do nothing;
