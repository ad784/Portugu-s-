# Português+

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
| `SUPABASE_PUBLISHABLE_KEY` | Não* | Chave pública usada pelo cliente e pelo servidor. |
| `SUPABASE_JWKS_URL` | Não* | Endpoint JWKS para validar tokens assinados pelo Supabase. |
| `LOCAL_DEMO_AUTH` | Não | Com `true`, habilita autenticação de demonstração apenas em `localhost`; não salva dados. Ignorado na Vercel. |

*O servidor fornece valores padrão do projeto atual. Configure essas variáveis ao usar outro projeto Supabase. Nunca coloque chaves secretas da Groq ou do Supabase no frontend ou no GitHub. O arquivo `.env` está no `.gitignore`; use `.env.example` como modelo.

## Interface React e rotas

As telas são componentes JSX em `frontend/src/pages/content/`, carregados pelas rotas do React Router. Os caminhos antigos terminados em `.html` continuam aceitos como aliases para compatibilidade, mas não existem páginas HTML independentes para cada tela.

Alguns comportamentos do navegador — como autenticação Supabase, edição e salvamento do rascunho, câmera, histórico e perfil — permanecem em módulos JavaScript separados em `frontend/scripts/`. `frontend/src/pageScripts.js` associa esses módulos às páginas; `PageFrame.jsx` os carrega depois que o React monta cada tela. Os estilos compartilhados ficam em `frontend/styles/style.css`. O layout inclui regras responsivas e menu hambúrguer para telas menores.

O texto e o tema selecionado no editor são salvos automaticamente no armazenamento local do navegador, para que o rascunho continue disponível ao sair da página e voltar no mesmo dispositivo e navegador.

## Correção de redações

### Texto

O editor envia a redação e o tema para `POST /api/corrigir`. A correção avalia o texto no formato ENEM, apresenta comentários para as cinco competências e uma justificativa para a nota global. A nota global é holística, de 0 a 1000, e **não é calculada pela soma ou média das competências**. As notas por competência são exibidas separadamente como diagnóstico. A calibração exige evidências no próprio texto e permite notas altas quando a qualidade demonstrada as justifica.

O editor pede pelo menos dez linhas para iniciar uma correção. A API também aplica a regra de extensão do ENEM: redações com até sete linhas visuais recebem nota zero e uma devolutiva sem depender de uma chamada à Groq.

### Foto

A página da câmera aceita captura ou seleção de uma imagem. O navegador envia a foto ao backend, que solicita à Groq a transcrição e a avaliação. Na correção por foto, a nota é a soma das cinco competências, conforme o formato atual desse fluxo. Confira a transcrição e a legibilidade da foto antes de usar a devolutiva. A câmera precisa de `localhost` ou HTTPS e da permissão do navegador.

A imagem é validada no servidor e pode ser enviada ao bucket privado `redacoes` do Supabase. Se o armazenamento da imagem ou a persistência no histórico falhar, a correção ainda pode ser exibida com um aviso; nesse caso, ela pode ficar apenas no dispositivo.

## API do backend

As rotas Express são separadas por domínio em `backend/routes/`. Rotas, autenticação, serviços de IA e migrações Supabase ficam dentro de `backend/`.

| Método e rota | Função |
| --- | --- |
| `GET /api/me` | Identidade e papel da sessão atual. |
| `POST /api/corrigir` | Correção de redação em texto. |
| `POST /api/corrigir-foto` | Transcrição e correção de redação fotografada. |
| `GET /api/redacoes` | Histórico da pessoa autenticada. |
| `GET /api/admin/redacoes` | Histórico para contas com papel de administrador. |
| `GET /api/perfil` e `PUT /api/perfil` | Consulta e atualização do perfil. |

As rotas de dados exigem uma sessão Supabase válida. Para tokens assinados com chaves assimétricas, o middleware valida a assinatura com o JWKS do projeto; tokens legados usam o Auth do Supabase como alternativa. `LOCAL_DEMO_AUTH=true` é restrito a testes locais e não deve ser usado em produção.

## Supabase

Para configurar banco, políticas e armazenamento de fotos, execute estas migrations no SQL Editor do Supabase, nesta ordem:

1. `backend/supabase/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `backend/supabase/migrations/20260805170000_add_photo_storage.sql`
3. `backend/supabase/migrations/20260830190000_add_theme_and_storage_policies.sql`
4. `backend/supabase/migrations/20261013120000_allow_users_to_insert_own_profile.sql`
5. `backend/supabase/migrations/20261017120000_allow_users_to_upload_own_essay_photos.sql`

O bucket `redacoes` deve permanecer privado. As políticas RLS restringem os dados às contas correspondentes.

## Deploy na Vercel

O arquivo `vercel.json` configura a função Express em `backend/api/index.js` e o build estático do React Router em `frontend/build/client/`. Configure as variáveis de ambiente necessárias no projeto da Vercel, especialmente `GROQ_API_KEY`; defina os modelos se quiser substituir os padrões. No Supabase, inclua o domínio publicado em **Authentication → URL Configuration**. Faça um novo deploy depois de alterar variáveis de ambiente.

## Testes e build

```bash
npm test
npm run build
```

Os testes usam o modo local e não precisam acessar o Supabase para os fluxos simulados.

## Estrutura do projeto

```text
backend/
  api/                 adaptador serverless da Vercel
  middleware/          autenticação e autorização
  routes/              endpoints Express
  services/            correção, integração com IA e persistência
  supabase/migrations/ migrações do banco e políticas
  server.js            configuração e inicialização local do Express
frontend/
  src/pages/content/   telas React em JSX
  src/routes/          componentes de rota
  scripts/             lógica de interação carregada por página
  styles/              estilos compartilhados e responsivos
  public/assets/       imagens e recursos estáticos
  build/               saída gerada; não versionar
  react-router.config.mjs
  vite.config.mjs

docs/                  documentação complementar do projeto
tests/                 testes automatizados
.env.example            modelo de variáveis, sem chaves privadas
package.json            scripts e dependências únicos do projeto
```