# Verifica??o da corre??o ? 10/11/2026

Teste real com os tr?s textos autorais da p?gina de exemplos, usando o tema de desinforma??o exibido no site. Modelo: openai/gpt-oss-120b; temperatura 0 e seed 42. Nenhuma nota de refer?ncia foi enviada ao modelo e nenhum resultado foi gravado na conta de um usu?rio.

| Refer?ncia did?tica | Resultado observado | C1 / C2 / C3 / C4 / C5 |
| --- | --- | --- |
| 500 | 480 | 120 / 120 / 80 / 80 / 80 |
| 800 | 800 | 160 / 160 / 160 / 160 / 160 |
| 1000 | 1000 | 200 / 200 / 200 / 200 / 200 |

Uma execu??o por exemplo conclu?da. As refer?ncias s?o did?ticas, n?o notas oficiais. Este conjunto pequeno n?o comprova calibra??o geral nem garante resultados id?nticos em execu??es futuras. O exemplo de 500 precisou ser reenviado ap?s um limite tempor?rio do provedor.

A altera??o acrescenta uma compara??o expl?cita entre descritores de 120, 160 e 200, com trecho e justificativa para notas altas. N?o h? desconto fixo, teto de nota ou segunda chamada obrigat?ria. Os descritores inferiores e o c?lculo da soma permanecem iguais. O prompt ? compartilhado pela avalia??o de texto e foto, mas esta verifica??o usou texto; n?o valida transcri??o de imagem.

O cache inclui o prompt na chave; novas submiss?es usam a nova vers?o, e relat?rios antigos permanecem no hist?rico. O bloco novo acrescentou 810 caracteres ao prompt (de 5572 para 6382); n?o foi feita medi??o comparativa de tokens nesta rodada. Os dois argumentos por tema s?o conte?do do navegador e n?o s?o acrescentados ? solicita??o de corre??o.

Verifica??o t?cnica: 89 testes passaram; build de produ??o passou; navegador em 1366 e 390 pixels verificou 13 rotas e a presen?a de dois argumentos desenvolvidos em todos os temas, incluindo tema livre.
