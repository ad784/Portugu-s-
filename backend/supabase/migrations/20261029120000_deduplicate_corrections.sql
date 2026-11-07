-- Torna o cache de avaliações durável e impede histórico duplicado entre instâncias.
alter table public.redacoes add column if not exists avaliacao_hash text;
create unique index if not exists redacoes_user_avaliacao_hash_unique
  on public.redacoes (user_id, avaliacao_hash);

-- Os índices e as políticas existentes continuam separando os dados por usuário.
alter table public.redacoes enable row level security;
