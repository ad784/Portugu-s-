# Backend

## Respostas discursivas de ENADE e concursos

`/api/discursivas` usa autenticação por cookies e mantém o acesso ao Supabase na API. Rotas: `GET /config`, `GET /historico?page=0&mode=enade`, `GET /historico/:id` e `POST /corrigir`. Apenas a correção exige o consentimento de IA atual; a leitura do histórico requer autenticação. O limite de correções é compartilhado com as outras modalidades.

O corpo da correção contém `mode`, `taskType`, `area`, `board`, `prompt`, `reference`, `answer`, `limitLines`, `customCriteria` e `criteria`. Critérios próprios aceitam de 1 a 8 itens, cada um com `label` e `maxPoints`, com soma de até 1.000 pontos. Sem critérios próprios, o servidor escolhe a rubrica de estudo correspondente ao formato, com total de 100. A IA estima percentuais; o servidor valida IDs e evidências literais e calcula os pontos. Não se utiliza a rubrica ENEM.

A tabela `technical_evaluations` possui RLS por proprietário e registros imutáveis. O hash inclui a conta e os dados normalizados. Uma repetição idêntica reutiliza a avaliação. Em falha de persistência, a resposta retorna `salvo:false`, mantendo a avaliação disponível para download e nova tentativa de salvamento. Esse conteúdo também integra a exportação de dados do perfil. A migration está incluída nos SQLs gerados por `npm run prepare:sql`.

Código da API em `backend-src/`, organizado conforme o modelo de camadas:

- `config/`: ambiente e configuração do cliente do banco.
- `controllers/`: tratamento das requisições e respostas.
- `routes/`: endpoints e associação dos middlewares.
- `middleware/`: autenticação, autorização, limites e erros.
- `models/`: consultas e alterações de dados.
- `db/migrations/`: histórico SQL.
- `services/`: regras de negócio e integrações.
- `utils/`: funções auxiliares compartilhadas.
- `validations/`: validação e normalização das entradas.
- `uploads/`: reservado para arquivos locais; atualmente as fotos usam Supabase Storage.
- `app.js`: montagem do Express.
- `server.js`: inicialização local.

A pasta `api/` é o adaptador exigido pela publicação atual na Vercel.

Instale as dependências com `npm install` na raiz do repositório. Para iniciar apenas a API, execute `npm start` nesta pasta. Para compilar e iniciar o site completo, execute `npm start` na raiz. As dependências e o lockfile são compartilhados na raiz. O ambiente pode ser definido em `.env` na raiz ou em `backend/.env`; não versionar credenciais.

A API é a única camada que acessa o Supabase. `/api/auth/*` usa `routes/auth.js`, `controllers/auth.js`, `middleware/auth-cookies.js` e o cliente por requisição em `config/db.js`. A sessão usa cookies HttpOnly; tokens enviados por clientes de API continuam aceitos pelo middleware para compatibilidade. As autorizações de banco e Storage continuam usando o JWT do usuário, sem elevar permissões com `service_role`.

O fluxo da aplicação é **Frontend React → API Express → Supabase / serviços de IA**. A API concentra login, cadastro, confirmação por link, consulta e renovação de sessão, logout e alteração/recuperação de senha. Os tokens não são devolvidos no JSON: ficam em cookies HttpOnly, com SameSite=Lax e Secure em produção. As operações com cookies exigem o cabeçalho da aplicação e validam a origem da requisição. As versões dos termos e os endereços de retorno dos e-mails são definidos no servidor.

## Questões por dificuldade e prática de escrita

`data/question-bank.js` contém 60 questões versionadas: 20 fáceis de fundamentos, 20 médias de aplicação e 20 difíceis de análise. Cada nível inclui introdução, tese, argumentação, repertório, coesão e conclusão. `data/exercises.js` reúne os roteiros de escrita e os quatro temas. O treino não chama modelos de IA.

`GET /api/questoes` entrega os três níveis sem gabaritos. `POST /api/questoes/conferir` exige `levelId`, `questionId` e a alternativa escolhida. `POST /api/questoes/tentativas` exige as 20 respostas e seus identificadores na ordem do nível; recalcula os acertos e registra a produção e a revisão. `GET /api/questoes/tentativas?page=0` entrega o histórico paginado e os acertos agrupados por habilidade. Todas as rotas exigem autenticação.

A persistência passa por `controllers/exercises.js`, `services/exercises.js` e `models/exercises.js`. A tabela `exercise_attempts` permite leitura e inserção somente pelo proprietário, com políticas RLS e índice por usuário e data. As tentativas são imutáveis; repetir o mesmo identificador não duplica o treino. A exportação de dados do perfil inclui esse histórico.

Rodadas novas usam `material_version=2`, `level_id`, `question_ids` e 20 respostas. Registros antigos de três questões continuam como versão 1, sem receber um nível retroativamente. A migration de dificuldade preserva as linhas existentes e mantém as mesmas políticas de isolamento. A evolução compara somente rodadas da mesma dificuldade.

As alternativas têm extensões próximas: a diferença máxima é de três palavras e a proporção entre os comprimentos máximo e mínimo não ultrapassa 1,2 em cada questão. A resposta correta varia entre a menor, intermediária e maior opção. A apresentação embaralha as alternativas por rodada e preserva essa ordem no rascunho. As explicações não dependem das letras ou da posição visual. Esses controles não substituem a revisão pedagógica do material.

Os acertos avaliam compreensão das questões. Os checklists são autoavaliações; o sistema não transforma contagem de palavras ou marcações em nota ENEM nem afirma medir automaticamente a qualidade da escrita. A comparação de versões permite que o estudante examine as próprias mudanças.

Validação reproduzível: `node --test tests/exercises.test.js tests/privacy-export.test.js`, `npm run build` e `node scripts/browser-smoke.cjs --questions` com o servidor ativo. O teste de navegador executa as 60 questões, mede a igualdade de altura das alternativas, confere a estabilidade da ordem ao retomar, conclui os três níveis e verifica a separação das pontuações. Também testa falhas de salvamento e histórico, textos e reescritas, registros antigos, celular e bloqueio de visitantes. `scripts/questions-check.cjs` contém essas interações; os artefatos são gerados em `.qa/`, fora do versionamento. As formas antigas e novas de registro e a RLS foram verificadas no banco em uma transação revertida, sem manter registros de teste.
