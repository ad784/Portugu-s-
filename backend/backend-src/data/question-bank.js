// Material v2: the first authored alternative is correct; placement varies in the
// public catalog, and the browser shuffles display order again for each round.
const positions = [1, 0, 2, 2, 1, 0, 1, 2, 0, 1, 1, 2, 0, 2, 0, 1, 2, 0, 1, 2];
function question(id, skillId, prompt, options, explanation, excerpt = "") {
  const index = Number(id.slice(1)) - 1;
  const shift = id[0] === "f" ? 0 : id[0] === "m" ? 1 : 2;
  const answer = (positions[index] + shift) % 3;
  const arranged = options.slice(1);
  arranged.splice(answer, 0, options[0]);
  return {
    id,
    skillId,
    prompt,
    excerpt,
    options: arranged,
    answer,
    explanation,
  };
}

const easy = [
  question(
    "f01",
    "introducao",
    "Qual é a principal função da introdução de um texto argumentativo?",
    [
      "Apresentar o problema, delimitar o tema e indicar a posição que será defendida.",
      "Apresentar o problema, escolher os exemplos e explicar cada argumento em detalhes.",
      "Apresentar o problema, resumir as soluções e reservar a posição para a conclusão.",
    ],
    "A introdução orienta o leitor: apresenta o recorte da discussão e a posição do texto. Os argumentos serão desenvolvidos depois, e a tese não precisa ficar escondida até o final.",
  ),
  question(
    "f02",
    "tese",
    "Qual alternativa apresenta uma tese sobre o acesso à leitura?",
    [
      "Ampliar o acesso à leitura exige bibliotecas públicas próximas e ações de formação leitora.",
      "O acesso à leitura envolve bibliotecas públicas e diferentes tipos de textos escritos.",
      "O acesso à leitura será o assunto deste texto sobre bibliotecas públicas brasileiras.",
    ],
    "A tese defende uma posição que pode ser justificada: o acesso depende de proximidade e formação. As outras frases apresentam o assunto, mas não estabelecem uma posição sobre ele.",
  ),
  question(
    "f03",
    "argumentacao",
    "Qual continuação explica uma causa do desperdício de alimentos?",
    [
      "Sem planejar as compras, os estabelecimentos podem acumular alimentos que vencem antes da venda.",
      "Em estabelecimentos comerciais, o desperdício é um problema conhecido por vários grupos sociais.",
      "Para diversos estabelecimentos, o desperdício de alimentos constitui uma questão importante da atualidade.",
    ],
    "A falta de planejamento é ligada a um mecanismo concreto: comprar em excesso e não vender antes do vencimento. As outras opções reconhecem o problema, mas não explicam sua causa.",
  ),
  question(
    "f04",
    "repertorio",
    "Como uma referência deve participar da argumentação?",
    [
      "Ela deve ser contextualizada e relacionada à posição que o parágrafo pretende sustentar.",
      "Ela deve ser apresentada e considerada suficiente para comprovar qualquer ideia do parágrafo.",
      "Ela deve ser reconhecida e colocada antes de uma mudança no assunto discutido.",
    ],
    "A referência precisa cumprir uma função no raciocínio. Explicar sua ligação com a ideia defendida evita que ela apareça apenas como uma citação decorada.",
  ),
  question(
    "f05",
    "coesao",
    "Qual conectivo expressa adequadamente a relação entre as frases?",
    [
      "Porém: a gratuidade não elimina outra dificuldade que ainda pode impedir a participação.",
      "Portanto: a gratuidade produz outra dificuldade que ainda pode impedir a participação.",
      "Porque: a gratuidade explica outra dificuldade que ainda pode impedir a participação.",
    ],
    "O segundo período contrasta com a expectativa criada pelo primeiro: mesmo gratuito, o evento pode continuar inacessível. Por isso, a relação é de oposição, não de causa ou conclusão.",
    "A entrada do evento é gratuita. ___, o transporte até o local continua caro.",
  ),
  question(
    "f06",
    "conclusao",
    "Qual proposta informa quem age e como a ação pode acontecer?",
    [
      "A prefeitura pode oferecer oficinas nos bairros, utilizando escolas públicas locais nos finais de semana.",
      "A população pode valorizar oficinas nos bairros, reconhecendo sua importância para a vida cultural.",
      "A comunidade pode desejar oficinas nos bairros, considerando necessárias mudanças na realidade cultural local.",
    ],
    "A proposta da prefeitura identifica um agente, uma ação e um meio de execução. Desejar ou valorizar uma medida não esclarece, por si só, como ela será realizada.",
  ),
  question(
    "f07",
    "introducao",
    "Qual frase apresenta um recorte específico sobre mobilidade urbana?",
    [
      "A baixa oferta regular de ônibus noturnos dificulta o retorno de trabalhadores em bairros periféricos.",
      "A mobilidade nas grandes cidades envolve situações variadas e desperta opiniões entre seus moradores.",
      "A questão dos transportes urbanos acompanha mudanças sociais e merece atenção de toda sociedade.",
    ],
    "A frase delimita um serviço, um horário, um público e uma situação. As demais são amplas e não dizem qual problema de mobilidade será analisado.",
  ),
  question(
    "f08",
    "tese",
    "Qual argumento desenvolve a tese apresentada no trecho?",
    [
      "Explicar como conexões instáveis dificultam acompanhar atividades e utilizar serviços disponibilizados pela internet.",
      "Descrever como diferentes aparelhos possuem telas maiores e recursos disponíveis para entretenimento digital.",
      "Enumerar como aplicativos populares oferecem novidades frequentes e atraem públicos interessados em entretenimento.",
    ],
    "O argumento precisa desenvolver a ideia anunciada: conexão estável como condição de acesso. Falar apenas de aparelhos ou entretenimento não explica essa condição.",
    "A inclusão digital depende de uma conexão estável, além da disponibilidade de equipamentos.",
  ),
  question(
    "f09",
    "argumentacao",
    "Qual frase pode funcionar como ideia central de um parágrafo?",
    [
      "O custo das passagens limita o acesso de algumas famílias às atividades culturais.",
      "Um exemplo de atividade cultural é o cinema, seguido pelo teatro e pela música.",
      "Depois dessa discussão cultural, outro assunto será tratado nas próximas linhas deste texto.",
    ],
    "A ideia central organiza o que o parágrafo defenderá. A relação entre custo e acesso pode ser explicada e exemplificada; uma lista ou um anúncio de assunto não faz o mesmo trabalho.",
  ),
  question(
    "f10",
    "repertorio",
    "Você não lembra a fonte de uma estatística. Qual atitude é adequada?",
    [
      "Utilizar uma informação conhecida com segurança ou explicar o argumento sem inventar esse dado.",
      "Utilizar uma estimativa razoável e apresentar o valor como resultado de uma pesquisa científica.",
      "Utilizar uma instituição como fonte e atribuir a ela um resultado aproximado de pesquisa.",
    ],
    "É possível argumentar sem uma estatística. Inventar o valor ou a fonte compromete a confiabilidade; uma explicação segura é preferível a uma precisão que não pode ser sustentada.",
  ),
  question(
    "f11",
    "coesao",
    "Qual reescrita deixa claro quem enfrenta a dificuldade de acesso?",
    [
      "A escola conversou com a família sobre a dificuldade de acesso enfrentada pelos familiares.",
      "A escola conversou com a família sobre sua dificuldade de acesso, retomando aquela situação.",
      "A escola conversou com a família sobre essa dificuldade de acesso e seus possíveis efeitos.",
    ],
    "Indicar explicitamente os familiares elimina a dúvida sobre quem enfrenta a dificuldade. Trocar ‘sua’ por expressões igualmente vagas não resolve a ambiguidade.",
    "A escola conversou com a família sobre sua dificuldade de acesso.",
  ),
  question(
    "f12",
    "conclusao",
    "Qual finalidade se relaciona à oferta de bibliotecas em bairros afastados?",
    [
      "Aproximar os livros dos moradores que encontram dificuldades para chegar às bibliotecas existentes.",
      "Aumentar o prestígio dos equipamentos culturais que recebem visitantes de outras regiões urbanas.",
      "Concentrar os investimentos nas bibliotecas centrais que já apresentam maior circulação de visitantes.",
    ],
    "A finalidade precisa responder ao problema enfrentado. Criar espaços próximos pode reduzir a barreira da distância; prestígio e concentração de investimentos não cumprem essa finalidade.",
  ),
  question(
    "f13",
    "introducao",
    "Como relacionar uma contextualização ao problema que será discutido?",
    [
      "Explicar a ligação entre o contexto apresentado e o recorte temático escolhido para a discussão.",
      "Encerrar o contexto com uma expressão conhecida e iniciar uma discussão sem explicar relações.",
      "Acrescentar detalhes sobre o contexto apresentado e deixar o recorte implícito para a conclusão.",
    ],
    "A passagem do contexto para o tema precisa fazer sentido para o leitor. Uma expressão de ligação não substitui a explicação da relação entre as ideias.",
  ),
  question(
    "f14",
    "argumentacao",
    "Depois de apresentar um exemplo, o que desenvolve melhor o raciocínio?",
    [
      "Interpretar o que aquele exemplo demonstra e relacioná-lo à posição defendida no parágrafo.",
      "Acrescentar outro caso semelhante e reservar para o leitor a interpretação dos exemplos.",
      "Retomar a opinião inicial com palavras diferentes e encerrar o parágrafo após os exemplos.",
    ],
    "Um exemplo precisa ser interpretado. Explicar o que ele demonstra conecta a situação à ideia central, em vez de apenas acumular casos ou repetir a opinião inicial.",
  ),
  question(
    "f15",
    "repertorio",
    "Qual uso de uma biblioteca comunitária sustenta uma discussão sobre acesso?",
    [
      "Relacionar sua proximidade dos moradores à redução da distância necessária para encontrar livros.",
      "Relacionar seu nome conhecido pelos moradores à importância de mencionar iniciativas em redações.",
      "Relacionar seu prédio utilizado pelos moradores à quantidade de assuntos possíveis sobre cidades.",
    ],
    "A relação entre proximidade e acesso usa o exemplo para explicar uma barreira concreta à leitura. A presença de uma iniciativa no texto, sem essa análise, não sustenta o argumento.",
  ),
  question(
    "f16",
    "coesao",
    "O que deve orientar a escolha de um conectivo?",
    [
      "A relação semântica que o autor pretende estabelecer entre as ideias do texto.",
      "A variedade de expressões que o autor consegue inserir entre as frases apresentadas.",
      "A extensão da expressão que o autor deseja utilizar entre as ideias apresentadas.",
    ],
    "Conectivos indicam relações como causa, contraste e conclusão. Sua adequação depende do sentido construído, não do tamanho nem da quantidade de expressões usadas.",
  ),
  question(
    "f17",
    "conclusao",
    "Qual agente tem atribuições diretamente relacionadas à manutenção de bibliotecas municipais?",
    [
      "A secretaria municipal de cultura, articulada à gestão das bibliotecas públicas da cidade.",
      "A associação local responsável pelo comércio, articulada à divulgação das lojas da cidade.",
      "A organização regional responsável pelo turismo, articulada à promoção das atrações da cidade.",
    ],
    "O agente escolhido precisa ter condições de realizar a ação proposta. A gestão municipal da cultura tem relação direta com esse serviço; comércio e turismo não têm a mesma atribuição.",
  ),
  question(
    "f18",
    "introducao",
    "Qual organização mantém a coerência com a introdução apresentada?",
    [
      "Desenvolver a distribuição dos equipamentos culturais e explicar as dificuldades de deslocamento dos moradores.",
      "Desenvolver a classificação dos gêneros culturais e explicar as preferências individuais dos diferentes públicos.",
      "Desenvolver a trajetória dos artistas culturais e explicar as características de suas produções recentes.",
    ],
    "A introdução anuncia território e transporte como eixos. O desenvolvimento precisa aprofundá-los; os outros assuntos só seriam pertinentes se uma ligação com esses eixos fosse construída.",
    "A distância dos espaços culturais e o custo do transporte dificultam a participação de moradores dos bairros afastados.",
  ),
  question(
    "f19",
    "argumentacao",
    "Qual frase oferece uma justificativa, em vez de apenas repetir uma opinião?",
    [
      "A conexão instável prejudica o estudo porque interrompe aulas e dificulta acessar materiais digitais.",
      "A conexão instável prejudica o estudo porque representa um problema importante para muitos estudantes.",
      "A conexão instável prejudica o estudo porque torna essa situação ruim para quem precisa estudar.",
    ],
    "A justificativa mostra como o prejuízo acontece: interrupções e dificuldade para acessar materiais. As demais alternativas reforçam a avaliação negativa, mas não explicam seu funcionamento.",
  ),
  question(
    "f20",
    "tese",
    "Qual tese considera uma condição concreta para tornar o transporte mais acessível?",
    [
      "A acessibilidade do transporte exige considerar as necessidades reais de usuários com diferentes condições de mobilidade.",
      "A acessibilidade do transporte constitui um assunto presente nos debates sobre diferentes cidades brasileiras atualmente.",
      "A acessibilidade do transporte representa uma expressão utilizada em propostas sobre deslocamentos nas cidades brasileiras.",
    ],
    "A tese defende um critério para a acessibilidade: atender a necessidades diversas. As outras opções apenas descrevem a existência do assunto ou o uso da expressão.",
  ),
];

