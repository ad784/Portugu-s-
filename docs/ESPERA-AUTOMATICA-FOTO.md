# Espera automática no envio de fotos

Quando o provedor rejeita uma foto com limite temporário, a página guarda o rascunho e espera o prazo informado, acrescido de 1 a 4 segundos para distribuir reenvios simultâneos. O mesmo envio é repetido automaticamente, com o botão principal bloqueado e contagem regressiva. A espera pode ser cancelada sem perder a imagem.

São permitidas até seis novas tentativas, com orçamento total de 300 segundos de espera. O tempo de processamento e rede se soma a esse orçamento. A página precisa permanecer aberta; navegadores podem retardar temporizadores em segundo plano. O código verifica a identidade da conta antes de cada tentativa, não reenviando a foto após troca de conta. A foto pode ser recuperada pelo rascunho após recarregar, mas uma nova execução exige confirmação do envio.

Só códigos internos explícitos de indisponibilidade temporária permitem repetição. Cotas diárias, falta de permissão, erro de imagem e pedidos que excedem a capacidade individual não são repetidos automaticamente. Limites de segurança por usuário continuam ativos.

Isso não é uma fila global durável e não aumenta o limite da Groq. Cada navegador administra a própria espera; não há ordem FIFO garantida entre usuários ou instâncias. Sob uso contínuo acima da capacidade, as tentativas podem se esgotar. Para vários avaliadores simultâneos, é necessário elevar/dimensionar a cota do provedor ou implementar processamento assíncrono com fila durável e capacidade correspondente. O plano atual deve ser conferido na organização usada pela chave da Vercel: https://console.groq.com/settings/limits.

O prompt, modelo, transcrição, validação das cinco competências e cálculo das notas permanecem iguais. As esperas ocorrem fora da função da Vercel; cada tentativa é uma requisição independente. Não foi realizada cobrança de plano nem alterada configuração privada da Groq.
