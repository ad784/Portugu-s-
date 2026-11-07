# Espera automática no envio de fotos

Investigação posterior em 07/11: foram observados HTTP 503 após aproximadamente 30 segundos no modelo de fotos. Esses erros temporários agora também permitem a espera automática. Um teste direto identificou ainda limite independente de saída (OTPM): 1.000 tokens/minuto para uma resposta estimada em 1.065, rejeitada antes de gerar conteúdo. Isso não se resolve somente esperando ou reduzindo o prompt de entrada; requer dimensionamento do limite de saída da organização. Não foi reduzido o tamanho máximo da resposta para forçar uma avaliação incompleta. Falhas de autorização e modelo indisponível recebem mensagens próprias e não são repetidas.

Quando o provedor rejeita uma foto com limite temporário, a página guarda o rascunho e espera o prazo informado, acrescido de 1 a 4 segundos para distribuir reenvios simultâneos. O mesmo envio é repetido automaticamente, com o botão principal bloqueado e contagem regressiva. A espera pode ser cancelada sem perder a imagem.

São permitidas até seis novas tentativas, com orçamento total de 300 segundos de espera. O tempo de processamento e rede se soma a esse orçamento. A página precisa permanecer aberta; navegadores podem retardar temporizadores em segundo plano. O código verifica a identidade da conta antes de cada tentativa, não reenviando a foto após troca de conta. A foto pode ser recuperada pelo rascunho após recarregar, mas uma nova execução exige confirmação do envio.

Só códigos internos explícitos de indisponibilidade temporária permitem repetição. Cotas diárias, falta de permissão, erro de imagem e pedidos que excedem a capacidade individual não são repetidos automaticamente. Limites de segurança por usuário continuam ativos.

Isso não é uma fila global durável e não aumenta o limite da Groq. Cada navegador administra a própria espera; não há ordem FIFO garantida entre usuários ou instâncias. Sob uso contínuo acima da capacidade, as tentativas podem se esgotar. Para vários avaliadores simultâneos, é necessário elevar/dimensionar a cota do provedor ou implementar processamento assíncrono com fila durável e capacidade correspondente. O plano atual deve ser conferido na organização usada pela chave da Vercel: https://console.groq.com/settings/limits.

O prompt, modelo, transcrição, validação das cinco competências e cálculo das notas permanecem iguais. As esperas ocorrem fora da função da Vercel; cada tentativa é uma requisição independente. Não foi realizada cobrança de plano nem alterada configuração privada da Groq.
