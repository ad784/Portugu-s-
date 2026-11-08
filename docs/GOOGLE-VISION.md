# Leitura Google Cloud Vision + correção Groq

O fluxo opcional envia a imagem ao Google com `DOCUMENT_TEXT_DETECTION`, preserva a transcrição e avalia o texto com o mesmo modelo, prompt, parâmetros, validação e cálculo usados no editor. As notas históricas não são alteradas. Uma nota nova pode variar porque a transcrição e o modelo de avaliação (GROQ_MODEL em vez de GROQ_VISION_MODEL) diferem do leitor antigo. A transcrição não é uma redação melhorada.

As cópias `GROQ-PROMPT-FOTO.txt` e `GROQ-REQUISICAO-FOTO.json` descrevem o leitor direto Groq, mantido como opção. No fluxo Google, a leitura não recebe prompt generativo: usa a API OCR; o avaliador recebe o prompt de texto (`GROQ-PROMPT-TEXTO.txt`) e a transcrição.

Sem credenciais Google, o leitor atual continua ativo. Não há fallback automático do Google para o Qwen. A integração Google só fica ativa quando `PHOTO_READER=google` ou quando existe `GOOGLE_VISION_API_KEY` e `PHOTO_READER` está vazio. `PHOTO_READER=groq` mantém explicitamente o leitor antigo.

## Configuração, na ordem

1. Crie um projeto no Google Cloud e vincule faturamento, com perfil Individual se aplicável. Ative a **Cloud Vision API**. Confira os preços e cotas antes dos testes: https://cloud.google.com/vision/pricing.
2. Crie uma chave de API no projeto e restrinja seu uso à **Cloud Vision API**. Ela será usada somente no backend; não configure restrição de referenciador de navegador para uma chave de servidor. Não coloque a chave no frontend, no Git ou no chat.
3. No Supabase, abra **SQL Editor**, copie e execute somente `backend/supabase/migrations/20261108120000_google_vision_privacy.sql`. Essa migration é compatível com o leitor antigo e preserva os aceites existentes. Não execute o instalador de banco novo.
4. Na Vercel, no projeto que você usa, abra **Settings → Environment Variables**. Adicione `GOOGLE_VISION_API_KEY` com a chave e `PHOTO_READER=google`. Preserve `GROQ_API_KEY` e `GROQ_MODEL`. A chave Google não é uma chave Gemini.
5. Faça um **Redeploy** para as novas variáveis entrarem em vigor. Não é necessário trocar o domínio. Localmente, use as mesmas variáveis no `.env` e reinicie o servidor.
6. No site, o cadastro usa as versões devolvidas pelo servidor. Contas antigas precisam aceitar a política de 08/11 na página de aceite antes da primeira correção com o Google. O texto de autorização explica os dois provedores. Não há aceite repetido dentro do editor.
7. Teste uma foto nítida de uma redação conhecida, confira a transcrição, os cinco comentários e o histórico. Compare com a mesma transcrição enviada pelo editor. Depois teste usuários simultâneos e acompanhe as cotas de ambos os provedores.

Para testar apenas a leitura local, depois de configurar a chave no `.env`, execute `node scripts/check-google-vision.cjs "caminho-da-foto.jpg"`. Esse comando envia a foto ao Google, mostra somente contagens e não chama a Groq nem salva na conta. Sem chave, encerra sem chamadas.

## Limites e validação

A etapa de leitura tem timeout de 12 segundos; a avaliação tem orçamento de 40 segundos. O servidor mantém os limites de imagem, de tamanho do texto e de pelo menos oito linhas de referência. Respostas sem texto, erros de permissão/faturamento e erros dentro de um HTTP 200 do Google não são aceitos como leitura válida. Nenhum texto ou nota é inventado para completar uma falha.

O cache de transcrição é separado por usuário e imagem e dura até 24 horas, no mesmo mecanismo das correções. Se a Groq pedir espera, uma nova tentativa pode reutilizar a leitura sem outra chamada Google. Na Vercel, instâncias distintas podem não compartilhar esse cache temporário; não é garantia de cobrança única. Os registros operacionais não incluem imagem, texto ou chave. O histórico só recebe avaliações completas.

O novo fluxo remove a dependência do Qwen para as fotos; não elimina as cotas de correção de texto na Groq nem as cotas do Google. A integração não pode ser considerada validada em produção até testar com credenciais reais e amostras manuscritas. Não foi contratado nem ativado faturamento automaticamente.

Referências: https://docs.cloud.google.com/vision/docs/handwriting e https://docs.cloud.google.com/vision/docs/request.
