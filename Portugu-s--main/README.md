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

### 2. Configurar a chave da API

Crie um arquivo chamado `.env` dentro da pasta `backend`:

```text
backend/.env
```

Dentro dele, adicione sua chave da Groq:

```env
GROQ_API_KEY=sua_chave_aqui
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

## Observacoes

- O arquivo `.env` nao deve ser enviado para o GitHub, pois contem a chave da API.
- A pasta `node_modules` tambem nao deve ser enviada, pois pode ser recriada com `npm install`.
- A tela de cadastro existe no frontend, mas o arquivo `cadastro.js` referenciado por ela ainda nao esta presente no projeto.

## Autor

Projeto desenvolvido como Trabalho de Conclusao de Curso.
