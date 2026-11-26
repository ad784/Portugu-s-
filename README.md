# Português+

> Preparação atual e pendências externas: [docs/ESTADO-PUBLICACAO.md](docs/ESTADO-PUBLICACAO.md). Inclui aceite e revogação de IA, exportação, migrations e e-mail. Confira a configuração local com `npm.cmd run check:readiness`.

Plataforma de prática de redação no modelo ENEM. A pessoa pode escrever no editor ou enviar uma foto de uma redação manuscrita e receber uma devolutiva pedagógica. O site também oferece textos de apoio por tema, exemplos, histórico, evolução das notas, perfil e recuperação de senha.

A interface das páginas é construída com **React 19**, **React Router** e **Vite**. O servidor usa **Express 5**. O Supabase cuida da autenticação, do banco de dados e do armazenamento de fotos; a Groq fornece os modelos de correção.

> As notas são estimativas pedagógicas para estudo e não substituem a avaliação oficial do ENEM.

## Começar no computador

Requisitos: Node.js 22.22 ou superior e npm.

```bash
npm install
Copy-Item .env.example .env
```

No `.env`, informe uma chave válida em `GROQ_API_KEY`. Os valores Supabase do `.env.example` apontam para o projeto usado pelo site; ao usar outro projeto, substitua `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_JWKS_URL` pelas configurações correspondentes.

Para compilar a interface e iniciar o servidor:

```bash
npm start
```

