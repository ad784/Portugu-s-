# Estado da preparação — 30/10/2026

> Revisão local mais recente, correções e pendências de liberação: [REVISAO-FINAL-LOCAL.md](REVISAO-FINAL-LOCAL.md), de 03/11/2026.

O projeto foi preparado localmente. Não houve publicação nem alterações no banco remoto. Este documento substitui o estado descrito nas revisões anteriores.

## Revisão de erros e privacidade — 03/11/2026

Implementados avisos de offline e armazenamento bloqueado; preservação de texto e foto por conta; expiração de sessão sem limpar rascunhos; retomada da foto pendente; controles de envio com espera; leitura de arquivo inválido com mensagem; histórico/evolução distinguindo dados parciais de dados remotos; e resultado legível e disponível para download na própria tela quando não for possível persistir no navegador.

Exportação paginada de eventos e redações, teste de escopo por usuário e testes do ciclo aceite → revogação → bloqueio → novo aceite. O perfil oferece solicitação de exclusão por e-mail, sob responsabilidade do dono do projeto, sem executar exclusão automática. Instruções de atendimento e pendência específica para abertura a crianças em [PRIVACIDADE-ATENDIMENTO.md](PRIVACIDADE-ATENDIMENTO.md). Não há nova migration para essas melhorias.

## Decisão atual: cadastro sem confirmação de e-mail

**Atualização em 03/11/2026:** a recuperação por link foi reativada no código e no `.env` local. Veja [RECUPERACAO-SENHA.md](RECUPERACAO-SENHA.md). Ela depende de SMTP e redirects válidos; a configuração e a entrega real ainda precisam ser testadas. O cadastro continua sem confirmação. O parágrafo sobre pausa abaixo registra a decisão anterior.

A pedido do responsável, a confirmação por e-mail foi retirada do fluxo esperado. No painel Supabase, em Authentication → Sign In / Providers → Email, desativar **Confirm email**, mantendo o provedor Email e novos cadastros habilitados. Essa configuração é remota: não é alterada pelo `.env` nem pelo SQL deste projeto. O site verifica a configuração antes do cadastro para evitar chamadas que tentem enviar a confirmação enquanto a opção ainda estiver ativa.

Com a confirmação desativada, o Supabase devolve uma sessão no cadastro e o site abre a plataforma diretamente. A senha e o aceite continuam obrigatórios. A titularidade do endereço informado não é verificada nesse modo. Contas antigas pendentes podem precisar de regularização individual no painel, sem excluir dados ou confirmar contas em massa. O código não autentica pessoas sem senha nem substitui a política remota de autenticação.

A recuperação automática por e-mail está pausada por padrão (`EMAIL_RECOVERY_ENABLED=false`). A tela mostra o contato de suporte; mudança de senha com sessão ativa continua no perfil. Não redefina senhas apenas com base em um endereço de e-mail declarado, pois os novos endereços não são verificados. Para reativar a recuperação, primeiro validar o SMTP e então definir `EMAIL_RECOVERY_ENABLED=true` e reiniciar o servidor. Essa decisão substitui a exigência de configurar SMTP para liberar novos cadastros nas seções históricas abaixo.

## Estrutura e correções

Frontend React 19 / React Router / Vite, backend Express, contas e dados no Supabase, IA da Groq e hospedagem preparada para Vercel. O site inclui cadastro, login, recuperação, editor com rascunho, foto, resultados, exemplos, histórico paginado, evolução e perfil.

Preparação concluída no código:

- Termos e privacidade públicos, links em todas as telas, aceite separado da autorização de IA, recibo versionado com horário do servidor, histórico de revogações e novo aceite para contas antigas.
- Verificação do aceite no servidor antes de novas correções. Revogar a autorização no perfil mantém histórico e gerenciamento de dados acessíveis. Uma correção já enviada pode terminar.
- Exportação JSON no perfil: conta, redações, recibo e eventos de privacidade, rascunho e resultados do dispositivo. As referências de fotos permanecem privadas; cópias das imagens podem ser solicitadas pelo contato.
- Consultas pessoais filtradas por conta, inclusive para administradores. Endpoint administrativo separado e protegido por papel.
- Quota persistente por conta: 4 correções por minuto e 30 por janela de 24 horas, compartilhada entre instâncias. Reserva de 120 segundos impede chamadas paralelas e expira em caso de queda. Falha do contador bloqueia consumo de IA. A concorrência global por processo também permanece limitada.
- Cache com 24 horas de validade para reutilização e limite de 500 arquivos; expirados removidos nas próximas operações. A deduplicação durável usa banco e índice único. Cache isolado não comprova salvamento.
- Validação de imagem, timeout, tratamento do prazo de limite da Groq e nova tentativa restrita a falha recuperável do formato da avaliação.
- APIs com `no-store`, erros JSON e cabeçalhos de segurança; logs sem corpo bruto das requisições; proteção contra exposição de chave Supabase privada na configuração do navegador.
- Mensagens corrigidas, aviso visível quando scripts falham, tamanho correto dos checkboxes, foco de teclado e respeito à preferência de movimento reduzido.

