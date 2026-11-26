export const scriptsByPage = {
  discursivas: [() => import("./services/auth.js")],
  "historico-tecnico": [() => import("./services/auth.js")],
  questoes: [
    () => import("./services/auth.js"),
    () => import("./scripts/navigation.js"),
  ],
  "confirmar-email": [
    () => import("./services/auth.js"),
    () => import("./scripts/navigation.js"),
  ],
  contato: [() => import("./scripts/navigation.js")],
  index: [
    () => import("./services/auth.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  cadastro: [
    () => import("./services/auth.js"),
    () => import("./scripts/cadastro.js"),
    () => import("./scripts/navigation.js"),
  ],
  nova: [
    () => import("./services/auth.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  resultado: [
    () => import("./services/auth.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  foto: [
    () => import("./services/auth.js"),
    () => import("./scripts/foto.js"),
    () => import("./scripts/navigation.js"),
  ],
  exemplos: [() => import("./scripts/navigation.js")],
  historico: [
    () => import("./services/auth.js"),
    () => import("./scripts/historico.js"),
    () => import("./scripts/navigation.js"),
  ],
  evolucao: [
    () => import("./services/auth.js"),
    () => import("./scripts/evolucao.js"),
    () => import("./scripts/navigation.js"),
  ],
  perfil: [
    () => import("./services/auth.js"),
    () => import("./scripts/perfil.js"),
    () => import("./scripts/navigation.js"),
  ],
  recuperar: [
    () => import("./services/auth.js"),
    () => import("./scripts/recuperar.js"),
    () => import("./scripts/navigation.js"),
  ],
  privacidade: [() => import("./scripts/navigation.js")],
};
