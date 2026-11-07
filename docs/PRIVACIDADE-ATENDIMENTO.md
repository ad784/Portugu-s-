# Atendimento de privacidade — operação definida em 03/11/2026

O responsável pelo projeto assumiu o atendimento de exclusão. O canal público é `portuguesmais02@gmail.com`. O perfil oferece uma mensagem de solicitação pronta para abrir no aplicativo de e-mail; o site não envia esse pedido automaticamente e não exclui contas ao clicar no link.

## Antes de atender um pedido

- Registre data, tipo de solicitação e um identificador de atendimento em local restrito. Não copie senhas, tokens ou redações para planilhas ou logs de suporte.
- Verifique a titularidade. O cadastro atual não verifica a propriedade do endereço de e-mail; uma mensagem enviada desse endereço, sozinha, não resolve todos os casos. Prefira um procedimento vinculado à sessão autenticada e valide o caso antes de apagar ou revelar dados. Nunca peça a senha da conta. Para pedidos de responsáveis legais, estabeleça verificação proporcional da representação, sem coletar documentos desnecessários.
- Informe o que será removido, como os backups são tratados e como a conclusão será comunicada. Não prometa remoção imediata de cópias de provedores sem conhecer suas políticas.

## Exportação

O perfil permite baixar JSON com os dados da própria conta: perfil, redações, recibo e histórico de autorizações. O arquivo também inclui texto, resultado, pendências e foto ainda não enviada disponíveis no dispositivo atual. Eventos e redações são paginados para não truncar a exportação no limite padrão do Supabase. Fotos já enviadas são referenciadas por caminhos privados, não por links públicos. Quando a pessoa pedir cópia dessas imagens, obtenha os arquivos apenas do diretório da conta verificada no bucket privado `redacoes`.

## Revogação e novo aceite

O botão do perfil revoga a autorização de IA. Novos envios são bloqueados pelo backend; histórico, perfil e exportação continuam disponíveis. Uma chamada já enviada ao provedor pode concluir. O usuário pode revisar os documentos e registrar novo aceite na tela `/aceite`. O horário e a versão vêm do servidor. Nenhuma ação de suporte deve inventar ou editar um aceite para liberar uma conta.

## Exclusão manual

1. Depois de verificar a solicitação, identifique o UUID correto da conta no Supabase. Não procure apenas por nomes.
2. Remova as fotos daquele usuário no bucket privado `redacoes`, verificando o prefixo UUID e nunca apagando o bucket inteiro.
3. Exclua o usuário correto em Authentication → Users. As referências das tabelas do projeto usam exclusão em cascata.
4. Confirme a remoção dos dados da conta, incluindo recibos, eventos, consumo e redações. Verifique a política de retenção de logs e backups dos provedores.
5. Em servidor persistente, limpe os caches de avaliações na rotina de manutenção e trate cópias de suporte. Oriente o usuário a limpar os dados locais do site em dispositivos próprios; o servidor não apaga remotamente o armazenamento de um navegador desligado.
6. Registre a conclusão e responda ao solicitante por um canal verificado.

Essa operação exige acesso administrativo ao Supabase. Não use chaves privilegiadas no frontend e não desative RLS para fazer atendimento.

## Público estudante, crianças e adolescentes

A intenção do projeto é atender público amplo, principalmente estudantes, sem criar uma restrição arbitrária de idade na interface. Isso não torna a operação automaticamente adequada para qualquer faixa etária. Antes da abertura irrestrita a crianças, o responsável deve definir a base legal e o procedimento de participação de responsáveis, avaliar o melhor interesse e conferir os termos dos provedores de IA e armazenamento para esse público. A orientação nos textos públicos e um checkbox do estudante não comprovam autorização parental.

Não foi implementada uma verificação de idade nem um fluxo verificável de responsável nesta entrega, porque não há um procedimento operacional definido. Essa pendência deve ser resolvida para anunciar atendimento irrestrito a todas as idades. Não há coleta nova de data de nascimento ou documentos.

Referências oficiais: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes e https://normas.leg.br/?urn=urn:lex:br:federal:lei:2018-08-14;13709!art14

## Verificação desta entrega

Testes simulam isolamento da conta, exportação paginada, aceite → revogação → bloqueio → novo aceite, falha de rede, expiração e armazenamento local bloqueado. Não substituem duas contas reais em produção nem a execução de uma exclusão real. Não foram excluídos registros ou enviadas mensagens nesta revisão.
