# Medição e reaproveitamento de correções

Atualização posterior: o prompt foi reescrito a pedido do usuário para maior rigor e menor tamanho (5.062 caracteres de texto; 5.314 de foto), sem os exemplos completos. A descrição final abaixo registra etapas anteriores da revisão. As notas históricas continuam preservadas; novas avaliações usam a chave correspondente ao prompt novo.

Execute `node scripts/groq-usage.cjs` depois de usar as correções. O resumo inclui as chamadas registradas, tentativas extras, erros HTTP, tokens de entrada e saída, tokens de entrada reaproveitados pela Groq e resultados reaproveitados pelo site. Os registros começam com esta atualização; não recuperam o consumo antigo.

Dados ausentes na resposta do provedor permanecem desconhecidos, e o resumo informa quantas chamadas não trouxeram consumo/cache. Uma falha de rede pode ter consumido tokens no provedor sem retornar dados ao site. O painel da Groq continua sendo a referência de cobrança. Chamadas de testes simulados também geram registros locais, portanto use um diretório separado para testes.

Os eventos ficam em `.groq-usage/events.jsonl`, com uma rotação de 5 MB e um arquivo anterior. Não são enviados ao Git. Não incluem redações, fotos, senhas, chaves ou identificadores de usuários. `GROQ_METRICS_DIR` permite escolher outro diretório. Na Vercel também são emitidos nos logs da função; arquivos temporários não constituem um histórico durável entre instâncias.

O cache automático da Groq depende do modelo e de acertos do provedor. O prefixo estático existente foi preservado; não houve alteração do prompt para tentar forçar acertos. Consulte `cachedTokens` nos eventos para observar seu uso real.

O site já consulta o histórico do próprio usuário, reutiliza resultados locais por até 24 horas e agrupa pedidos idênticos simultâneos no mesmo processo. Agora também mantém até 500 resultados em memória para evitar repetir uma avaliação se o disco estiver indisponível. A chave e a separação por usuário continuam iguais. Pedidos simultâneos em instâncias distintas não compartilham esse bloqueio; a proteção atual não promete eliminar duplicações entre servidores antes de a primeira gravação terminar.

A implementação da medição preservou modelo, prompt, exemplos, parâmetros e notas salvas. Posteriormente, a pedido do usuário, o parágrafo de calibração do prompt foi substituído por uma orientação mais rigorosa e 100 caracteres menor. As notas históricas continuam preservadas; o novo prompt diferencia automaticamente a chave de cache das futuras avaliações. As tentativas necessárias para falhas de formato continuam habilitadas e passam a ser medidas. Para verificar: `npm.cmd test`.
