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
