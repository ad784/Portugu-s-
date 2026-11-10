# NVIDIA para leitura de redações — 10/11/2026

O leitor opcional usa `nvidia/nemotron-3.5-super-vl-120b-a12b` no endpoint hospedado `https://integrate.api.nvidia.com/v1/chat/completions`. Não instala modelos, não exige uma placa NVIDIA no computador e não altera as notas históricas. A NVIDIA transcreve a imagem; o modelo `GROQ_MODEL` continua aplicando o prompt de texto e gerando os cinco comentários. Transcrições diferentes podem produzir avaliações diferentes.

## Conta e teste local

1. Abra https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b e entre ou crie sua conta NVIDIA. Complete pessoalmente a confirmação exigida pelo site. A conta e a chave não são criadas pelo código do Português+.
2. No modelo, escolha **Generate API Key** e habilite o acesso correspondente. Confira as condições de uso do endpoint de teste. Não confunda uma chave de download de containers NGC com acesso ao endpoint hospedado.
3. Configure a chave no `.env` como `NVIDIA_API_KEY=...`. Não envie a chave no chat, no Git ou no frontend.
4. Para testar somente a leitura: `node scripts/check-nvidia-photo.cjs "caminho-da-foto.jpg"`. O comando envia essa foto à NVIDIA e mostra somente contagens. Não grava uma redação no histórico.
5. Para testar leitura e correção: `node scripts/check-nvidia-photo.cjs "caminho-da-foto.jpg" --avaliar`. Esse teste também chama a Groq e exige `GROQ_API_KEY`. Confira a qualidade da transcrição e das notas pelo site antes de liberar o novo fluxo a usuários.

Sem chave, o comando termina claramente e não faz chamadas. Testes automatizados com respostas simuladas não comprovam qualidade de manuscrito, limite efetivo da conta ou estabilidade do serviço.

## Ativação no site, após o teste

1. No Supabase SQL Editor, aplique somente `backend/supabase/migrations/20261110120000_nvidia_privacy.sql`. Essa atualização também aceita a versão de privacidade do leitor Google e é compatível com o leitor Groq existente. Não execute o instalador de banco novo.
2. Na Vercel, adicione `NVIDIA_API_KEY` e `PHOTO_READER=nvidia`. Opcionalmente use `NVIDIA_VISION_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b`. Preserve `GROQ_API_KEY` e `GROQ_MODEL`.
3. Faça **Redeploy**. Contas anteriores precisarão aceitar a política de 10/11 antes de enviar conteúdo para o novo provedor. Sem essa atualização, não ative o leitor NVIDIA em produção.
4. Teste uma foto conhecida, confira a transcrição e os cinco comentários, depois faça testes simultâneos. Registre tempo e cotas reais. Para voltar ao leitor anterior, configure explicitamente `PHOTO_READER=groq` e faça novo deploy.

Adicionar somente a chave NVIDIA NÃO ativa o novo leitor: a seleção é explícita. Não há fallback automático para Google ou Qwen. Nenhuma assinatura, cobrança ou cadastro de conta é realizado automaticamente.

## Comportamento e limitações

O pedido de leitura contém um prompt curto de transcrição, sem correção ou reescrita, saída JSON, `stream=false` e raciocínio desligado. A imagem permanece no backend e segue somente para o leitor selecionado. O limite de 3 MB e a validação de texto e das cinco competências continuam ativos. Resposta truncada ou sem transcrição válida nunca é avaliada como uma redação completa.

Se o endpoint retornar 202 com identificador válido, o leitor guarda a referência por usuário/imagem/modelo e consulta o status na próxima tentativa, em vez de iniciar outra leitura no mesmo processo/cache. O identificador não é exposto ao navegador. A chamada tem timeout de 25 segundos; o avaliador usa orçamento de 28 segundos. Na Vercel, o cache temporário não é uma fila durável compartilhada: instâncias distintas ou um timeout sem identificador podem provocar novo pedido. Não há garantia de cobrança única ou ordem de atendimento entre instâncias.

O cache de transcrição dura até 24 horas, é separado por usuário e modelo e evita refazer uma leitura concluída se somente a Groq pedir espera. Logs guardam status, tempos e contagens de tokens, sem textos, imagens ou chaves. A transcrição ainda pode conter erros e precisa ser validada com fotos reais. Endpoints gratuitos de prototipagem não equivalem a capacidade ilimitada ou garantia de produção; a Groq continua com suas próprias cotas para a avaliação.

Referências oficiais: https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b e https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer.
