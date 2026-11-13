# Verificação da correção — 10/11/2026

O prompt diferencia relato pessoal de argumentação: C2 verifica o desenvolvimento do recorte social; C3 não considera pena, deboche ou mera opinião como defesa sustentada; C5 verifica se a ação enfrenta o problema proposto antes de contar elementos. Uma condição pessoal mencionada não justifica desconto ou inferências sobre o indivíduo. Não há desconto global nem mudança no cálculo da soma.

Teste real da versão atual, uma execução por caso, com openai/gpt-oss-120b, temperatura 0 e seed 42:

| Caso | Resultado | C1 / C2 / C3 / C4 / C5 |
| --- | --- | --- |
| Texto ambiental inteiramente fictício, repetitivo, sem sustentação e com proposta vaga | 200 | 40 / 40 / 40 / 40 / 40 |
| Exemplo público excelente do site, sobre desinformação | 1000 | 200 / 200 / 200 / 200 / 200 |

O texto específico fornecido pelo usuário não foi enviado ao provedor: a revisão automática bloqueou esse teste por conter informação de saúde sobre terceiro. O teste alternativo não valida a nota desse texto. Nenhum resultado de teste foi gravado na conta de um usuário.

Os resultados não constituem validação geral. As referências do site são didáticas, não notas oficiais. O prompt contém duas âncoras resumidas, incluindo um trecho comentado do exemplo intermediário; os exemplos do site fazem parte do conjunto de desenvolvimento, não são testes independentes. É preciso ampliar a avaliação com textos inéditos avaliados por humanos.

Na versão anterior, o exemplo de 800 recebeu 760 (160 / 120 / 160 / 160 / 160), e o de 1000 recebeu 960 (160 / 200 / 200 / 200 / 200). O exemplo de 500 foi bloqueado pelo limite temporário do Groq nessa rodada. Esses números anteriores não validam a versão atual.

O prompt é compartilhado por texto e foto. Os testes reais acima usam texto e não validam transcrição de imagem. O cache inclui o prompt na chave; novas submissões usam a nova versão, enquanto relatórios antigos permanecem no histórico.

O prompt atual de texto tem 8309 caracteres; o de foto, 8561. Não foi medida a diferença de tokens. Não foi acrescentada uma segunda chamada obrigatória à avaliação.

Verificação técnica: 93 testes passaram. Nenhuma alteração de interface nesta rodada.
