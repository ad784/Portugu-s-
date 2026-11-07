# Cópia do prompt e diagnóstico de consumo — atualizado em 06/11/2026

Atualização: o prompt ativo foi reescrito em `backend/services/text-rubric.js`: 5.062 caracteres em texto e 5.314 em foto. Não incorpora mais as redações completas de `calibration-examples.json`, nem o exemplo JSON extenso. Mantém os descritores por competência, exige evidências e orienta usar faixas inferiores quando falta desenvolvimento efetivo. As notas históricas não foram recalculadas. Os números e a descrição abaixo registram a análise anterior; os arquivos TXT/JSON foram regenerados e representam a versão atual. Ainda é necessário comparar correções reais para validar o efeito nas notas e no consumo.

Os arquivos `GROQ-PROMPT-TEXTO.txt` e `GROQ-PROMPT-FOTO.txt` contêm as mensagens de sistema completas, já com instruções auxiliares e exemplos expandidos. Os arquivos `GROQ-REQUISICAO-TEXTO.json` e `GROQ-REQUISICAO-FOTO.json` mostram os corpos das chamadas montados pelo código atual, usando texto fictício, tema de exemplo e marcador de imagem. Não incluem headers de autorização nem dados reais de estudantes.

Essas são cópias para leitura. Editá-las não altera o site. O prompt ativo é montado por `backend/services/text-rubric.js`, `strict-rubric.js` e `calibration-examples.json`; os envelopes de texto/foto ficam em `text-evaluation.js` e `photo-correction.js`. Para atualizar as cópias, execute `node scripts/export-groq-prompts.cjs`. O exportador intercepta as requisições e não chama a Groq nem grava avaliações.

## Medidas verificadas

- Mensagem de sistema de texto: **12.988 caracteres**, antes da redação e do tema.
- Mensagem de sistema de foto: **13.240 caracteres**, antes da imagem e do tema.
- Exemplos de calibração: **3.659 caracteres** de JSON inseridos no prompt (aproximadamente 28,2% do prompt de texto). Incluem **duas redações completas** e suas referências de nota.
- Schema JSON de texto: **1.014 caracteres**, enviado separadamente quando o modelo usa modo de schema.
- Limite de saída: texto **4.000 tokens**, foto **3.000 tokens**. Texto pode aumentar para **6.000** se a primeira resposta for truncada e uma nova tentativa for feita.

**Caracteres não são tokens.** Não foi feita uma medição com o tokenizer exato nem chamadas pagas nesta análise. Esses limites de saída não significam consumo obrigatório de toda a reserva; uso e cobrança reais precisam ser conferidos no campo `usage` das respostas e no painel. Imagens e tokens de raciocínio também precisam ser considerados conforme o modelo.

## O que pesa e como reduzir com controle de qualidade

1. As instruções repetem regras gerais de rigor, evidências e competências em seções diferentes. Podem ser consolidadas preservando os mesmos descritores.
2. As duas redações completas de calibração são reenviadas a cada avaliação. Uma opção é substituí-las por perfis resumidos ou trechos menores, mas isso pode alterar as notas e exige comparação com uma bateria de textos de referência.
3. Há um exemplo JSON no próprio prompt, além do schema enviado na requisição. Em modelos que seguem schema, parte dessa duplicação pode ser retirada e validada.
4. Cada competência pede comentário e registros de requisitos com evidência e análise, aumentando a resposta. A saída deve ser compactada sem perder o feedback que o estudante precisa.
5. Uma resposta incompleta pode provocar uma segunda chamada, reenviando a entrada. O texto faz no máximo duas tentativas; a foto pode trocar schema estrito por JSON simples em falha recuperável. Aumentar a tolerância de formato não deve permitir relatórios sem as cinco competências ou transcrições inventadas.

O próximo trabalho de otimização deve medir `usage` por modalidade, montar uma versão curta e comparar qualidade e consumo nos mesmos textos e fotos. Não foi trocado modelo, prompt ativo, limite ou critério de nota nesta entrega. Não há garantia de percentual de economia sem essa medição.

## Estado do GitHub

Nesta verificação havia alterações locais sem commit e arquivos novos não rastreados. A árvore remota consultada no GitHub não tinha os novos módulos de rubrica, cache e sessão desta revisão. As atualizações locais não foram publicadas por este trabalho. As cópias deste documento também permanecem locais até um commit e push explícitos.