## Histórico de instalação do banco

Na primeira consulta em 30/10/2026 faltavam `legal_acceptances`, `legal_events`, `correction_usage` e `redacoes.avaliacao_hash`. Depois da aplicação do SQL pelo responsável, a disponibilidade dessas tabelas, da coluna e das funções foi verificada. A pendência inicial foi resolvida. As instruções abaixo ficam como referência de instalação e não pedem nova execução em um banco já atualizado.

No **SQL Editor do Supabase**, execute **`docs/SUPABASE-ATUALIZACAO.sql`** se as migrations anteriores a 29/10/2026 já estiverem aplicadas. O arquivo reúne as quatro migrations mais recentes em uma transação. Caso faltem migrations anteriores, aplique-as antes, em ordem cronológica. Faça backup antes de alterar dados existentes.

Para um projeto Supabase totalmente novo, use **`docs/SUPABASE-NOVO-PROJETO.sql`**. Não use o instalador de banco novo em banco já configurado. Gere os arquivos novamente com `npm.cmd run prepare:sql`; esse comando não conecta ao banco.

A migration do cadastro exige campos de aceite, portanto o cadastro atualizado deve acompanhar a mudança do banco. Não há aceite retroativo inventado para contas antigas. O trigger atende cadastro por e-mail; provedores sociais e convites precisam de fluxo próprio antes de serem habilitados.

## Configurações externas restantes

1. **SMTP do Supabase:** configurar provedor de envio, remetente validado e limites apropriados para confirmação e recuperação. `portuguesmais02@gmail.com` é o contato público. Não houve login no Gmail, configuração de SMTP ou envio automático de recibos. Os registros de aceite ficam no banco, associados à conta de cada estudante. Referência: https://supabase.com/docs/guides/auth/auth-smtp
2. **Autenticação:** conferir confirmação de e-mail, proteção contra cadastros abusivos e limites. Configurar Site URL e redirects HTTPS para `/` e `/recuperar?reset=1` no domínio final.
3. **Hospedagem:** usar o `vercel.json` existente e as variáveis de `.env.example`. Definir `APP_ORIGIN` com a origem HTTPS definitiva, sem barra final. Manter `LOCAL_DEMO_AUTH=false`. `LOCAL_GUEST_MODE` não é usado. A origem de produção ainda falta na configuração atual.
4. **Groq:** verificar quota, modelos e prazo da função no plano contratado. Uma chamada de poucas palavras não comprova capacidade para corrigir uma foto. Os limites do provedor continuam aplicáveis.
5. **Operação:** identificar formalmente o responsável, acompanhar o e-mail, definir retenção de backups, orçamento, monitoramento e atendimento de exclusão. Conferir os textos públicos com essas decisões e com os contratos dos provedores. O mecanismo de aceite não certifica conformidade legal.
6. **Menores de idade:** definir faixa etária e procedimento adequado para responsáveis antes de abertura ampla, especialmente se crianças forem admitidas. A indicação de orientação de responsável nos termos não substitui esse procedimento.

## Atendimento de privacidade

O estudante pode exportar dados e revogar a IA no perfil. Pedidos de exclusão e cópia das fotos são recebidos pelo e-mail público. Verifique a identidade pelo e-mail da conta, sem pedir senha. Para excluir uma conta, remova primeiro seus arquivos no bucket privado `redacoes`, depois exclua o usuário no painel administrativo do Supabase. As tabelas deste projeto usam exclusão em cascata. Em servidor persistente, limpe os caches durante a manutenção de exclusão. Informe os ciclos de logs e backups dos provedores e registre o atendimento em local controlado.

Direitos e revogação: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares

## Verificações

- `npm.cmd test`: testes de API, fotos, avaliações, deduplicação, aceite, revogação, falha do banco, quotas compartilhadas e proteção da configuração pública.
- `npm.cmd run build`: compilação de produção.
- `npm.cmd audit --omit=dev`: nenhuma vulnerabilidade conhecida reportada nas dependências de produção nesta revisão.
- `npm.cmd run check:readiness`: confere configuração local sem imprimir segredos. Não certifica SMTP, migrations executadas ou domínio.

Os testes novos usam banco e provedores simulados. O SQL não foi executado em Postgres de teste e não houve validação visual automatizada em navegador nesta revisão. Antes de divulgar, validar no domínio final com duas contas reais: cadastro, confirmação, login, recuperação, aceite de conta antiga, correção de texto e foto, histórico sem duplicação, evolução, exportação, revogação bloqueando novos envios, novo aceite, saída e isolamento entre contas. Conferir falha de rede e limite da Groq.

## Executar localmente

Node.js 22.22 ou superior. Configure `.env`, aplique as migrations pendentes e execute `npm.cmd start`. Abra http://localhost:3000. O processo Node precisa de rede para autenticar e corrigir. Não versione `.env`, tokens, senhas, caches ou exportações.
