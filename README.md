# Portugues+

Projeto de TCC desenvolvido para auxiliar estudantes na pratica de redacao, com foco no modelo ENEM. A aplicacao permite que o usuario escreva uma redacao, envie o texto para correcao automatizada e receba uma devolutiva com nota, competencias, erros encontrados e sugestoes de melhoria.

## Objetivo

O objetivo do projeto e oferecer uma ferramenta simples e acessivel para apoio ao estudo de Lingua Portuguesa, principalmente na producao textual. A proposta e ajudar o aluno a identificar pontos fortes e pontos que precisam ser melhorados em sua redacao.

## Funcionalidades

- Tela de login.
- Tela de cadastro visual.
- Tela para escrita de uma nova redacao.
- Envio da redacao para o servidor.
- Correcao automatizada usando inteligencia artificial.
- Exibicao da nota da redacao.
- Exibicao de competencias, erros e sugestoes de melhoria.

## Tecnologias utilizadas

- HTML
- CSS
- JavaScript
- Node.js
- Express
- CORS
- Dotenv
- API Groq

## Estrutura do projeto

```text
portugues/
+-- backend/
|   +-- package.json
|   +-- server.js
+-- frontend/
|   +-- cadastro.html
|   +-- index.html
|   +-- nova.html
|   +-- resultado.html
|   +-- script.js
|   +-- style.css
+-- package.json
+-- package-lock.json
+-- .gitignore
+-- README.md
```

## Como executar o projeto

### 1. Instalar as dependencias

No terminal, dentro da pasta principal do projeto, execute:

```bash
npm install
```

### 2. Configurar as chaves

Copie `.env.example` para `.env` na raiz do projeto e informe os valores completos:

```text
.env
```

O projeto usa o Supabase para criar sessoes de usuario e proteger as rotas de correcao. A chave `SUPABASE_SECRET_KEY` deve ficar somente no servidor e nunca no frontend.

```env
SUPABASE_URL=https://lzapufofepqbvqgzsqwg.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
SUPABASE_SECRET_KEY=sua_chave_secreta_completa
SUPABASE_JWKS_URL=https://lzapufofepqbvqgzsqwg.supabase.co/auth/v1/.well-known/jwks.json
GROQ_API_KEY=sua_chave_groq
```

### 3. Iniciar o servidor

Execute:

```bash
node backend/server.js
```

Se tudo estiver correto, o terminal mostrara:

```text
Servidor rodando em http://localhost:3000
```

### 4. Acessar no navegador

Abra:

```text
http://localhost:3000
```

## Como funciona

O frontend possui as telas de login, cadastro, escrita da redacao e resultado. Ao clicar em "Corrigir Redacao", o texto digitado e enviado para o backend pela rota:

```text
POST /corrigir
```

O backend recebe a redacao e faz uma requisicao para a API da Groq, usando o modelo `llama-3.3-70b-versatile`. A resposta da inteligencia artificial e enviada de volta para o frontend, que mostra a nota e a correcao completa na tela de resultado.

## Deploy na Vercel

O arquivo `vercel.json` encaminha as telas estaticas e as requisicoes `/api/*` para a funcao Express em `api/index.js`.

1. Importe este repositorio na Vercel.
2. Em **Settings > Environment Variables**, cadastre todas as variaveis de `.env.example`, com a chave secreta completa obtida no painel do Supabase.
3. Faca o deploy. O frontend usa caminhos relativos, portanto as chamadas para a API funcionam no dominio publicado.

## Banco de dados Supabase

Antes de salvar redacoes, abra o **SQL Editor** do projeto Supabase e execute, nesta ordem, os arquivos abaixo:

1. `supabase/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `supabase/migrations/20260805170000_add_photo_storage.sql`

Eles criam as tabelas `profiles` e `redacoes`, ativam as politicas de seguranca e criam o bucket privado `redacoes` para as fotos. Para corrigir fotos, tambem configure `GROQ_API_KEY` localmente e na Vercel.

## Observacoes

- O arquivo `.env` nao deve ser enviado para o GitHub, pois contem a chave da API.
- A pasta `node_modules` tambem nao deve ser enviada, pois pode ser recriada com `npm install`.
- Cadastro e login usam o Supabase Auth. Confirme que o provedor de e-mail esta habilitado no painel do Supabase.
- O contador da tela de redacao considera as linhas visuais, inclusive quando o texto quebra automaticamente no editor.

## Autor

Projeto desenvolvido como Trabalho de Conclusao de Curso.
