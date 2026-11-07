# Revisão local antes da publicação — 03/11/2026

## Resultado

O site continua sem publicação. Foram corrigidos defeitos locais verificáveis e concluídas verificações automatizadas. Esta revisão não certifica ausência de todos os defeitos e não resolve credenciais ou configurações privadas dos provedores.

## Defeitos corrigidos

- Renovar uma sessão após resposta 401 não reenvia a operação usando uma conta diferente. O corpo de uma resposta tardia também é rejeitado se a conta mudar antes da leitura, evitando guardar dados na conta errada.
- A sincronização de pendências fixa a identidade da conta original antes do envio. Mais de trinta avaliações ainda não sincronizadas são preservadas, em vez de truncadas silenciosamente.
- Falhas de consulta do contador de uso ou reservas recusadas não gastam a quota local. A liberação de uma reserva é idempotente.
- Sair da página após uma correção não recria o rascunho já concluído. Alterações de texto ou tema feitas durante a espera são mantidas.
- Histórico e evolução conciliam registros locais/remotos pelo identificador da avaliação para evitar dupla contagem após uma gravação cuja confirmação se perdeu.
- Consultas paginadas ordenam também por ID, evitando ordem instável quando datas coincidem. Datas locais inválidas não derrubam toda a tela do histórico.
- Abrir uma correção pelo histórico continua permitindo leitura na própria página se o navegador não puder salvar o resultado para outra página.

## Evidências

- `npm.cmd test`: 66 testes passaram.
- `npm.cmd run build`: compilação concluída.
- `npm.cmd audit --omit=dev`: nenhuma vulnerabilidade conhecida reportada nas dependências de produção nesta consulta.
- `node scripts/browser-smoke.cjs`: Chrome headless com perfil temporário e serviços simulados, 12 páginas em larguras de 1366 e 390 pixels. Sem rolagem horizontal, erro de carregamento de recursos ou exceção JavaScript nas telas verificadas.
- Interações no navegador: texto e tema sobrevivem a recarregamento; falha simulada da correção mantém o texto e libera o botão; campo extra de tema ausente; conta que já aceitou não vê novamente a página de aceite.
- Capturas e relatório ficam em `.qa/`, ignorado pelo Git. O teste usa conta fictícia e intercepta chamadas ao Supabase e à IA; não cria usuários, envia e-mails nem consome Groq.

## Pendências para liberar ao público

1. **Recuperação por e-mail:** o último envio real autorizado retornou HTTP 500 e o log Auth mostrou SMTP 535. O teste local Gmail aceitou as credenciais, mas a diferença no Supabase não foi identificada. O fluxo não deve ser anunciado como funcionando até um link chegar, permitir a troca e o novo login ser validado.
2. **Contas reais e RLS:** executar o roteiro com duas contas reais e confirmar isolamento, gravação, exportação, revogação e novo aceite no banco atual. Os testes locais não substituem essa verificação.
3. **Correções reais:** validar redações representativas e fotos manuscritas, limites e tempo de resposta da conta Groq. Preços ou disponibilidade de modelos não foram alterados nesta revisão.
4. **Câmera e dispositivos:** testar a câmera em Android/iPhone reais e o site em navegadores adicionais. Chrome headless não valida permissões físicas de câmera.
5. **Proteção contra abuso:** integrar e configurar proteção de cadastro/login no Supabase antes de tráfego público amplo, além das quotas de correção existentes.
6. **Menores:** definir procedimento e base legal adequados para o público infantil antes de anunciar atendimento irrestrito a todas as idades; ver `PRIVACIDADE-ATENDIMENTO.md`.
7. **Operação e hospedagem:** configurar domínio HTTPS e origem, variáveis, redirects, orçamento, backups e monitoramento. Registrar o domínio não executa esses passos automaticamente.

O suporte e a exclusão manual continuam sob responsabilidade do dono do projeto, pelo contato já definido. Nenhum dado de usuário foi excluído nesta revisão e nenhuma mudança remota ou publicação foi feita.
