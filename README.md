# Português+

Aplicação de apoio à prática de redação no modelo ENEM. Depois de criar uma conta e entrar, você pode escrever uma redação ou enviar uma foto do texto manuscrito. A aplicação solicita uma correção à IA e apresenta a nota, as competências, os erros e as sugestões.

## O que você precisa

- Node.js 22 ou superior e npm.
- Um projeto Supabase configurado com Auth e banco de dados.
- Uma chave da API Groq para corrigir redações digitadas e analisar fotos.

## Executar localmente

Na pasta principal do projeto, instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` na raiz, usando `.env.example` como referência, e preencha as chaves. A chave secreta do Supabase e a chave da Groq são usadas somente pelo servidor; não as coloque no frontend nem as publique.

Antes do primeiro uso, execute no SQL Editor do Supabase, nesta ordem:

1. `supabase/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `supabase/migrations/20260805170000_add_photo_storage.sql`

No terminal, inicie o servidor:

```bash
npm start
```

Abra [http://localhost:3000](http://localhost:3000). A página de login deve aparecer. Cadastre uma conta e entre para acessar o editor. Se a porta 3000 estiver ocupada, defina `PORT` no ambiente antes de iniciar.

## Configuração do `.env`

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
SUPABASE_SECRET_KEY=sua_chave_secreta
SUPABASE_JWKS_URL=https://SEU-PROJETO.supabase.co/auth/v1/.well-known/jwks.json
GROQ_API_KEY=sua_chave_groq
```

Use a URL e as chaves do seu próprio projeto Supabase. A chave publicável já usada pelo navegador está em `frontend/supabase.js`; ela pode ser exposta no frontend, desde que as políticas de segurança do banco (RLS) estejam habilitadas. A chave secreta deve permanecer somente no `.env` do servidor.

## Como funciona a correção por foto

1. Entre na sua conta e, no editor, escolha **Enviar foto da redação**. A página pede permissão para usar a câmera. Em celular, ela tenta escolher a câmera traseira; se não estiver disponível, tenta outra câmera.
2. Coloque a folha inteira no enquadramento, com boa luz e foco, e toque em **Tirar foto**. A captura é reduzida para limitar o tamanho do envio.
3. Confira a imagem e escolha **Enviar e corrigir**. O navegador envia a foto ao endpoint `/api/corrigir-foto`, junto com a sessão autenticada.
4. O servidor encaminha a imagem à Groq, cujo modelo com visão tenta ler e transcrever a redação manuscrita e produzir a avaliação no formato ENEM. A transcrição e a correção aparecem na página de resultado.
5. O resultado é registrado na tabela `redacoes`; se o armazenamento Supabase estiver configurado, o servidor também guarda a imagem no bucket privado `redacoes` e registra seu caminho. A tela de resultado mostra a resposta atual; o endpoint `/api/redacoes` lista os registros da conta.

A leitura depende da nitidez da letra e da foto. Revise a transcrição e considere a nota e as sugestões como apoio ao estudo, não como avaliação oficial. Para usar a câmera, abra o sistema em `localhost` ou por HTTPS e permita o acesso à câmera no navegador. Uma página aberta diretamente como arquivo (`file://`) pode não ter acesso à câmera.

## Correção de texto

O editor envia o texto e a contagem de linhas visuais ao endpoint autenticado `/api/corrigir`. Com `GROQ_API_KEY` configurada, o servidor pede a avaliação ao modelo de texto da Groq. Sem essa chave, usa um avaliador local simplificado, útil para desenvolvimento, que calcula uma estimativa por métricas do texto; ele não substitui uma avaliação de IA. A redação precisa ter pelo menos 10 linhas visuais para ser enviada.

## Publicar na Vercel

O `vercel.json` encaminha as páginas estáticas e as rotas `/api/*` para a função Express em `api/index.js`. Configure na Vercel as mesmas variáveis do `.env`, importe o repositório e publique. Execute as migrações Supabase acima antes de usar autenticação, histórico ou fotos.

## Privacidade e segurança

- Não envie `.env` ao Git nem compartilhe as chaves secretas.
- As redações e as imagens ficam associadas à conta autenticada; o bucket de imagens é privado.
- A foto é enviada ao provedor Groq para análise. Evite fotografar dados pessoais que não façam parte da redação.
- `node_modules` pode ser recriado com `npm install` e não precisa ser versionado.