const medium = [
  question(
    "m01",
    "introducao",
    "Qual passagem conecta melhor a contextualização ao recorte do texto?",
    [
      "Apesar da oferta on-line, o acesso depende de conexão estável e de conhecimentos específicos que não estão igualmente disponíveis.",
      "Diante da oferta on-line, o acesso acompanha o crescimento das plataformas, que já atendem diferentes interesses dos usuários.",
      "Junto da oferta on-line, o acesso permite comentar os equipamentos, que aparecem em diferentes momentos da vida cotidiana.",
    ],
    "A contextualização fala da digitalização dos serviços. A passagem correta introduz uma tensão diretamente relacionada: a oferta digital não garante condições para utilizá-la. As demais não delimitam essa desigualdade.",
    "Serviços públicos e materiais escolares estão cada vez mais disponíveis em plataformas digitais.",
  ),
  question(
    "m02",
    "tese",
    "Qual tese pode ser defendida sem transformar a medida proposta em solução suficiente?",
    [
      "A gratuidade contribui para ampliar o público, mas precisa ser articulada a condições acessíveis de deslocamento e divulgação.",
      "A gratuidade contribui para ampliar o público, pois substitui os investimentos voltados à participação em atividades culturais.",
      "A gratuidade contribui para ampliar o público, já que garante a presença da maioria dos moradores em todas as atividades.",
    ],
    "A tese correta reconhece o alcance e os limites da gratuidade. Ela mantém outras condições na análise; as demais atribuem a uma única medida um efeito suficiente ou garantido.",
  ),
  question(
    "m03",
    "argumentacao",
    "Qual continuação explica por que a informação apresentada sustenta o argumento?",
    [
      "Isso pode dificultar o retorno de trabalhadores, pois reduz as alternativas disponíveis ao término de seus turnos.",
      "Isso pode demonstrar o valor do transporte, pois reforça sua importância para moradores de diferentes bairros urbanos.",
      "Isso pode motivar debates sobre ônibus, pois confirma a existência de opiniões variadas entre os moradores urbanos.",
    ],
    "A continuação explicita a consequência da oferta reduzida para um público em um horário específico. As outras reconhecem a relevância do assunto, mas não desenvolvem o mecanismo.",
    "Em alguns bairros, a oferta de ônibus diminui no período noturno.",
  ),
  question(
    "m04",
    "repertorio",
    "Qual análise torna o exemplo pertinente ao argumento sobre acesso cultural?",
    [
      "A iniciativa aproxima a programação dos moradores, mostrando que a distribuição territorial também interfere nas oportunidades de participação.",
      "A iniciativa reúne apresentações para os moradores, mostrando que o interesse pessoal explica sozinho as oportunidades de participação.",
      "A iniciativa apresenta artistas para os moradores, mostrando que a existência de eventos comprova igualdade nas oportunidades de participação.",
    ],
    "O exemplo ajuda a examinar a distância entre público e programação. Ele não prova que interesse individual seja a única condição nem que a oferta de alguns eventos elimine as desigualdades.",
    "Um projeto leva apresentações teatrais a escolas de bairros sem teatros.",
  ),
  question(
    "m05",
    "coesao",
    "Qual relação o conectivo precisa expressar entre os dois períodos?",
    [
      "Contraste: a existência de computadores não impede que a falta de conexão limite seu uso em atividades escolares.",
      "Conclusão: a existência de computadores permite deduzir que a falta de conexão decorre das próprias atividades escolares.",
      "Exemplificação: a existência de computadores é um caso particular da falta de conexão necessária às atividades escolares.",
    ],
    "O segundo período limita a expectativa criada pelo primeiro. Há equipamentos, mas uma condição necessária ao uso está ausente; não se estabelece uma causa nem uma relação de exemplo.",
    "A escola recebeu computadores. Ainda assim, a falta de conexão impede o uso de plataformas educacionais.",
  ),
  question(
    "m06",
    "conclusao",
    "Qual detalhamento torna a proposta mais executável?",
    [
      "Definir pontos de atendimento nos bairros, horários de funcionamento e profissionais responsáveis por orientar os moradores nas plataformas.",
      "Reafirmar a importância do atendimento nos bairros, destacando os benefícios esperados para a autonomia dos diferentes moradores locais.",
      "Divulgar a necessidade do atendimento nos bairros, mencionando o valor do serviço para a participação dos diferentes moradores locais.",
    ],
    "Pontos, horários e responsáveis esclarecem como o apoio funcionaria. Destacar sua importância ou necessidade pode justificar a medida, mas não detalha sua execução.",
    "A prefeitura deve oferecer apoio presencial para quem encontra dificuldades no uso dos serviços públicos digitais.",
  ),
  question(
    "m07",
    "introducao",
    "Qual problema da introdução precisa ser resolvido primeiro?",
    [
      "Falta relacionar a referência inicial às barreiras específicas que serão analisadas no acesso aos alimentos.",
      "Falta aumentar a quantidade de referências iniciais para demonstrar conhecimento sobre o tema do acesso aos alimentos.",
      "Falta substituir a referência inicial por uma expressão mais conhecida sobre o problema do acesso aos alimentos.",
    ],
    "A referência foi citada sem que sua função no raciocínio fosse explicada. Acumular citações ou trocar a frase não resolve essa falta de ligação com o recorte do texto.",
    "‘O homem é um ser social’, escreveu um filósofo. O desperdício de alimentos é um problema. É preciso discutir essa questão.",
  ),
  question(
    "m08",
    "tese",
    "Qual reformulação transforma a frase genérica em uma tese mais específica?",
    [
      "Reduzir o desperdício exige melhorar o planejamento das compras e as condições de armazenamento dos alimentos comercializados.",
      "Reduzir o desperdício exige reconhecer sua importância e valorizar as discussões já realizadas sobre os alimentos comercializados.",
      "Reduzir o desperdício exige perceber sua presença e retomar os debates já existentes sobre os alimentos comercializados.",
    ],
    "Planejamento e armazenamento são condições concretas que podem organizar os argumentos. Reconhecer a importância ou a existência do problema ainda deixa indefinido o que será defendido.",
    "O desperdício de alimentos é ruim e precisa acabar.",
  ),
  question(
    "m09",
    "argumentacao",
    "Qual etapa está faltando no desenvolvimento do argumento?",
    [
      "Explicar como a renda limita escolhas de deslocamento e conectar essa limitação à participação em atividades culturais.",
      "Repetir que a renda é importante para diferentes decisões e acrescentar outra opinião sobre a participação cultural.",
      "Informar que o transporte tem diferentes modalidades e acrescentar outra definição sobre os custos de participação cultural.",
    ],
    "O texto anuncia uma relação, mas não explica como ela funciona. Desenvolver o vínculo entre orçamento, passagem e decisão de participar dá sustentação à ideia inicial.",
    "A renda influencia o acesso à cultura. As passagens custam dinheiro. Portanto, a cultura é importante.",
  ),
  question(
    "m10",
    "repertorio",
    "Qual cuidado permite usar essa observação sem inventar uma conclusão estatística?",
    [
      "Apresentá-la como uma observação localizada e relacionar seu conteúdo às possíveis barreiras de acesso ao serviço.",
      "Apresentá-la como um resultado representativo e explicar sua relação com todas as barreiras de acesso ao serviço.",
      "Apresentá-la como uma comprovação nacional e explicar sua relação com todas as experiências de acesso ao serviço.",
    ],
    "Uma observação localizada pode ilustrar um mecanismo, mas não informa a frequência nacional do problema. O alcance da conclusão precisa respeitar o alcance da informação disponível.",
    "O estudante observou que alguns moradores de seu bairro precisam de ajuda para utilizar um aplicativo público.",
  ),
  question(
    "m11",
    "coesao",
    "Qual retomada evita atribuir a decisão ao agente errado?",
    [
      "Após receberem as sugestões das famílias, os gestores da escola decidiram ampliar os horários de atendimento.",
      "Após receberem as sugestões dos gestores, as famílias da escola decidiram ampliar os horários de atendimento.",
      "Após receberem as sugestões das famílias, os gestores da escola divulgaram a ampliação já decidida por elas.",
    ],
    "O trecho informa que os gestores receberam as sugestões e decidiram. A reescrita correta mantém esses papéis; as demais transferem a decisão às famílias.",
    "Os gestores ouviram as famílias. Eles decidiram ampliar o atendimento da escola.",
  ),
  question(
    "m12",
    "conclusao",
    "Qual proposta enfrenta a causa discutida, e não apenas um efeito do problema?",
    [
      "Capacitar responsáveis pelas compras para estimar a demanda, usando registros de vendas e acompanhamento das sobras nos estabelecimentos.",
      "Divulgar campanhas sobre consumo responsável para clientes, usando cartazes informativos e mensagens sobre a importância dos alimentos nos estabelecimentos.",
      "Organizar palestras sobre alimentação saudável para clientes, usando materiais educativos e apresentações sobre os benefícios dos alimentos nos estabelecimentos.",
    ],
    "Se a causa analisada é o planejamento das compras, a proposta precisa agir sobre essa etapa. Campanhas para clientes podem ter valor, mas não corrigem diretamente o processo identificado.",
    "O parágrafo argumenta que compras acima da demanda elevam as perdas antes da comercialização.",
  ),
  question(
    "m13",
    "introducao",
    "Qual antecipação de argumentos é coerente com o problema apresentado?",
    [
      "Discutir a distribuição dos espaços culturais e analisar os custos envolvidos no deslocamento dos moradores.",
      "Discutir a formação dos diferentes estilos culturais e analisar as preferências artísticas dos moradores locais.",
      "Discutir a classificação das atividades culturais e analisar as características artísticas dos eventos realizados localmente.",
    ],
    "A introdução deve anunciar caminhos que ajudem a explicar o problema delimitado. Território e deslocamento se conectam ao acesso; estilos e classificações não enfrentam diretamente esse recorte.",
    "Moradores de bairros afastados encontram dificuldades para frequentar equipamentos culturais concentrados em regiões centrais.",
  ),
  question(
    "m14",
    "argumentacao",
    "Qual interpretação evita confundir uma possibilidade com uma garantia?",
    [
      "A oferta de atividades próximas pode reduzir uma barreira, embora outras condições também influenciem a participação dos moradores.",
      "A oferta de atividades próximas deve eliminar qualquer barreira, pois a distância representa a condição decisiva da participação dos moradores.",
      "A oferta de atividades próximas vai assegurar toda participação, porque a presença do equipamento determina o interesse dos moradores.",
    ],
    "Reduzir uma barreira não significa garantir o resultado. A interpretação correta admite que renda, horários, divulgação e outros fatores também possam influenciar a participação.",
  ),
  question(
    "m15",
    "repertorio",
    "Como tornar produtiva a referência a uma obra no desenvolvimento?",
    [
      "Selecionar um aspecto da obra, explicar seu significado e relacioná-lo ao mecanismo discutido no argumento do parágrafo.",
      "Apresentar o título da obra, resumir seu enredo e deixar sua relação com o argumento sugerida no parágrafo.",
      "Apresentar o autor da obra, destacar seu reconhecimento e tratar sua reputação como confirmação do argumento no parágrafo.",
    ],
    "O uso produtivo depende da análise: um aspecto da obra ajuda a compreender ou sustentar o argumento. Resumo e reputação, isoladamente, não estabelecem essa relação.",
  ),
  question(
    "m16",
    "coesao",
    "Qual reescrita preserva a relação de causa e consequência?",
    [
      "Como os horários são incompatíveis com as jornadas de trabalho, alguns moradores encontram dificuldades para utilizar o serviço.",
      "Embora os horários sejam incompatíveis com as jornadas de trabalho, essa incompatibilidade decorre das dificuldades para utilizar o serviço.",
      "Enquanto os horários são incompatíveis com as jornadas de trabalho, a utilização do serviço explica as jornadas dos moradores.",
    ],
    "A incompatibilidade dos horários é apresentada como causa da dificuldade de acesso. A reescrita correta mantém essa direção; as outras alteram ou confundem as relações entre os fatos.",
  ),
  question(
    "m17",
    "conclusao",
    "Qual finalidade permite observar se a ação respondeu ao problema discutido?",
    [
      "Reduzir as dificuldades dos moradores no uso da plataforma, acompanhando dúvidas frequentes e resultados dos atendimentos oferecidos.",
      "Ampliar a importância da plataforma para os moradores, destacando sua presença nos debates sobre serviços públicos digitais atuais.",
      "Aumentar a valorização da plataforma pelos moradores, reforçando sua relevância em discursos sobre serviços públicos digitais atuais.",
    ],
    "A finalidade se conecta à dificuldade concreta e sugere como acompanhá-la. Importância ou valorização, sem definição do que se pretende melhorar, torna a avaliação da ação menos clara.",
  ),
  question(
    "m18",
    "introducao",
    "Que ajuste melhora a delimitação da discussão?",
    [
      "Escolher uma barreira específica ao acesso à cultura e indicar como ela será analisada ao longo do texto.",
      "Acrescentar diferentes temas ligados à cultura e apresentar todos eles como questões igualmente centrais ao longo do texto.",
      "Manter o tema cultural sem qualquer recorte e substituir palavras repetidas por sinônimos variados ao longo do texto.",
    ],
    "Um recorte define o objeto da discussão e ajuda a organizar a defesa de uma posição. Acrescentar assuntos ou apenas trocar palavras não resolve a amplitude do enunciado.",
    "A cultura envolve história, arte, educação, economia e vários outros aspectos importantes da vida social.",
  ),
  question(
    "m19",
    "argumentacao",
    "Qual resposta considera a objeção sem abandonar a tese?",
    [
      "Reconhecer a utilidade dos aplicativos e defender apoio presencial para usuários que ainda não conseguem utilizá-los com autonomia.",
      "Reconhecer a utilidade dos aplicativos e retirar a discussão sobre usuários que ainda não conseguem utilizá-los com autonomia.",
      "Reconhecer a utilidade dos aplicativos e considerar resolvida a dificuldade dos usuários que ainda não conseguem utilizá-los com autonomia.",
    ],
    "É possível reconhecer uma vantagem e manter a discussão sobre condições de acesso. A resposta correta integra a objeção ao raciocínio; as outras simplesmente excluem a dificuldade apontada.",
    "Tese: serviços digitais precisam de apoio presencial. Objeção: os aplicativos reduzem deslocamentos e facilitam vários atendimentos.",
  ),
  question(
    "m20",
    "tese",
    "Qual tese permite articular oferta de equipamentos e formação dos usuários?",
    [
      "A inclusão digital depende tanto da infraestrutura disponível quanto da formação necessária para utilizar os recursos com autonomia.",
      "A inclusão digital depende principalmente da quantidade de aparelhos, enquanto a formação pode ser substituída pela disponibilidade dos recursos.",
      "A inclusão digital depende apenas da formação pessoal, enquanto a infraestrutura disponível representa uma consequência natural dessa autonomia adquirida.",
    ],
    "A tese correta articula duas condições complementares. As demais subordinam ou eliminam uma delas, sem explicar como o acesso funcionaria na ausência dessa condição.",
  ),
];

