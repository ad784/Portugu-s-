# Português+

Aplicação de apoio à prática de redação no modelo ENEM. Depois de entrar, você pode escrever uma redação ou enviar uma foto do texto manuscrito. A IA gera uma correção com nota, análise das competências, pontos de atenção e sugestões. O sistema também oferece histórico, exemplos de redação, perfil e recuperação de senha.

## Executar localmente

Você precisa do Node.js 22 ou superior e do npm. Na pasta principal do projeto, instale as dependências:

```bash
npm install
```

Copie `.env.example` para `.env` na raiz. O projeto Supabase já está configurado para o app. Informe `GROQ_API_KEY` para habilitar correções por IA; essa chave fica somente no servidor.

```bash
npm start
```

Abra [http://localhost:3000](http://localhost:3000). Cadastre uma conta e entre para acessar o editor. O Supabase Auth precisa estar com o provedor de e-mail habilitado.

Para comprovar que o endereço de e-mail é acessível, ative **Confirm Email** em **Authentication → Providers → Email** no Supabase e configure a URL do site em **Authentication → URL Configuration**. O cadastro do site bloqueia novas contas enquanto a confirmação automática estiver ativa.

## Correção por foto

1. Entre na conta e escolha **Enviar foto da redação** no editor. Permita o acesso à câmera. Em dispositivos móveis, a página tenta abrir a câmera traseira e oferece uma alternativa para selecionar uma imagem do aparelho.
2. Enquadre toda a folha em local iluminado, mantenha a escrita em foco e capture a foto. Confira a prévia; é possível refazer a captura.
3. Escolha **Enviar e corrigir**. O navegador envia a imagem autenticada ao endpoint `/api/corrigir-foto`.
4. O backend envia a imagem à Groq, que tenta transcrever a redação manuscrita e avaliá-la segundo o formato ENEM. O resultado aparece na tela de correção.
5. A foto é enviada ao modelo de visão. A transcrição e a correção são salvas no histórico; o arquivo da imagem vai para o bucket privado `redacoes` quando a política de upload da migration estiver aplicada. Se o Storage ainda não estiver configurado, a correção continua disponível e a tela informa que a foto não foi guardada.

A qualidade da transcrição depende da nitidez da letra, iluminação e enquadramento. Confira a transcrição antes de usar a devolutiva; a nota é uma estimativa pedagógica, não uma avaliação oficial. A câmera requer `localhost` ou HTTPS e permissão do navegador. A imagem é enviada à Groq para análise.

## Correção de texto

O editor envia o texto ao endpoint `/api/corrigir`. O backend encaminha a redação à Groq usando `GROQ_MODEL` (por padrão, `openai/gpt-oss-120b`) e devolve a avaliação para a tela de resultado. É necessário configurar `GROQ_API_KEY`. A correção é um apoio ao estudo e não substitui a avaliação oficial do ENEM.

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

## Deploy na Vercel

O arquivo `vercel.json` configura as páginas e as rotas `/api/*`. Importe este repositório na Vercel e configure `GROQ_API_KEY` e, se necessário, `GROQ_MODEL` ou `GROQ_VISION_MODEL` nas variáveis de ambiente de produção e preview. A correção por foto usa `qwen/qwen3.8-27b` por padrão. Depois de mudar variáveis, faça um novo deploy. No Supabase, ajuste **Authentication → URL Configuration** para aceitar o domínio publicado e as URLs locais necessárias.

## Testes

```bash
npm test
```

## Estrutura principal

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

O arquivo `.env` e a pasta `node_modules` não devem ser enviados ao Git. O exemplo seguro de configuração fica em `.env.example`.
