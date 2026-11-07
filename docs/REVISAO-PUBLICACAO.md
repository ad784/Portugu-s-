# Revisão para publicação — Português+

Data: 29 de outubro de 2026.

O site tem as telas necessárias. A recomendação é corrigir os fluxos atuais antes de divulgar para o público. Não é necessário criar páginas novas. Esta revisão não alterou o código da aplicação, as notas ou os critérios de correção.

## O que foi verificado

- Leitura do frontend, scripts, rotas da API, autenticação, persistência, migrações SQL, testes e configuração de hospedagem.
- `npm test`: 34 testes passaram.
- `npm run build`: compilação concluída.
- `npm audit --omit=dev`: nenhuma vulnerabilidade conhecida reportada pelo npm nas dependências de produção.
- Navegador Chrome temporário, separado do perfil pessoal: início, cadastro, editor, resultado, foto, exemplos, recuperação e privacidade, em larguras de 1366 e 390 pixels. As telas renderizadas não apresentaram rolagem horizontal nesses tamanhos.
- Reprodução do problema de `/index.html` e do botão do cabeçalho para criar conta.
- Testes isolados, com respostas externas simuladas, para autenticação da foto e reenvio da mesma redação. Não foram usadas chamadas de IA nessa auditoria.
- Consulta à documentação oficial da Vercel e do Supabase para conferir requisitos de produção.

Os testes automatizados existentes cobrem principalmente API, funções e integrações simuladas. Não equivalem à aprovação de cadastro, confirmação de e-mail, recuperação, armazenamento e isolamento entre duas contas reais em produção.

## Corrigir antes da publicação

### 1. Links de entrada e retorno abrem uma tela vazia

**Confirmado no navegador.** `/` mostra o login. `/index.html` e `/index` terminam em `/index.html` com o corpo da página vazio.

A rota inicial atende apenas `/`; a rota genérica não inclui `index` entre as páginas e redireciona uma página desconhecida para `/index.html`, que continua sem componente correspondente. Os links de voltar, entrar, logotipo, saída e recuperação usam esse endereço.

Evidências: `frontend/src/routes.js:3`, `frontend/src/routes/page.jsx:5` e `frontend/src/routes/page.jsx:22`.

Correção: fazer os aliases existentes apontarem para a tela inicial correta. Validar acesso direto, recarregamento, saída e retorno após expiração da sessão.

### 2. A navegação confunde “Criar conta” com “Sair”

**Confirmado no navegador.** Clicar em “Criar conta” no cabeçalho da página inicial foi para `/index.html`, em vez de `/cadastro.html`.

O script trata qualquer link `.nav-cta` como saída se existir `window.sair`. A página inicial carrega esse método, embora seu botão seja de cadastro.

Evidência: `frontend/scripts/navigation.js:24`.

Correção: identificar a ação de saída explicitamente, sem inferi-la pela classe visual compartilhada.

### 3. A saída na página de resultado não encerra a sessão Supabase

**Confirmado no código e na inicialização da tela.** A página de resultado tem “Sair” e carrega o script com `sair()`, mas não carrega `supabase.js`. Em uma abertura direta, `window.supabaseClient` não existe e a chamada opcional de `signOut()` é ignorada. Limpar apenas o resultado local e redirecionar não encerra a sessão persistida.

Evidências: `frontend/src/pageScripts.js:17` e `frontend/scripts/script.js:204`.

Correção: centralizar autenticação e saída para todas as telas relevantes. Confirmar que, após sair por qualquer tela, uma ação protegida exige novo login.

### 4. A recuperação envia e-mail, mas não conduz à definição da nova senha

**Confirmado no código.** O link de recuperação volta para `/index.html`. Não há tratamento de `PASSWORD_RECOVERY` para oferecer a troca de senha nesse fluxo. A troca existente está na tela de perfil e não é apresentada pelo retorno de recuperação.

Evidências: `frontend/scripts/recuperar.js:8`, `frontend/scripts/perfil.js:110` e `frontend/src/pages/content/RecoveryPage.jsx`.

