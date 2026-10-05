# Português+

Aplicação de apoio à prática de redação no modelo ENEM. Depois de entrar, você pode escrever uma redação ou enviar uma foto do texto manuscrito. A IA gera uma correção com nota, análise das competências, pontos de atenção e sugestões. O sistema também oferece histórico, exemplos de redação, perfil e recuperação de senha.

## Executar localmente

Você precisa do Node.js 22 ou superior e do npm. Na pasta principal do projeto, instale as dependências:

```bash
npm install
```

Copie `.env.example` para `.env` na raiz. Para usar o projeto Supabase configurado no frontend, os valores públicos podem ficar vazios localmente. Para autenticação e persistência reais, a chave secreta do Supabase deve ser configurada no servidor. Informe também `GROQ_API_KEY` para habilitar correções por IA.

```bash
npm start
```

Abra [http://localhost:3000](http://localhost:3000). Cadastre uma conta e entre para acessar o editor. O Supabase Auth precisa estar com o provedor de e-mail habilitado.

## Correção por foto

1. Entre na conta e escolha **Enviar foto da redação** no editor. Permita o acesso à câmera. Em dispositivos móveis, a página tenta abrir a câmera traseira e oferece uma alternativa para selecionar uma imagem do aparelho.
2. Enquadre toda a folha em local iluminado, mantenha a escrita em foco e capture a foto. Confira a prévia; é possível refazer a captura.
3. Escolha **Enviar e corrigir**. O navegador envia a imagem autenticada ao endpoint `/api/corrigir-foto`.
4. O backend envia a imagem à Groq, que tenta transcrever a redação manuscrita e avaliá-la segundo o formato ENEM. O resultado aparece na tela de correção.
5. O texto da correção é salvo no histórico da conta. Quando `SUPABASE_SECRET_KEY` estiver configurada, a imagem também pode ser salva no bucket privado `redacoes`.

A qualidade da transcrição depende da nitidez da letra, iluminação e enquadramento. Confira a transcrição antes de usar a devolutiva; a nota é uma estimativa pedagógica, não uma avaliação oficial. A câmera requer `localhost` ou HTTPS e permissão do navegador. A imagem é enviada à Groq para análise.

## Correção de texto

O editor envia o texto ao endpoint `/api/corrigir`. O backend encaminha a redação à Groq usando `GROQ_MODEL` (por padrão, `openai/gpt-oss-120b`) e devolve a avaliação para a tela de resultado. É necessário configurar `GROQ_API_KEY`. A correção é um apoio ao estudo e não substitui a avaliação oficial do ENEM.

## Supabase e migrações

Para habilitar banco, histórico e armazenamento de fotos, execute os arquivos abaixo no SQL Editor do projeto Supabase, nesta ordem:

1. `supabase/migrations/20260805162000_create_profiles_and_redacoes.sql`
2. `supabase/migrations/20260805170000_add_photo_storage.sql`
3. `supabase/migrations/20260830190000_add_theme_and_storage_policies.sql`

O bucket de fotos é privado. Nunca exponha `SUPABASE_SECRET_KEY` ou `GROQ_API_KEY` no frontend, no GitHub ou em mensagens.

## Deploy na Vercel

O arquivo `vercel.json` configura as páginas e as rotas `/api/*`. Importe este repositório na Vercel e configure `SUPABASE_SECRET_KEY`, `GROQ_API_KEY` e, se necessário, `GROQ_MODEL` nas variáveis de ambiente de produção e preview. Depois de mudar variáveis, faça um novo deploy. No Supabase, ajuste **Authentication → URL Configuration** para aceitar o domínio publicado e as URLs locais necessárias.

## Testes

```bash
npm test
```

## Estrutura principal

- `frontend/`: páginas, estilos e scripts do site.
- `backend/server.js`: servidor Express, autenticação e endpoints de correção.
- `api/index.js`: entrada da função da Vercel.
- `supabase/migrations/`: estrutura do banco, políticas e armazenamento.
- `docs/BANCA.md`: material técnico para apresentação do projeto.

O arquivo `.env` e a pasta `node_modules` não devem ser enviados ao Git. O exemplo seguro de configuração fica em `.env.example`.
