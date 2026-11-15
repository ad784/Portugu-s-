# Backend

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
