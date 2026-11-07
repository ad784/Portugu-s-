# Diagnóstico de limite de fotos — 07/11/2026

O texto “limite temporário de leitura de fotos” era emitido após uma resposta HTTP 429 da Groq. As rejeições por usuário no site têm outras mensagens. A cota da Groq pertence à organização que fornece a chave, não a cada cadastro do Português+.

Uma chamada técnica direta com PNG gerado e sem redação respondeu HTTP 200. Os headers da conta indicaram 8.000 tokens por minuto e 1.000 pedidos por dia para `qwen/qwen3.8-27b`. O teste informou 2.804 tokens de entrada e 595 de saída (3.399 totais). Uma foto de redação real requer transcrição e avaliação e pode gerar mais saída; o teste não valida leitura de manuscrito nem precisão da nota. Não reproduziu a rejeição relatada.

No momento da investigação, os registros locais tinham seis chamadas de texto bem-sucedidas e nenhuma de foto. Assim, não foi possível confirmar a dimensão exata atingida na tentativa do aluno, nem se ela ocorreu em outro servidor. Não inferir que a cota estava livre naquele momento apenas porque o teste posterior passou.

Reduzir o prompt reduz parte da entrada, mas não elimina tokens da imagem, da transcrição, do relatório e das tentativas de recuperação de JSON. O cache de resultados evita refazer a mesma foto do mesmo usuário, mas não permite reaproveitar avaliações privadas entre cadastros. Criar conta no site não cria uma nova cota da Groq.

Correções locais: mensagem explícita de cota compartilhada; uso de `retry-after`, prazo do erro ou reset de tokens antes do fallback estimado de 60 segundos; distinção entre saturação temporária e pedido individual maior que a capacidade, para não prometer que esperar resolverá um pedido que nunca cabe. As métricas passam a registrar categoria e limites numéricos do HTTP 429, sem guardar a mensagem bruta ou identificadores da organização. Prompt, modelo e parâmetros de geração não foram alterados.

Os limites exatos são consultáveis em https://console.groq.com/settings/limits. Para atender vários usuários, é necessário dimensionar a capacidade do provedor. Não contornar quotas com contas ou chaves extras. Referências: https://console.groq.com/docs/rate-limits e https://console.groq.com/docs/model/qwen/qwen3.8-27b.
