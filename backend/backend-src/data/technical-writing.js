const base = [
  ["Atendimento ao enunciado", "Responde ao comando e aos itens solicitados."],
  [
    "Conteúdo e precisão",
    "Apresenta conceitos pertinentes e compatíveis com a referência disponível.",
  ],
  [
    "Análise e fundamentação",
    "Explica relações, justifica escolhas e desenvolve o raciocínio.",
  ],
  [
    "Organização e coesão",
    "Articula as ideias e organiza a resposta com clareza.",
  ],
  ["Linguagem", "Utiliza vocabulário adequado, clareza e escrita formal."],
];
const profiles = [
  {
    id: "concurso-redacao",
    label: "Concurso: redação argumentativa",
    mode: "concurso",
    taskType: "redacao",
    weights: [20, 25, 25, 15, 15],
  },
  {
    id: "concurso-questao",
    label: "Concurso: questão técnica",
    mode: "concurso",
    taskType: "questao",
    weights: [25, 35, 20, 10, 10],
  },
  {
    id: "enade-questao",
    label: "ENADE: resposta discursiva",
    mode: "enade",
    taskType: "questao",
    weights: [25, 30, 25, 10, 10],
  },
].map(({ weights, ...profile }) => ({
  ...profile,
  criteria: base.map(([label, description], index) => ({
    id: `c${index + 1}`,
    label,
    description,
    maxPoints: weights[index],
  })),
}));

const examples = [
  {
    id: "concurso-redacao",
    title: "Concurso: serviços públicos digitais",
    mode: "concurso",
    taskType: "redacao",
    area: "Área administrativa",
    prompt:
      "Redija um texto dissertativo-argumentativo sobre os desafios da ampliação dos serviços públicos digitais. Defenda um ponto de vista e desenvolva argumentos sobre acesso, qualidade do atendimento e necessidades de usuários com diferentes condições de uso. Evite apenas listar vantagens e desvantagens.",
    reference:
      "Roteiro de estudo criado para a plataforma, não oficial: discutir ao menos duas dimensões do problema, relacionar condições de acesso ao atendimento e justificar a posição defendida. Não há exigência de proposta de intervenção no formato ENEM. Avaliar a pertinência e o desenvolvimento dos argumentos, além da organização e da linguagem.",
  },
  {
    id: "concurso-questao",
    title: "Concurso: melhoria de processos",
    mode: "concurso",
    taskType: "questao",
    area: "Gestão pública",
    prompt:
      "Um setor de atendimento recebe reclamações sobre demora e retrabalho. Não há registros sistemáticos das etapas ou dos prazos. Em uma resposta técnica: a) explique a utilidade de mapear o processo; b) proponha dois indicadores para acompanhar o atendimento; c) justifique como os dados podem orientar uma melhoria.",
    reference:
      "Roteiro de estudo criado para a plataforma, não oficial: o mapeamento identifica etapas, responsáveis, entradas, saídas e possíveis gargalos. Indicadores pertinentes incluem tempo de atendimento, tempo de espera, taxa de retrabalho ou percentual de solicitações concluídas no prazo, com definição do que medem. A melhoria deve decorrer do diagnóstico e ser acompanhada por resultados, sem tratar a simples coleta de dados como solução suficiente.",
  },
  {
    id: "enade-geral",
    title: "ENADE: análise de uma situação social",
    mode: "enade",
    taskType: "questao",
    area: "Formação geral — prática interdisciplinar",
    prompt:
      "Uma prefeitura passou a oferecer solicitações de serviços por aplicativo, mas moradores relatam dificuldades de uso e acesso. Analise a situação: a) identifique duas barreiras que podem limitar a participação; b) explique como elas afetam o acesso ao serviço; c) proponha uma medida e justifique como ela responde a uma das barreiras. Relacione sua análise à situação apresentada.",
    reference:
      "Roteiro de estudo criado para a plataforma, não oficial: distinguir disponibilidade do aplicativo de acesso efetivo. Considerar barreiras como conexão, equipamento, acessibilidade da interface, familiaridade digital e disponibilidade de apoio. Explicar mecanismos e propor medida relacionada ao diagnóstico, reconhecendo limites. A resposta pode ser direta e organizada por itens; não exige a estrutura de redação ENEM.",
  },
  {
    id: "enade-especifico",
    title: "ENADE: estudo de caso em Administração",
    mode: "enade",
    taskType: "questao",
    area: "Administração",
    prompt:
      "Uma organização distribuiu tarefas sem definir responsáveis por cada etapa. O prazo médio de entrega aumentou e alguns pedidos retornam para correção. Como estudante de Administração: a) apresente uma hipótese de diagnóstico; b) proponha uma ação de gestão e explique como seria executada; c) indique um resultado que deveria ser acompanhado para avaliar a ação.",
    reference:
      "Roteiro de estudo criado para a plataforma, não oficial: relacionar indefinição de responsabilidades a falhas de coordenação ou retrabalho sem afirmar causalidade comprovada apenas pelo enunciado. Propor ação coerente, como definição de papéis, padronização ou revisão do fluxo, com execução explicada. Acompanhar indicadores pertinentes à hipótese e reconhecer que a ação precisa ser avaliada no contexto.",
  },
];

module.exports = {
  profiles,
  examples,
  officialEnadeUrl:
    "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enade/provas-e-gabaritos",
};