const hard = [
  question(
    "d01",
    "introducao",
    "Qual formulação preserva a tensão do trecho sem reduzir o problema a uma oposição simplista?",
    [
      "A digitalização amplia possibilidades de atendimento, mas sua abrangência depende de condições materiais e de orientação acessível aos usuários menos familiarizados.",
      "A digitalização amplia possibilidades de atendimento, logo seu alcance torna dispensáveis as condições materiais e o apoio anteriormente oferecido aos usuários.",
      "A digitalização amplia possibilidades de atendimento, portanto seus limites demonstram que plataformas digitais devem ser substituídas por serviços exclusivamente presenciais.",
    ],
    "A formulação correta reconhece uma vantagem e examina condições para que ela alcance públicos diferentes. As demais transformam a discussão em suficiência automática ou rejeição integral da tecnologia.",
    "Serviços digitais reduzem alguns deslocamentos, mas usuários sem conexão ou familiaridade com as plataformas ainda precisam de apoio.",
  ),
  question(
    "d02",
    "tese",
    "Qual tese respeita o alcance das evidências apresentadas?",
    [
      "Os resultados sugerem que ampliar horários pode favorecer o acesso, mas não permitem concluir que essa intervenção explique todas as diferenças observadas.",
      "Os resultados demonstram que ampliar horários garante o acesso, permitindo concluir que a medida elimina as diferenças entre todos os bairros observados.",
      "Os resultados comprovam que ampliar horários determina o acesso, permitindo concluir que outras condições não explicam diferenças entre os bairros observados.",
    ],
    "Os dados são compatíveis com um efeito da ampliação, mas não isolam esse fator. A tese deve distinguir uma indicação plausível de uma demonstração causal abrangente.",
    "Após ampliar o horário de uma biblioteca, o público cresceu. No mesmo período, houve uma campanha de divulgação e mudança no transporte local.",
  ),
  question(
    "d03",
    "argumentacao",
    "Qual conclusão evita extrapolar o dado disponível?",
    [
      "A oferta reduzida aparece como uma possível barreira no grupo entrevistado, mas o conjunto de entrevistas não representa necessariamente todos os moradores da cidade.",
      "A oferta reduzida aparece como a principal barreira municipal, pois os entrevistados permitem identificar necessariamente as dificuldades de todos os moradores da cidade.",
      "A oferta reduzida aparece como uma barreira já resolvida, pois os entrevistados permitem descartar necessariamente outras dificuldades dos moradores da cidade.",
    ],
    "Um levantamento com participantes de um evento pode trazer informações sobre esse grupo. Sem uma amostragem adequada, não é possível generalizar a frequência do problema para toda a população.",
    "Em entrevistas com frequentadores de um único evento, parte do público relatou dificuldade para encontrar transporte à noite.",
  ),
  question(
    "d04",
    "repertorio",
    "Qual uso da referência distingue uma norma de uma descrição da realidade?",
    [
      "Utilizar o direito previsto como parâmetro crítico de análise, investigando as barreiras concretas que dificultam sua plena realização nas situações discutidas pelo texto.",
      "Utilizar o direito previsto como confirmação de acesso, considerando que a existência da norma demonstra sua realização nas situações discutidas pelo texto.",
      "Utilizar o direito previsto como substituto da análise, considerando que a menção da norma explica sua realização nas situações discutidas pelo texto.",
    ],
    "A previsão de um direito permite avaliar a distância entre o que deve ser garantido e o que ocorre. Ela não comprova, sozinha, que o acesso já exista em todas as situações.",
    "O texto cita a previsão de acesso à cultura como um direito e discute a concentração dos equipamentos culturais.",
  ),
  question(
    "d05",
    "coesao",
    "A expressão ‘esse resultado’ retoma com mais precisão qual ideia?",
    [
      "O aumento da participação observado após as mudanças, sem afirmar que uma delas tenha sido sua causa exclusiva, necessária ou suficiente.",
      "A ampliação dos horários considerada isoladamente, afirmando que ela tenha produzido o aumento como sua causa exclusiva ou suficiente no período.",
      "A divulgação dos novos horários considerada isoladamente, afirmando que ela tenha produzido o aumento como sua causa exclusiva ou suficiente no período.",
    ],
    "O demonstrativo retoma o aumento da participação. A sequência do texto ressalva sua interpretação causal; atribuí-lo exclusivamente a uma das ações contraria essa ressalva.",
    "A biblioteca ampliou os horários e divulgou a nova programação. A participação aumentou. Esse resultado, contudo, precisa ser analisado junto a outras mudanças do período.",
  ),
  question(
    "d06",
    "conclusao",
    "Qual detalhamento permite avaliar a ação sem confundir oferta com resultado?",
    [
      "Registrar a realização das oficinas e acompanhar se participantes passaram a resolver dificuldades específicas, considerando também os relatos detalhados de quem abandonou o atendimento oferecido.",
      "Registrar a realização das oficinas e considerar que todos os participantes superaram dificuldades específicas, utilizando apenas o número de vagas inicialmente oferecidas pelo atendimento.",
      "Registrar a realização das oficinas e concluir que moradores superaram dificuldades específicas, utilizando apenas o número de anúncios publicados para divulgação inicial do atendimento.",
    ],
    "Vagas, anúncios e oficinas realizadas medem etapas da oferta. Para avaliar resultados, é preciso observar o que mudou para os usuários e considerar também quem não conseguiu permanecer na ação.",
    "A proposta oferece oficinas para apoiar moradores no uso de serviços digitais.",
  ),
  question(
    "d07",
    "introducao",
    "Qual recorte permite desenvolver o problema sem atribuir às pessoas toda a responsabilidade por ele?",
    [
      "Analisar como a familiaridade dos usuários interage com a organização dos serviços digitais e com as condições disponíveis para obter orientação adequada e acessível.",
      "Analisar como a familiaridade dos usuários determina o acesso às plataformas e torna secundárias as condições disponíveis para obter orientação adequada.",
      "Analisar como a familiaridade dos usuários resolve o acesso às plataformas e torna dispensáveis as condições disponíveis para obter orientação adequada.",
    ],
    "O recorte adequado permite examinar condições individuais e institucionais em conjunto. As demais alternativas atribuem à familiaridade um papel suficiente sem considerar desenho do serviço, recursos e suporte.",
    "Parte dos usuários tem dificuldades para concluir solicitações em uma plataforma pública.",
  ),
  question(
    "d08",
    "tese",
    "Qual tese incorpora a objeção sem abandonar a posição inicial?",
    [
      "A programação central pode atender parte do público, mas sua existência não dispensa estratégias que reduzam barreiras territoriais de deslocamento e participação.",
      "A programação central pode atender parte do público, portanto sua existência já assegura condições equivalentes de deslocamento e participação para toda população.",
      "A programação central pode atender parte do público, logo sua existência elimina a pertinência de analisar diferenças de deslocamento e participação entre bairros.",
    ],
    "Reconhecer o atendimento de um público não implica que todos tenham condições equivalentes. A tese mantém a necessidade de enfrentar barreiras sem negar a utilidade da programação central.",
    "Posição inicial: é preciso distribuir melhor as atividades culturais. Objeção: os espaços centrais já oferecem uma programação frequente.",
  ),
  question(
    "d09",
    "argumentacao",
    "Qual interpretação distingue associação de demonstração causal?",
    [
      "Os fatores variam juntos no levantamento, mas outras condições institucionais precisam ser consideradas antes de atribuir a um deles a produção direta do resultado.",
      "Os fatores variam juntos no levantamento, portanto a ordem em que foram mencionados permite atribuir ao primeiro a produção exclusiva do resultado.",
      "Os fatores variam juntos no levantamento, portanto a presença simultânea permite atribuir ao primeiro a produção necessária de qualquer mudança observada no resultado.",
    ],
    "Duas características associadas não bastam para identificar uma causa. É necessário examinar o desenho do levantamento, outros fatores e o mecanismo que poderia explicar a relação.",
    "Um levantamento observou maior participação cultural em bairros que também apresentam melhor oferta de transporte.",
  ),
  question(
    "d10",
    "repertorio",
    "Qual relação usa o exemplo para qualificar, em vez de universalizar, o argumento?",
    [
      "A experiência evidencia uma possibilidade concreta de organização, cuja aplicação em outros contextos exige considerar cuidadosamente recursos, públicos e condições de funcionamento das instituições envolvidas.",
      "A experiência mostra uma solução universal de organização, cuja aplicação em outros contextos permite dispensar diferenças entre recursos, públicos e funcionamento das instituições envolvidas.",
      "A experiência mostra uma comprovação definitiva de organização, cuja aplicação em outros contextos garante resultados semelhantes independentemente dos públicos e das instituições locais envolvidas.",
    ],
    "Uma experiência pode sustentar a possibilidade de uma estratégia, mas não garante sua reprodução em qualquer lugar. Reconhecer condições e limites torna o uso do exemplo mais rigoroso.",
    "Uma biblioteca comunitária conseguiu ampliar o empréstimo de livros após reorganizar horários e criar atividades com moradores.",
  ),
  question(
    "d11",
    "coesao",
    "Qual leitura preserva o alcance da condição expressa no período?",
    [
      "A expansão é apresentada como uma possibilidade de melhoria condicionada à compatibilidade dos horários, e não como uma garantia independente dessa condição.",
      "A expansão é apresentada como uma garantia de melhoria confirmada pela compatibilidade dos horários, tornando desnecessário considerar outras condições de acesso ao serviço.",
      "A expansão é apresentada como uma impossibilidade de melhoria apesar da compatibilidade dos horários, tornando irrelevante considerar as demais condições de acesso ao serviço.",
    ],
    "‘Desde que’ introduz uma condição para o efeito esperado. O período não garante o resultado nem afirma que a expansão será inútil: delimita uma possibilidade.",
    "A expansão dos pontos de atendimento pode melhorar o acesso, desde que os horários sejam compatíveis com as rotinas dos usuários.",
  ),
  question(
    "d12",
    "conclusao",
    "Qual proposta responde ao mecanismo discutido sem excluir os usuários que enfrentam a barreira?",
    [
      "Oferecer orientação acessível e canais alternativos de atendimento, acompanhando as dificuldades relatadas pelos usuários e ajustando procedimentos sem exigir domínio prévio das plataformas.",
      "Oferecer orientação apenas aos usuários já experientes, acompanhando a rapidez das solicitações concluídas e restringindo procedimentos para quem não demonstra domínio prévio das plataformas.",
      "Oferecer divulgação sobre os canais digitais disponíveis, acompanhando o número de acessos recebidos e encerrando procedimentos presenciais antes de verificar as dificuldades dos usuários.",
    ],
    "A ação precisa reduzir a barreira identificada. Exigir experiência ou extinguir alternativas antes de avaliar o acesso pode aprofundar justamente a exclusão que a proposta pretende enfrentar.",
    "O argumento identifica dificuldades de navegação e ausência de suporte como barreiras ao uso de serviços públicos digitais.",
  ),
  question(
    "d13",
    "introducao",
    "Qual projeto de texto evita anunciar um desenvolvimento diferente do recorte apresentado?",
    [
      "Examinar como o custo do deslocamento e a concentração territorial dos equipamentos interferem nas oportunidades efetivas de participação cultural dos moradores das regiões afastadas.",
      "Examinar como a variedade dos estilos e a trajetória artística dos participantes interferem nas características estéticas das produções apresentadas aos moradores das regiões afastadas.",
      "Examinar como a divulgação dos artistas e a classificação temática dos espetáculos interferem nas preferências pessoais dos participantes que frequentam apresentações nas regiões centrais.",
    ],
    "O recorte é a desigualdade nas condições de acesso. Custos e localização permitem desenvolvê-lo; características estéticas e trajetórias artísticas exigiriam outro projeto ou uma ligação adicional que o trecho não estabelece.",
    "O texto discutirá por que a existência de uma programação cultural frequente não garante acesso equivalente aos moradores de diferentes bairros.",
  ),
  question(
    "d14",
    "argumentacao",
    "Qual explicação enfrenta a aparente contradição sem concluir que a oferta seja inútil?",
    [
      "O aumento da oferta pode não alcançar certos públicos quando horários, custos ou divulgação continuam limitando suas condições de participação nas atividades disponíveis.",
      "O aumento da oferta deve alcançar todos os públicos porque horários, custos ou divulgação deixam de limitar suas condições quando atividades suficientes estão disponíveis.",
      "O aumento da oferta não beneficia nenhum público porque horários, custos ou divulgação demonstram que a existência das atividades disponíveis não possui importância social.",
    ],
    "Oferta e acesso não são equivalentes. É possível que novos eventos beneficiem parte do público e que outras barreiras continuem impedindo a participação de outros grupos.",
    "A cidade aumentou o número de eventos, mas alguns bairros continuam pouco representados entre os participantes.",
  ),
  question(
    "d15",
    "repertorio",
    "Qual relação entre o conceito e o exemplo constitui uma análise, e não uma simples menção?",
    [
      "Explicar como a distância física entre moradia e equipamentos distribui oportunidades concretas de participação de maneira desigual, aproximando o conceito das condições observadas no território.",
      "Apresentar a expressão desigualdade territorial como uma referência reconhecida, mencionando a distância entre moradia e equipamentos sem explicar sua influência nas condições de participação.",
      "Repetir a expressão desigualdade territorial como uma conclusão suficiente, mencionando diferentes equipamentos e bairros sem examinar sua distribuição ou as condições de participação dos moradores.",
    ],
    "O conceito contribui quando ajuda a interpretar um processo concreto. Nomeá-lo ou repeti-lo, sem explicar como aparece no exemplo, não produz a mesma análise.",
    "O autor emprega o conceito de desigualdade territorial para discutir o acesso a bibliotecas e teatros.",
  ),
  question(
    "d16",
    "coesao",
    "Qual reescrita mantém a ressalva sem inverter a relação entre as ideias?",
    [
      "Embora a digitalização reduza determinados deslocamentos, sua implementação ainda exige considerar usuários que precisam de atendimento presencial e de orientação especializada para acessar os serviços.",
      "Como a medida reduz parte dos deslocamentos, sua implementação demonstra que usuários dispensam atendimento presencial e orientação para acessar os serviços antes oferecidos exclusivamente nos bairros.",
      "Como os usuários já dispensam atendimento presencial, a redução dos deslocamentos torna a implementação da medida independente da oferta de orientação para acessar os serviços.",
    ],
    "O trecho admite uma vantagem e ressalta um cuidado que permanece necessário. A concessão introduzida por ‘embora’ preserva essa tensão; as demais reescritas alteram a lógica do período.",
    "A digitalização reduz alguns deslocamentos; isso não elimina a necessidade de apoio a usuários com dificuldades de acesso.",
  ),
  question(
    "d17",
    "conclusao",
    "Qual acompanhamento permite revisar a proposta com base em resultados e limites?",
    [
      "Comparar dificuldades relatadas antes e depois do atendimento, ouvir diferentes perfis de usuários e ajustar horários ou materiais conforme as barreiras que permanecerem nas avaliações.",
      "Comparar somente a quantidade de materiais distribuídos, ouvir apenas os usuários que concluíram o atendimento e considerar os resultados suficientes para confirmar a eficácia da proposta.",
      "Comparar somente a quantidade de anúncios divulgados, ouvir apenas os responsáveis pelo atendimento e considerar esses registros suficientes para confirmar mudanças nas dificuldades dos usuários atendidos.",
    ],
    "Acompanhamento precisa observar mudanças relacionadas ao problema, incluir perfis diversos e permitir ajustes. Contar materiais ou anúncios mede atividade, mas não demonstra sozinho que a dificuldade foi reduzida.",
  ),
  question(
    "d18",
    "introducao",
    "Qual delimitação evita tratar diferenças entre públicos como se fossem uma única experiência?",
    [
      "Investigar barreiras de acesso considerando renda, localização e familiaridade com o serviço, sem pressupor que esses fatores produzam experiências iguais para todos os usuários.",
      "Investigar barreiras de acesso considerando o usuário médio do serviço, pressupondo que sua experiência representa adequadamente os efeitos da renda e da localização para todos.",
      "Investigar barreiras de acesso considerando apenas quem concluiu solicitações, pressupondo que suas experiências representam as condições enfrentadas pelos demais públicos atendidos pelo serviço.",
    ],
    "Delimitar um problema também envolve reconhecer variações dentro do público. Um perfil médio ou uma amostra apenas de quem conseguiu atendimento pode ocultar barreiras relevantes para outros usuários.",
  ),
  question(
    "d19",
    "argumentacao",
    "Qual continuação responde à objeção mantendo a complexidade da discussão?",
    [
      "A escolha individual pode influenciar a frequência, mas avaliar esse fator exige considerar se horários, custos e localização permitem transformar o interesse numa possibilidade concreta de participação.",
      "A escolha individual pode influenciar a frequência, portanto avaliar esse fator torna desnecessário investigar se horários, custos e localização interferem nas condições concretas de participação.",
      "A escolha individual pode influenciar a frequência, logo avaliar esse fator demonstra que horários, custos e localização determinam igualmente a decisão de todos os moradores envolvidos.",
    ],
    "A resposta não precisa negar escolhas individuais, mas deve situá-las em condições reais. Isso evita tanto responsabilizar apenas o indivíduo quanto tratar todas as pessoas como igualmente determinadas pelas mesmas barreiras.",
    "Objeção: mesmo com atividades gratuitas, algumas pessoas preferem não participar; por isso, a baixa frequência seria apenas uma escolha individual.",
  ),
  question(
    "d20",
    "tese",
    "Qual reformulação preserva uma posição defendível sem prometer um resultado absoluto?",
    [
      "A redistribuição de equipamentos pode ampliar oportunidades efetivas de acesso, desde que se articule a condições de transporte, funcionamento e participação adequadas às necessidades específicas dos diferentes públicos.",
      "A redistribuição de equipamentos vai assegurar igualdade de acesso, pois a proximidade territorial substitui condições de transporte, funcionamento e participação anteriormente necessárias aos diferentes públicos da cidade.",
      "A redistribuição de equipamentos deve resolver integralmente o acesso, porque a presença física garante condições de transporte, funcionamento e participação equivalentes para todos os públicos da cidade.",
    ],
    "A tese correta reconhece uma contribuição e explicita condições. Uma medida pode ampliar oportunidades sem, isoladamente, garantir igualdade completa ou substituir todos os outros fatores envolvidos.",
  ),
];

const levels = [
  {
    id: "facil",
    title: "Fácil",
    tag: "Fundamentos",
    description: "Reconheça as partes do texto e fortaleça sua base.",
    questions: easy,
  },
  {
    id: "medio",
    title: "Médio",
    tag: "Aplicação",
    description: "Relacione ideias e encontre a melhor construção.",
    questions: medium,
  },
  {
    id: "dificil",
    title: "Difícil",
    tag: "Análise",
    description: "Examine nuances, limites e relações entre argumentos.",
    questions: hard,
  },
];

module.exports = { levels };
