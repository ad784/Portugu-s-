# Verifica??o da corre??o ? 10/11/2026

Vers?o mais cr?tica solicitada para treinamento. Teste real com textos autorais da p?gina de exemplos, usando o tema de desinforma??o exibido no site. Modelo: openai/gpt-oss-120b; temperatura 0 e seed 42. Nenhuma nota de refer?ncia foi enviada junto ? reda??o de teste; nenhum resultado foi gravado na conta de um usu?rio.

| Refer?ncia did?tica | Resultado observado na vers?o final | C1 / C2 / C3 / C4 / C5 |
| --- | --- | --- |
| 800 | 760 | 160 / 120 / 160 / 160 / 160 |
| 1000 | 960 | 160 / 200 / 200 / 200 / 200 |

Uma execu??o conclu?da por exemplo acima. O teste de 500 desta rodada foi bloqueado pelo limite tempor?rio do Groq, portanto n?o h? resultado novo para essa faixa. Na vers?o anterior havia recebido 480; esse resultado n?o valida a vers?o atual.

As refer?ncias s?o did?ticas, n?o notas oficiais. A rubrica cont?m duas ?ncoras resumidas para comparar qualidade, incluindo um trecho comentado do pr?prio exemplo intermedi?rio. Assim, o resultado desse exemplo ? uma verifica??o de comportamento, n?o valida??o independente nem prova de calibra??o geral. As notas podem variar; ? preciso ampliar a avalia??o com textos in?ditos avaliados por humanos.

Mudan?a: C2 exige desenvolvimento al?m da exposi??o previs?vel para 160; C3 exige sustenta??o dos eixos centrais. Mantidos os descritores inferiores, a soma por compet?ncia e a aus?ncia de desconto fixo ou teto global. N?o foi adicionada uma segunda chamada obrigat?ria.

O prompt ? compartilhado por texto e foto. Esta verifica??o usa texto e n?o valida transcri??o de imagem. O cache inclui o prompt na chave; novas submiss?es usam a nova vers?o, enquanto relat?rios antigos permanecem no hist?rico.

Prompt de texto: 7481 caracteres, contra 6382 na vers?o anterior. As ?ncoras s?o resumidas; n?o se enviam reda??es-modelo completas. N?o foi feita medi??o comparativa de tokens nesta rodada.

Verifica??o t?cnica: 89 testes passaram. Nenhuma altera??o de interface ou build do frontend nesta rodada.
