# Preparação para publicação — 30/10/2026

> Revisão atualizada, incluindo revogação, exportação e banco remoto: [ESTADO-PUBLICACAO.md](ESTADO-PUBLICACAO.md). Os pontos abaixo registram a primeira revisão e foram complementados.

## Estrutura e estado

Frontend React 19 / React Router / Vite, servidor Express, autenticação e dados no Supabase, correção com Groq. O projeto está configurado para Vercel; não foi publicado nesta revisão. Alterações que já estavam no diretório foram preservadas.

O código atual inclui aliases das páginas, saída centralizada, recuperação com troca de senha, armazenamento local por conta, autenticação obrigatória nas correções, limites e timeout de IA, cache e deduplicação. As páginas cobrem cadastro, login, editor, foto, resultado, exemplos, histórico, evolução, perfil e recuperação.

Nesta revisão: página de termos; aceite obrigatório separado da autorização de IA; versões enviadas no cadastro; migration para recibo protegido por RLS com horário do servidor; contato real e política atualizada; descrição da página; correção do cache de fotos para não declarar salvamento sem confirmação do banco; isolamento do cache dos testes.

O recibo é criado por trigger no cadastro. Não pode ser editado pelo navegador. Não certifica identidade civil ou leitura efetiva do documento. Contas antigas permanecem sem recibo: não foram criados aceites retroativos. Se houver abertura para contas antigas, preparar um fluxo de novo aceite antes de exigir a versão atual delas.

## Configuração externa necessária

1. No Supabase, executar em ordem todos os arquivos de `backend/supabase/migrations/`, inclusive `20261029120000_deduplicate_corrections.sql` e `20261030120000_record_signup_acceptance.sql`. A última migration deve entrar junto com o novo cadastro: clientes antigos sem os campos de aceite terão cadastros recusados. O trigger atual atende cadastro por e-mail; novos provedores e convites precisarão de fluxo de aceite próprio.
2. Manter bucket `redacoes` privado e conferir RLS com duas contas reais.
3. Configurar no Supabase o Site URL HTTPS e os redirects do domínio publicado, incluindo `/` e `/recuperar?reset=1`.
4. Configurar SMTP próprio em Authentication para confirmação e recuperação. Contato definido como `portuguesmais02@gmail.com`; isso não autentica o Gmail, não configura SMTP e não envia recibos por e-mail. Nunca colocar senha pessoal no código. Documentação: https://supabase.com/docs/guides/auth/auth-smtp
5. Na Vercel, configurar `GROQ_API_KEY`, variáveis Supabase de `.env.example`, `CONTACT_EMAIL` e `APP_ORIGIN` com a origem HTTPS definitiva. Manter `LOCAL_DEMO_AUTH=false`. `LOCAL_GUEST_MODE` não é lido pelo código atual.
6. Validar a disponibilidade dos modelos configurados na conta Groq, saldo/quota e prazo máximo da função no plano da hospedagem. O timeout da IA não inclui todo o tempo de autenticação e persistência.
7. Os limites de correção atuais são por processo. Para impor quota global entre instâncias serverless, implementar contador compartilhado antes de tráfego amplo ou exposição com orçamento relevante. A deduplicação persistente exige a migration correspondente.
8. Definir responsável operacional, tratamento de solicitações de exclusão pelo e-mail, política efetiva de retenção/backups e monitoramento. Conferir que o texto público corresponde à operação real.

## Validação e limites

Executar `npm.cmd test` e `npm.cmd run build` no PowerShell. O audit de dependências não pôde ser concluído por falha de acesso ao endpoint npm. Testes simulados não verificam SMTP, migrations aplicadas, IA com credencial real nem comportamento visual em navegador.

Antes de divulgar, testar no domínio final: criar conta e confirmar e-mail, consultar recibo em `legal_acceptances`, entrar, recuperar senha, corrigir texto e foto, verificar uma entrada por envio no histórico, consultar evolução e perfil, sair e entrar com outra conta. Conferir que a segunda conta não acessa dados da primeira. Repetir com falha de rede e limite da IA.

Para iniciar localmente: `npm.cmd start` e abrir http://localhost:3000. Para publicar, importar o repositório na Vercel usando `vercel.json`, cadastrar as variáveis e fazer deploy após a preparação do Supabase.
