# Português+

Aplicação de apoio à prática de redação no modelo ENEM. Depois de entrar, você pode escrever uma redação ou enviar uma foto do texto manuscrito. A IA gera uma correção com nota, análise das competências, pontos de atenção e sugestões. O sistema também oferece histórico, exemplos de redação, perfil e recuperação de senha.

## Executar localmente

Você precisa do Node.js 22 ou superior e do npm. Na pasta principal do projeto, instale as dependências:

```bash
npm install
```

Informe sua chave da Groq em `GROQ_API_KEY` em `.env` na raiz ou em `backend/.env`; o servidor procura nos dois locais, sem depender da pasta de onde `npm start` foi executado. Se a mesma variável estiver nos dois arquivos, a da raiz prevalece. Não publique esses arquivos. As credenciais públicas do Supabase usadas nesta versão já têm valores padrão no projeto. Se você fizer um fork para usar outro projeto Supabase, substitua esses valores pelas credenciais do seu projeto.

```bash
npm start
```

Abra [http://localhost:3000](http://localhost:3000). Cadastre uma conta e entre para acessar o editor. O Supabase Auth precisa estar com o provedor de e-mail habilitado.

As correções por texto e por foto dependem de uma chave válida da Groq. Sem ela, o servidor continua iniciando, mas esses recursos retornam uma mensagem de configuração ausente. Para testar localmente as rotas protegidas da API sem token Supabase, você pode definir `LOCAL_DEMO_AUTH=true` no `.env`; esse modo funciona somente em `localhost`, não persiste dados e não substitui a chave da Groq. O login do site continua usando o Supabase.

### Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `GROQ_API_KEY` | Para corrigir redações | Chave privada usada somente pelo servidor. |
| `GROQ_MODEL` | Não | Modelo da correção por texto; padrão `openai/gpt-oss-120b`. |
| `GROQ_VISION_MODEL` | Não | Modelo compatível com imagens; padrão `qwen/qwen3.8-27b`. |
| `LOCAL_DEMO_AUTH` | Não | Define `true` para demonstração local sem autenticação nem persistência. Ignorado na Vercel. |
| `SUPABASE_URL` | Não* | URL do projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Não* | Chave pública do Supabase usada pelo navegador e pelo servidor. |
| `SUPABASE_JWKS_URL` | Não* | Endereço JWKS usado para verificar tokens do Supabase. |

*As três variáveis Supabase têm valores padrão neste repositório. Configure-as quando usar seu próprio projeto. Nunca coloque chaves secretas do Supabase ou da Groq no frontend.

## Correção por foto

O fluxo usa a API do próprio backend para manter `GROQ_API_KEY` no servidor. O navegador nunca envia essa chave à Groq.

### Fluxo da requisição

1. O estudante entra na conta, tira uma foto ou escolhe uma imagem e confere a prévia. A câmera funciona em `localhost` ou HTTPS e depende da permissão do navegador. A captura é convertida no navegador para JPEG antes do envio.
2. O navegador obtém a sessão Supabase e envia um `POST /api/corrigir-foto` com `Authorization: Bearer <access_token>` e um corpo JSON no formato `{ "imagem": "data:image/jpeg;base64,..." }`. O backend também aceita o caminho `/corrigir-foto`.
3. O middleware valida a sessão do Supabase. O backend aceita imagens PNG, JPG/JPEG ou WEBP, confere se os bytes correspondem ao formato declarado e recusa arquivos vazios ou maiores que 5 MB.
4. O backend envia a imagem e as instruções de correção para `https://api.groq.com/openai/v1/chat/completions`. O modelo padrão é `qwen/qwen3.8-27b`; `GROQ_VISION_MODEL` pode selecionar outro modelo compatível com imagens. A chamada usa `GROQ_API_KEY` e pede cinco notas ENEM, justificativas curtas, erros, sugestões e a transcrição integral.
5. O backend confere se a resposta contém as cinco competências e uma transcrição utilizável. Normaliza cada competência para 0, 40, 80, 120, 160 ou 200, recalcula a soma e remove ciclos de frases idênticas que possam aparecer na transcrição gerada.
6. Com uma resposta válida, o backend envia a foto ao bucket privado `redacoes`, no caminho `<id-do-usuario>/<uuid>.<extensão>`, e grava no histórico `redacoes` o usuário, o texto transcrito, o relatório, a nota e o caminho do arquivo. A gravação usa o token do estudante e as políticas RLS do Supabase limitam cada conta aos próprios registros e arquivos.
7. A API devolve JSON com `resultado`, `salvo` e `aviso`. O navegador mostra o relatório em `resultado.html`; se a gravação do histórico falhar, mantém uma cópia local e mostra o aviso.

### Configuração e falhas

- Configure `GROQ_API_KEY` no `.env` local e como variável de ambiente no deploy. A variável `GROQ_VISION_MODEL` é opcional. O backend limita a saída a 1.000 tokens para respeitar o limite de uso por minuto da conta Groq; justificativas e listas são pedidas de forma concisa para reservar tokens à transcrição.
- Para salvar o histórico e a imagem, execute as migrations de banco, bucket e políticas listadas em [Supabase e migrações](#supabase-e-migrações). O bucket `redacoes` deve permanecer privado. Sem a configuração de Storage, o backend ainda tenta salvar a correção e a transcrição no histórico, mas devolve um aviso de que a imagem não foi guardada.
- Erro HTTP 400 indica imagem ausente, formato inválido ou tamanho acima do limite; 401 indica sessão ausente, inválida ou expirada; 429/502 indica falha ou limite da Groq; 503 indica configuração de autenticação ou da chave de IA. Se a validação do Supabase ficar temporariamente indisponível durante o envio, o backend ainda pode devolver a correção da foto, mas sem atualizar o histórico da conta. Confira `aviso` e os logs do backend para distinguir uma correção gerada de uma foto efetivamente armazenada.

A imagem é enviada à Groq para análise e, quando o Storage está configurado, ao Supabase para armazenamento. A nitidez da letra, a iluminação e o enquadramento influenciam a transcrição. Confira o texto transcrito antes de usar a devolutiva; a nota é uma estimativa pedagógica, não uma avaliação oficial do ENEM.

## Correção de texto

O editor envia o texto ao endpoint `/api/corrigir`. O backend encaminha a redação à Groq usando `GROQ_MODEL` (por padrão, `openai/gpt-oss-120b`) e devolve a avaliação para a tela de resultado. É necessário configurar `GROQ_API_KEY`. A correção é um apoio ao estudo e não substitui a avaliação oficial do ENEM.

## Editor, temas e perfil

Na página **Nova redação**, o estudante pode escolher um dos dez temas oficiais do ENEM de 2016 a 2025 ou selecionar **Tema em aberto**, sem precisar digitar um tema. O editor conta palavras e linhas visuais e exige pelo menos dez linhas para solicitar a correção. A tela de resultado destaca a nota total e mostra a pontuação e os comentários de cada competência quando disponíveis no relatório.

Em **Meu perfil**, é possível atualizar o nome e alterar a senha da conta autenticada. As redações corrigidas ficam disponíveis no histórico e alimentam a página de evolução. A navegação e os controles do editor se adaptam a telas menores e maiores.

## Critérios de correção

A correção por texto solicita notas independentes e justificadas para as cinco competências. A calibração é conservadora: repertório apenas citado, argumentos pouco desenvolvidos, coesão mecânica e proposta de intervenção incompleta não devem sustentar notas altas. Cada competência usa uma faixa de 0, 40, 80, 120, 160 ou 200 pontos. Se a IA devolver um valor intermediário, o backend o normaliza para a faixa inferior; a nota final é a soma das cinco competências e, por isso, ocorre em múltiplos de 40.

Na correção por foto, o backend também recalcula a nota a partir das cinco competências. Se a resposta não trouxer as cinco notas separadas, a correção solicita uma nova tentativa em vez de mostrar um total sem essa conferência. Em ambos os fluxos, a nota é uma estimativa pedagógica: não substitui a avaliação oficial do ENEM e pode diferir da nota atribuída por avaliadores humanos.

## Histórico e evolução

A página `frontend/pages/historico.html` lista as redações corrigidas. Em `frontend/pages/evolucao.html`, o estudante acompanha um gráfico com as notas salvas em ordem cronológica, a média geral, a variação desde a primeira redação e a comparação das médias por competência entre os primeiros e os registros mais recentes. As notas por competência aparecem quando o relatório salvo contém essa informação. Os dados vêm do histórico autenticado e incluem registros locais ainda não sincronizados.

Correções feitas após uma atualização usam a nova calibração. Notas que já foram salvas não são recalculadas automaticamente.

## Supabase e migrações

Para habilitar banco, histórico e armazenamento de fotos, execute os arquivos abaixo no SQL Editor do projeto Supabase, nesta ordem:

1. `supabase/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `supabase/migrations/20260805170000_add_photo_storage.sql`
3. `supabase/migrations/20260830190000_add_theme_and_storage_policies.sql`
4. `supabase/migrations/20261013120000_allow_users_to_insert_own_profile.sql`
5. `supabase/migrations/20261017120000_allow_users_to_upload_own_essay_photos.sql`

O bucket de fotos é privado. Nunca exponha `GROQ_API_KEY` no frontend, no GitHub ou em mensagens.

## Rotas da aplicação

As páginas públicas ficam disponíveis em `/`, `/index.html`, `/cadastro.html`, `/nova.html`, `/resultado.html`, `/foto.html`, `/exemplos.html`, `/historico.html`, `/evolucao.html`, `/perfil.html`, `/recuperar.html` e `/privacidade.html`. O servidor Express resolve essas páginas localmente; `vercel.json` aplica os rewrites equivalentes no deploy.

| Método e rota | Uso |
| --- | --- |
| `POST /api/corrigir` | Envia uma redação em texto para correção. |
| `POST /api/corrigir-foto` | Envia uma imagem para transcrição e correção. |
| `GET /api/redacoes` | Lista o histórico da conta autenticada. |
| `GET /api/perfil` e `PUT /api/perfil` | Consulta e atualiza o perfil. |

O seletor de temas funciona no navegador e envia o tema selecionado junto com a redação em `POST /api/corrigir`; **Tema em aberto** envia o campo de tema vazio. A troca de senha usa a sessão autenticada do Supabase Auth.

As rotas de dados exigem uma sessão válida do Supabase, exceto no modo de demonstração local descrito acima.

## Deploy na Vercel

O arquivo `vercel.json` configura as páginas e as rotas `/api/*`. Importe este repositório na Vercel e configure `GROQ_API_KEY` e, se necessário, `GROQ_MODEL` ou `GROQ_VISION_MODEL` nas variáveis de ambiente de produção e preview. A correção por foto usa `qwen/qwen3.8-27b` por padrão. Depois de mudar variáveis, faça um novo deploy. No Supabase, ajuste **Authentication → URL Configuration** para aceitar o domínio publicado e as URLs locais necessárias.

## Testes

```bash
npm test
```

## Estrutura principal

O `package.json` da raiz é o manifesto único do projeto. Ele instala as dependências, inicia o servidor e executa os testes.

- `frontend/pages/`: páginas HTML do site.
- `frontend/scripts/`: scripts do navegador, incluindo autenticação e gráficos.
- `frontend/styles/`: folhas de estilo.
- `frontend/assets/`: imagens e outros recursos estáticos.
- `backend/server.js`: composição do servidor Express e configuração das rotas.
- `backend/routes/`: endpoints separados de perfil, redações, correção por texto e por foto.
- `backend/middleware/`: autenticação e autorização das rotas.
- `backend/services/`: integração com IA, validação de imagem e persistência no Supabase.
- `api/index.js`: entrada da função da Vercel.
- `supabase/migrations/`: estrutura do banco, políticas e armazenamento.
- `docs/BANCA.md`: material técnico para apresentação do projeto.
- `tests/`: testes automatizados do backend e dos fluxos de correção.
- `.env.example`: modelo de configuração local, sem chaves privadas.

O arquivo `.env` e a pasta `node_modules` não devem ser enviados ao Git. O exemplo seguro de configuração fica em `.env.example`.