Correção: usar a própria tela de recuperação ou a de perfil para receber o retorno, validar o estado da sessão, pedir senha e confirmação e concluir `updateUser`. Não exige página nova.

Referência: [fluxo de senhas do Supabase](https://supabase.com/docs/guides/auth/passwords).

### 5. Dados locais não estão separados por usuário

**Confirmado no código.** Resultado, rascunho e histórico de contingência usam chaves compartilhadas no navegador, sem ID de conta. O histórico e a evolução combinam esses registros com os da conta atual. As saídas não limpam esses dados de maneira consistente.

Isso permite misturar dados de contas que usam o mesmo navegador e manter uma redação anterior disponível na tela de resultado. Não é evidência de falha no RLS remoto: o problema está no armazenamento e na apresentação locais.

Evidências: `frontend/scripts/script.js:15`, `frontend/scripts/script.js:23`, `frontend/scripts/historico.js:17`, `frontend/scripts/historico.js:77`, `frontend/scripts/evolucao.js:1` e `frontend/scripts/foto.js:211`.

Correção: associar dados locais ao ID autenticado, limpar o estado da conta na saída e impedir a mistura ao trocar de usuário. Testar com contas A e B no mesmo navegador.

### 6. A correção por foto pode prosseguir sem autenticação validada

**Reproduzido em teste isolado, sem acesso externo.** Foi simulado um erro 503 no serviço de autenticação e enviado um JWT sem assinatura válida. A rota de foto respondeu 200 e chamou o analisador simulado.

Isso acontece porque `continueOnAuthOutage` deixa a requisição continuar após uma falha de validação. Em produção, uma indisponibilidade não deve converter uma sessão não verificada em autorização para consumir IA.

Evidências: `backend/routes/photo.js:6` e `backend/middleware/require-user.js:49`.

Correção: exigir identidade validada antes da análise. Se a sessão não puder ser verificada, responder com erro temporário; manter funcionamento offline apenas quando existir uma validação criptográfica confiável.

### 7. Falta controle de consumo e prazo das chamadas de IA

**Confirmado no código e no limite atingido durante o trabalho anterior.** Não há quota por usuário/IP, limite específico de tamanho do texto, controle de concorrência ou timeout explícito nas chamadas externas. O limite JSON de 7 MB não é um limite adequado para uma redação.

Há tentativas automáticas em camadas diferentes; uma falha pode prolongar a espera ou repetir trabalho. O bloqueio do botão protege apenas a interação naquela página, não o endpoint público.

Evidências: `backend/server.js:37`, `backend/routes/text-correction.js:100`, `backend/routes/text-correction.js:202`, `backend/services/photo-correction.js:103` e `frontend/scripts/foto.js:176`.

Correção: definir tamanho máximo de redação, quota, concorrência, prazo máximo e regras de repetição. Respeitar o tempo de espera do serviço no frontend. Manter uma única avaliação normal; repetir apenas falhas recuperáveis.

### 8. Reenviar a mesma redação duplica o histórico

**Reproduzido em teste isolado.** Dois envios idênticos fizeram uma chamada simulada de IA, mas duas inserções no histórico.

O cache reutiliza a correção, porém chama novamente `saveCorrection`. A duplicação afeta a quantidade de redações, as médias e o gráfico de evolução. Também falta uma proteção para duas requisições simultâneas antes de existir cache.

Evidências: `backend/routes/text-correction.js:130`, `backend/routes/text-correction.js:175` e `backend/services/essay-storage.js:115`.

Correção: usar um identificador persistente da avaliação/envio, reutilizar o registro já criado e tratar concorrência. Uma reescrita com texto diferente deve continuar sendo um registro novo.

### 9. O cache atual não oferece persistência confiável na Vercel

**Incompatibilidade identificada entre código e ambiente de hospedagem configurado.** O cache tenta gravar em `.correction-cache` dentro do projeto. As funções da Vercel têm sistema de arquivos somente de leitura, salvo espaço temporário. O erro de escrita é tratado, portanto não significa que toda correção vá falhar, mas a reutilização persistente deixa de estar garantida.

Sem cache compartilhado, novas instâncias podem chamar a IA novamente para o mesmo texto, consumir mais quota e retornar avaliações diferentes. Trocar apenas para `/tmp` não fornece persistência compartilhada.

Evidência: `backend/routes/text-correction.js:170` e `backend/routes/text-correction.js:265`.

Correção: persistir avaliações e sua versão de rubrica no banco, com separação por usuário e controle de duplicação.

Referência: [sistema de arquivos das funções Vercel](https://vercel.com/docs/functions/runtimes).

### 10. Foto e texto usam avaliadores diferentes

**Confirmado no código.** A correção de texto usa rubrica e exemplos calibrados. A foto usa um prompt independente e outro modelo, sem essa calibração. O aluno pode ter avaliações diferentes para o mesmo conteúdo conforme o modo de envio.

A foto também limita a resposta a 1000 tokens, compartilhados entre transcrição integral, cinco competências, erros e sugestões. Isso aumenta o risco de faltar transcrição ou feedback em textos longos; não foi feita uma medição real de OCR nesta revisão.

Evidências: `backend/services/text-rubric.js` e `backend/services/photo-correction.js:109`.

Correção: compartilhar a rubrica pedagógica e o formato de resultado; dimensionar o orçamento de saída para transcrição e avaliação. Não é obrigatório criar uma segunda avaliação: o pedido multimodal pode reunir leitura e avaliação com os mesmos critérios.

## Melhorias importantes nas telas existentes

### 11. Aviso de redação não salva fica escondido

No fluxo digitado, a falha de sincronização é registrada no console, o histórico local é criado e `resultado-aviso` é removido. O estudante pode acreditar que a redação está salva na conta quando ela só está naquele navegador. O fluxo de foto exibe um aviso, mas ainda pode mostrar detalhes de configuração do Supabase ao estudante.

Evidências: `frontend/scripts/script.js:313`, `frontend/scripts/script.js:320` e `backend/routes/photo.js:38`.

Correção: usar o aviso já existente na tela de resultado, distinguir “salvo na conta” de “salvo neste dispositivo” e oferecer nova tentativa de sincronização sem repetir a IA. Não há sincronização posterior automática dos registros locais no código atual.

### 12. A contagem de linhas depende do dispositivo

**Medido no navegador.** O mesmo texto sintético apareceu com 48 linhas em 1366 pixels e 91 linhas em 390 pixels. A API aceita a contagem enviada pelo navegador e o cache inclui esse número.

Isso altera o mínimo de envio conforme a tela e pode impedir reutilizar a mesma avaliação em outro dispositivo.

Evidências: `frontend/scripts/script.js:458` e `backend/routes/text-correction.js:150`.

Correção: definir uma referência de escrita estável e conferir os critérios de extensão no servidor. Não usar largura do celular como medida da redação. Preservar um contador visual separado se for útil para digitação.

### 13. Tema livre não permite informar o recorte

O editor oferece “Tema em aberto”, mas o valor enviado é vazio e não há campo para digitar uma proposta personalizada. A API então não consegue verificar a adequação ao tema com a mesma precisão.

Evidências: `frontend/src/pages/content/EditorPage.jsx:82` e `frontend/src/pages/content/EditorPage.jsx:272`.

Correção: mostrar um campo de tema na própria tela do editor ao escolher a opção livre. Na foto, também falta enviar um tema selecionado.

### 14. Ajustes de cadastro, login e uso por teclado

- O login remove espaços da senha com `trim()`, enquanto cadastro e troca preservam os espaços. Uma senha aceita no cadastro pode ser alterada pelo login. Evidência: `frontend/scripts/script.js:177`.
- Quando o cadastro não retorna sessão, a mensagem diz que já é possível entrar. Se a confirmação de e-mail estiver habilitada, deve orientar a confirmá-lo primeiro. Evidência: `frontend/scripts/cadastro.js:44`.
- Os blocos de login, cadastro e recuperação não são formulários de envio; falta o fluxo normal de Enter e validação uniforme. No navegador, `document.forms.length` foi zero nessas telas.
- A recuperação de senha não usa `try/finally`; uma exceção pode deixar o botão desabilitado. Evidência: `frontend/scripts/recuperar.js`.
- Uma abertura direta do resultado, sem dado salvo, mostra “Seu resultado chegou” com nota `---`, em vez de orientar a enviar uma redação.
- Reforçar o foco do teclado, o fechamento do menu móvel e as mensagens de carregamento, falha e ausência de dados. O carregamento inicial atualmente pode ser uma área vazia.

### 15. Histórico e evolução precisam resistir ao crescimento

As consultas retornam o histórico completo, incluindo o relatório de cada redação, sem paginação. Os dados locais não são sincronizados posteriormente e são limitados aos últimos 30 registros. O histórico não tem a mesma rotina de renovação de sessão usada pelo perfil.

Há ainda inserção de `error.message` com `innerHTML` na tela de evolução; deve ser texto, sem interpretar HTML de uma mensagem retornada externamente.

Evidências: `backend/routes/essays.js:18`, `frontend/scripts/historico.js:67` e `frontend/scripts/evolucao.js:127`.

Correção: paginar, carregar detalhe sob demanda, padronizar sessão e renderizar erros com `textContent`.

### 16. Limite de foto deve corresponder ao da hospedagem

A API permite imagem de 5 MB e corpo JSON de 7 MB. A função Vercel aceita até 4,5 MB no corpo da requisição; base64 aumenta o tamanho transferido. A redução de resolução no frontend ajuda, mas o tamanho final do corpo não é conferido antes do envio.

Correção: validar o tamanho efetivamente enviado e ajustar compressão/limites ou a estratégia de upload. Testar fotos reais de celular no ambiente publicado.

Referência: [limites das funções Vercel](https://vercel.com/docs/functions/limitations).

### 17. Privacidade precisa de informações utilizáveis pelo público

A política atual manda procurar o contato “apresentado na entrega do TCC”. Isso não serve como canal de atendimento do site público. Falta esclarecer o responsável, um contato acessível, os serviços utilizados e como solicitar remoção dos dados, incluindo fotos e cópias locais quando aplicável.

Evidência: `frontend/src/pages/content/PrivacyPage.jsx:64`.

Correção: completar a página de privacidade existente e estabelecer um procedimento real para atender solicitações. Esta constatação é de clareza e funcionamento do produto, não uma certificação jurídica.

## O que depende de verificar fora do código

- Aplicação efetiva das migrações, RLS, bucket privado e políticas de upload no projeto Supabase real.
- Cadastro, confirmação de e-mail, login, recuperação e troca de senha com contas reais autorizadas.
- Isolamento real de dados entre duas contas; papel administrativo somente por configuração confiável.
- Domínio final, HTTPS, URLs de retorno autorizadas no Supabase e variáveis de ambiente da hospedagem. O frontend tem URL/chave pública fixas: mudar só o `.env` do backend não muda o projeto usado pelo navegador.
- Serviço de envio de e-mail. O SMTP padrão do Supabase é destinado a testes; conferir SMTP próprio antes de disponibilizar confirmação e recuperação ao público. Referência: [SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
- Prazos de execução e comportamento real de uploads na Vercel.
- Capacidade e orçamento de IA para o público esperado; a quota atual já se esgotou durante os testes anteriores.
- Monitoramento de erros, tempo de resposta e falhas de salvamento, sem registrar redações completas, tokens ou senhas nos logs.
- Avaliação de fotos manuscritas reais: legibilidade, partes não reconhecidas, transcrição, gravação privada e recuperação do resultado.

## Critério para liberar

Eu liberaria depois que uma conta nova conseguir, no domínio de publicação: cadastrar e confirmar e-mail; entrar; recuperar/trocar senha; enviar texto e foto; receber um resultado coerente; consultar uma única entrada correta no histórico; ver a evolução; editar o perfil; sair; e não deixar seus dados aparecerem ao entrar com outra conta. Tudo isso deve sobreviver a recarregamento, falha temporária de rede e limite de IA com mensagens claras.

Esse percurso pode ser concluído nas páginas que já existem. A prioridade é confiabilidade dos fluxos, isolamento dos dados e funcionamento em produção, não aumentar a quantidade de telas.
