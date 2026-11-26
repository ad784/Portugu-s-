# Frontend

- `public/images/` e `public/icons/`: imagens e ícones públicos.
- `frontend-src/assets/`: estilos e recursos importados pelo código.
- `frontend-src/components/common/`, `ui/` e `layout/`: componentes compartilhados.
- `frontend-src/pages/`: telas.
- `frontend-src/hooks/`: reservado para hooks React extraídos das telas.
- `frontend-src/context/`: reservado para providers de contexto.
- `frontend-src/services/`: autenticação e gerenciamento da sessão.
- `frontend-src/utils/`: funções auxiliares.
- `frontend-src/routes/`: rotas.
- `frontend-src/store/`: reservado para estado global, caso necessário.
- `frontend-src/scripts/`: módulos existentes de comportamento das páginas.
- `frontend-src/App.jsx`: componente principal.

Este projeto usa React Router em modo framework. `frontend-src/root.jsx` e `frontend-src/routes.js` fazem a integração com o framework; a entrada do navegador é gerada por ele, por isso não há um `main.jsx` manual. `react-router.config.mjs` e `vite.config.mjs` são necessários para compilar.

Pastas reservadas contêm `.gitkeep` para serem mantidas no Git; não representam funcionalidades implementadas.

Instale as dependências com `npm install` na raiz. Nesta pasta, use `npm run dev` ou `npm run build`. O servidor da API deve estar na porta 3000 para o desenvolvimento. As dependências e o lockfile são compartilhados na raiz. Nenhuma chave privada deve ser colocada no frontend.

O navegador acessa somente a API da aplicação. `services/auth.js` inicializa a autenticação, `services/auth-api.js` chama `/api/auth/*` e `services/session.js` gerencia a identidade e os rascunhos por conta. O frontend não importa o SDK, URL ou chave do Supabase. Tokens de sessão ficam em cookies HttpOnly e não podem ser lidos pelo JavaScript.

Depois desta atualização, é necessário entrar novamente: os tokens salvos pela versão antiga são removidos do armazenamento JavaScript. Os rascunhos de cada conta são preservados. Links de confirmação e recuperação com fragmentos continuam aceitos; a aplicação entrega suas credenciais à API e as retira do histórico do navegador.

## Página Questões

O mapa das 20 questões usa cinco colunas com larguras limitadas e botões sem o preenchimento global, evitando a sobreposição dos números.

`/questoes` usa `pages/QuestionsPage.jsx` e `services/exercises.mjs`. O estudante escolhe Fácil, Médio ou Difícil e responde às 20 questões do nível, com navegação pelo mapa da rodada. Depois escolhe uma habilidade e um tema para escrever um trecho e fazer a revisão guiada. A reescrita é opcional e preserva a primeira versão.

O progresso compara acertos do mesmo nível e apresenta os resultados por habilidade. As tentativas concluídas ficam na conta, por meio de `/api/questoes`; os rascunhos de cada nível usam armazenamento isolado por usuário. O rascunho preserva as 20 respostas, a ordem embaralhada das alternativas e os trechos escritos. Falhas de salvamento mantêm o texto na tela e permitem reenviar a mesma tentativa. Esses indicadores são separados das notas das redações.

Os registros e trechos da versão anterior permanecem disponíveis na área de progresso, separados dos novos níveis. As alternativas usam linhas de grade de mesma altura e não têm texto cortado. Testes de conteúdo controlam o equilíbrio de extensão, e o teste de navegador verifica as alturas no computador e no celular.
