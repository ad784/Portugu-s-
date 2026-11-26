const { levels } = require("./question-bank");
const themes = [
  {
    id: "inclusao-digital",
    title: "Inclusão digital",
    prompt:
      "Como ampliar o acesso à internet e o uso consciente da tecnologia no Brasil?",
  },
  {
    id: "alimentos",
    title: "Desperdício de alimentos",
    prompt:
      "Quais medidas podem reduzir o desperdício de alimentos nas cidades brasileiras?",
  },
  {
    id: "cultura",
    title: "Acesso à cultura",
    prompt: "Como ampliar a participação da população em atividades culturais?",
  },
  {
    id: "mobilidade",
    title: "Mobilidade urbana",
    prompt:
      "Como tornar os deslocamentos urbanos mais acessíveis e sustentáveis?",
  },
];
const skills = [
  {
    id: "introducao",
    title: "Introdução",
    subtitle: "Apresente o problema e indique seu caminho.",
    competency: "C2 e C3",
    minimumWords: 35,
    task: "Escreva uma introdução de três ou quatro frases para o tema escolhido. Apresente o problema, delimite o contexto e indique os dois pontos que desenvolveria.",
    checks: [
      "Apresentei o tema de forma específica.",
      "Deixei clara minha posição sobre o problema.",
      "Anunciei pontos que podem ser desenvolvidos no texto.",
    ],
    tip: "Uma referência só ajuda quando você explica sua relação com o problema. Também é possível começar com uma contextualização própria.",
    example:
      "O acesso à cultura depende tanto da oferta de atividades quanto das condições de participação. Em bairros afastados dos centros, a distância e o custo do deslocamento podem limitar esse acesso. Nesse contexto, a concentração dos equipamentos culturais e as dificuldades de transporte precisam ser enfrentadas.",
  },
  {
    id: "tese",
    title: "Tese",
    subtitle: "Transforme um assunto em uma posição defendida.",
    competency: "C3",
    minimumWords: 15,
    task: "Escreva uma tese de uma ou duas frases. Defenda uma posição sobre o tema escolhido e indique uma razão ou um problema que sustente essa posição.",
    checks: [
      "Defendi uma posição, em vez de apenas citar o assunto.",
      "Minha tese responde ao recorte do tema.",
      "É possível desenvolver uma justificativa para essa posição.",
    ],
    tip: "Pergunte a si mesmo: alguém poderia pedir uma justificativa para essa afirmação? Se ela apenas apresenta o assunto, ainda falta uma posição.",
    example:
      "Ampliar a inclusão digital exige ir além da distribuição de equipamentos, pois a falta de conexão estável e de formação para o uso da internet também limita a participação dos cidadãos.",
  },
  {
    id: "argumentacao",
    title: "Argumentação",
    subtitle: "Ligue afirmação, explicação e consequência.",
    competency: "C3",
    minimumWords: 45,
    task: "Escreva um parágrafo de desenvolvimento. Apresente uma afirmação sobre o tema, explique como ou por que ela ocorre e mostre uma consequência ou um exemplo pertinente.",
    checks: [
      "Meu parágrafo tem uma ideia central identificável.",
      "Expliquei o mecanismo ou a razão da minha afirmação.",
      "Relacionei o exemplo ou a consequência à posição que defendo.",
    ],
    tip: "Após uma afirmação, pergunte ‘por quê?’ e ‘como isso acontece?’. A resposta é o que começa a desenvolver seu argumento.",
    example:
      "O custo do transporte pode afastar moradores de atividades culturais gratuitas. Mesmo quando a entrada não é cobrada, o deslocamento de uma família representa uma despesa que compete com outras necessidades. Assim, oferecer eventos sem considerar o acesso físico ao local pode manter parte do público excluída.",
  },
  {
    id: "repertorio",
    title: "Repertório",
    subtitle: "Use referências para sustentar uma ideia.",
    competency: "C2",
    minimumWords: 35,
    task: "Escolha uma referência que você conhece ou uma situação cotidiana pertinente ao tema. Escreva um pequeno parágrafo explicando a referência e sua relação com o argumento. Não invente dados ou citações.",
    checks: [
      "Escolhi uma referência que conheço e consigo explicar.",
      "Estabeleci uma relação específica entre a referência e o tema.",
      "Expliquei o que essa referência ajuda a demonstrar.",
    ],
    tip: "Você não precisa inventar uma estatística. Um conceito, uma obra, um fato conhecido ou uma situação bem explicada pode ajudar a construir seu raciocínio.",
    example:
      "Uma biblioteca comunitária pode aproximar os livros de moradores que vivem longe de equipamentos culturais. Essa iniciativa ajuda a perceber que o acesso à cultura também depende da distribuição dos espaços no território. Por isso, discutir apenas o interesse individual do público não explica todas as barreiras à participação.",
  },
  {
    id: "coesao",
    title: "Coesão",
    subtitle: "Mostre a relação entre as ideias.",
    competency: "C4",
    minimumWords: 35,
    task: "Escreva um parágrafo sobre o tema escolhido com pelo menos três frases. Relacione as ideias com conectivos adequados e retome um termo sem criar ambiguidade. Priorize o sentido, não a quantidade de conectivos.",
    checks: [
      "Os conectivos expressam a relação que eu queria construir.",
      "As retomadas deixam claro a que ou a quem me refiro.",
      "As frases formam um raciocínio contínuo, sem saltos de assunto.",
    ],
    tip: "‘Portanto’ indica conclusão; ‘porém’ costuma marcar oposição. Trocar um pelo outro pode mudar a relação entre duas ideias.",
    example:
      "A entrada de um evento pode ser gratuita. Porém, o custo do transporte ainda dificulta a participação de algumas famílias. Essa barreira mostra que ampliar o acesso exige considerar também as condições de deslocamento.",
  },
  {
    id: "conclusao",
    title: "Conclusão",
    subtitle: "Proponha uma ação ligada ao problema.",
    competency: "C5",
    minimumWords: 40,
    task: "Escreva uma proposta de intervenção para o tema escolhido. Identifique quem pode agir, a ação, como ela seria realizada e a finalidade. Acrescente um detalhe que esclareça a proposta e respeite os direitos humanos.",
    checks: [
      "Indiquei um agente e uma ação ligados ao problema.",
      "Expliquei como a ação seria feita e com qual finalidade.",
      "Acrescentei um detalhe e respeitei os direitos humanos.",
    ],
    tip: "Evite ‘todos devem se conscientizar’ como solução completa. Escolha um agente capaz de realizar uma ação e explique como ela enfrenta o problema discutido.",
    example:
      "As secretarias municipais de cultura podem ampliar a programação em bairros afastados, por meio de atividades itinerantes em escolas e praças, para reduzir a barreira da distância. A escolha dos locais deve considerar a oferta cultural já existente e as demandas apresentadas pelos moradores.",
  },
];

function publicCatalog() {
  return {
    version: 2,
    themes,
    skills,
    levels: levels.map(({ questions, ...level }) => ({
      ...level,
      questions: questions.map(
        ({ answer, explanation, ...question }) => question,
      ),
    })),
  };
}
module.exports = { skills, themes, levels, publicCatalog };