Abra [http://localhost:3000](http://localhost:3000). O comando `npm start` executa o build do React Router antes de iniciar o Express.

Para desenvolver a interface com atualização automática, mantenha o backend ativo em uma janela e execute em outra:

```bash
npm run dev
```

O Vite abre [http://localhost:5173](http://localhost:5173) e encaminha as chamadas `/api` para o backend local na porta 3000.

## Variáveis de ambiente

| Variável | Necessária | Finalidade |
| --- | --- | --- |
| `GROQ_API_KEY` | Para correções por IA | Chave privada usada apenas pelo servidor. |
| `GROQ_MODEL` | Não | Modelo de correção por texto; padrão `openai/gpt-oss-120b`. |
| `GROQ_VISION_MODEL` | Não | Modelo compatível com imagens; padrão `qwen/qwen3.8-27b`. |
| `SUPABASE_URL` | Não* | URL do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Não* | Chave de integração usada somente pela API. |
| `SUPABASE_JWKS_URL` | Não* | Endpoint JWKS para validar tokens assinados pelo Supabase. |
| `LOCAL_DEMO_AUTH` | Não | Com `true`, habilita autenticação de demonstração apenas em `localhost`; não salva dados. Ignorado na Vercel. |

*O servidor fornece valores padrão do projeto atual. Configure essas variáveis ao usar outro projeto Supabase. Nunca coloque chaves secretas da Groq ou do Supabase no frontend ou no GitHub. O arquivo `.env` está no `.gitignore`; use `.env.example` como modelo.

## Interface React e rotas

As telas são componentes JSX em `frontend/frontend-src/pages/`, carregados pelas rotas do React Router. Os caminhos antigos terminados em `.html` continuam aceitos como aliases para compatibilidade, mas não existem páginas HTML independentes para cada tela.

Os comportamentos do editor, câmera, histórico e perfil ficam em `frontend/frontend-src/scripts/`. A autenticação e o gerenciamento da sessão ficam em `frontend/frontend-src/services/`. `frontend/frontend-src/pageScripts.js` associa os módulos às páginas; `frontend/frontend-src/components/layout/PageFrame.jsx` os carrega depois que o React monta cada tela. Os estilos compartilhados ficam em `frontend/frontend-src/assets/styles/style.css`.

## Arquitetura

O fluxo é **Frontend React → API Express → Supabase / serviços de IA**. O frontend acessa somente as rotas da aplicação; não importa o SDK nem recebe a URL e a chave do Supabase. A API centraliza autenticação, banco de dados, armazenamento de fotos e chamadas às IAs.

As rotas `/api/auth/*` cuidam de login, cadastro, confirmação por link, renovação de sessão, logout e alteração/recuperação de senha. Os tokens ficam em cookies HttpOnly, com SameSite=Lax e Secure em produção; não são devolvidos no JSON nem salvos pelo JavaScript. Operações que usam cookies validam a origem e exigem um cabeçalho da aplicação. A autorização e o isolamento por usuário continuam na API e nas políticas do banco.

Após a atualização, entre novamente. A aplicação remove os tokens que a versão anterior guardava no navegador e preserva os rascunhos por conta. Veja também [backend/README.md](backend/README.md) e [frontend/README.md](frontend/README.md).

## Organização do projeto

```text
backend/
  api/index.js              # Entrada da API na Vercel
  backend-src/
    config/                 # Ambiente, db.js e configurações públicas e de foto
    controllers/            # Recebem requisições e produzem respostas
    routes/                 # URLs, métodos HTTP e middleware de cada rota
    middleware/             # Autenticação, autorização, limites e erros
    models/                 # Consultas e alterações dos dados por domínio
    db/
      migrations/           # Histórico SQL do banco
    services/               # Correção por IA, regras, cache e persistência
    utils/                  # Funções auxiliares compartilhadas
    validations/            # Validação e normalização das entradas
    uploads/                # Reservado; fotos atualmente no Supabase
    app.js                  # Montagem da aplicação Express
    server.js               # Inicialização do servidor local
frontend/
  public/images/            # Imagens públicas
  public/icons/             # Ícones públicos
  frontend-src/
    assets/styles/          # CSS
    components/layout/      # Layout compartilhado
    pages/                  # Telas React
    routes/                 # Rotas React Router
    services/               # Supabase e gerenciamento da sessão
    scripts/                # Comportamento das páginas
    utils/                  # Utilitários, como mensagens de autenticação
    root.jsx                # Componente raiz
    routes.js               # Configuração de rotas
    pageScripts.js          # Associação entre páginas e módulos
shared/                     # Regras e documentos usados por ambas as partes
tests/                      # Testes automatizados
scripts/                    # Comandos de manutenção do projeto
```

O fluxo da API é **rota → middleware → controller → model/service**. Os models usam o cliente autenticado da requisição, preservando as permissões do usuário no Supabase. `db/migrations` contém os scripts SQL; a reorganização de pastas não exige executar migrations novamente.

O `package.json`, o lockfile e o `.env` continuam na raiz para manter um único comando de instalação e execução. Também é aceito `backend/.env`. Use `npm start` para executar tudo, `npm test` para verificar o backend e os fluxos do navegador e `npm run build` para compilar o frontend. As pastas reservadas do modelo usam `.gitkeep`; hooks, context, store e uploads locais ainda não são usados. As fotos são armazenadas no Supabase. Veja também [backend/README.md](backend/README.md) e [frontend/README.md](frontend/README.md). Cada parte tem comandos próprios em seu `package.json`, usando as dependências compartilhadas na raiz.

O texto e o tema selecionado no editor são salvos automaticamente no armazenamento local do navegador, para que o rascunho continue disponível ao sair da página e voltar no mesmo dispositivo e navegador.

## Correção de redações

### Texto

O editor envia a redacao e o tema para `POST /api/corrigir`. A nota global e a soma das cinco competencias (0 a 200 cada, em faixas de 40). Cada faixa exige evidencias concretas no texto. Envios identicos do mesmo usuario, tema, linhas e modelo reutilizam a avaliacao local. Alteracoes na rubrica geram uma nova avaliacao.

O editor pede pelo menos dez linhas para iniciar uma correção. A API também aplica a regra de extensão do ENEM: redações com até sete linhas visuais recebem nota zero e uma devolutiva sem depender de uma chamada à Groq.

### Foto

A página da câmera aceita captura ou seleção de uma imagem. O navegador envia a foto ao backend, que solicita à Groq a transcrição e a avaliação. Na correção por foto, a nota é a soma das cinco competências, conforme o formato atual desse fluxo. Confira a transcrição e a legibilidade da foto antes de usar a devolutiva. A câmera precisa de `localhost` ou HTTPS e da permissão do navegador.

A imagem é validada no servidor e pode ser enviada ao bucket privado `redacoes` do Supabase. Se o armazenamento da imagem ou a persistência no histórico falhar, a correção ainda pode ser exibida com um aviso; nesse caso, ela pode ficar apenas no dispositivo.

## API do backend

As rotas Express são separadas por domínio em `backend/backend-src/routes/`. Rotas, autenticação, serviços de IA e migrações Supabase ficam dentro de `backend/`.

| Método e rota | Função |
| --- | --- |
| `GET /api/me` | Identidade e papel da sessão atual. |
| `POST /api/corrigir` | Correcao de redacao em texto. |
| `POST /api/corrigir-foto` | Transcrição e correção de redação fotografada. |
| `GET /api/redacoes` | Histórico da pessoa autenticada. |
| `GET /api/admin/redacoes` | Histórico para contas com papel de administrador. |
| `GET /api/perfil` e `PUT /api/perfil` | Consulta e atualização do perfil. |

As rotas de dados exigem uma sessão Supabase válida. Para tokens assinados com chaves assimétricas, o middleware valida a assinatura com o JWKS do projeto; tokens legados usam o Auth do Supabase como alternativa. `LOCAL_DEMO_AUTH=true` é restrito a testes locais e não deve ser usado em produção.

## Supabase

Para configurar banco, políticas e armazenamento de fotos, execute estas migrations no SQL Editor do Supabase, nesta ordem:

1. `backend/backend-src/db/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `backend/backend-src/db/migrations/20260805170000_add_photo_storage.sql`
3. `backend/backend-src/db/migrations/20260830190000_add_theme_and_storage_policies.sql`
4. `backend/backend-src/db/migrations/20261013120000_allow_users_to_insert_own_profile.sql`
5. `backend/backend-src/db/migrations/20261017120000_allow_users_to_upload_own_essay_photos.sql`

O bucket `redacoes` deve permanecer privado. As políticas RLS restringem os dados às contas correspondentes.

## Deploy na Vercel

O arquivo `vercel.json` configura a função Express em `backend/api/index.js` e o build estático do React Router em `frontend/build/client/`. Configure as variáveis de ambiente necessárias no projeto da Vercel, especialmente `GROQ_API_KEY`; defina os modelos se quiser substituir os padrões. No Supabase, inclua o domínio publicado em **Authentication → URL Configuration**. Faça um novo deploy depois de alterar variáveis de ambiente.

## Testes e build

```bash
npm test
npm run build
```

Os testes usam o modo local e não precisam acessar o Supabase para os fluxos simulados.

## ENADE, concursos e navegação

As páginas principais compartilham um menu lateral recolhível. No celular, ele abre como uma gaveta. `/discursivas` reúne redações de concursos e questões discursivas de concursos e ENADE; `/concursos` e `/enade` abrem a mesma área com a modalidade correspondente. `/historico-tecnico` reúne essas avaliações, separadas das redações ENEM.

O estudante informa cargo ou curso, comando, resposta, referência opcional e critérios do edital. Sem critérios próprios, a plataforma usa uma rubrica de estudo de 100 pontos. A API calcula a nota pelos pesos informados; essa modalidade não usa as cinco competências ENEM. A devolutiva contém cartões por critério, trechos literais, itens do comando e uma atividade de revisão. Exemplos disponíveis são autorais e identificados como treino. A nota é estimada e não substitui a banca ou o professor.

Validação da nova área: `node --test tests/technical-writing.test.js`, `npm run build` e, com localhost:3000 ativo, `node scripts/browser-smoke.cjs --technical`. O teste de navegador usa APIs simuladas e verifica rascunho, critérios, revisão, menu móvel e ausência de sobreposição na grade numerada.
