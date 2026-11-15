export const scriptsByPage = {
  "confirmar-email": [
    () => import("./services/supabase.js"),
    () => import("./scripts/navigation.js"),
  ],
  contato: [() => import("./scripts/navigation.js")],
  index: [
    () => import("./services/supabase.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  cadastro: [
    () => import("./services/supabase.js"),
    () => import("./scripts/cadastro.js"),
    () => import("./scripts/navigation.js"),
  ],
  nova: [
    () => import("./services/supabase.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  resultado: [
    () => import("./services/supabase.js"),
    () => import("./scripts/script.js"),
    () => import("./scripts/navigation.js"),
  ],
  foto: [
    () => import("./services/supabase.js"),
    () => import("./scripts/foto.js"),
    () => import("./scripts/navigation.js"),
  ],
  exemplos: [() => import("./scripts/navigation.js")],
  historico: [
    () => import("./services/supabase.js"),
    () => import("./scripts/historico.js"),
    () => import("./scripts/navigation.js"),
  ],
  evolucao: [
    () => import("./services/supabase.js"),
    () => import("./scripts/evolucao.js"),
    () => import("./scripts/navigation.js"),
  ],
  perfil: [
    () => import("./services/supabase.js"),
    () => import("./scripts/perfil.js"),
    () => import("./scripts/navigation.js"),
  ],
  recuperar: [
    () => import("./services/supabase.js"),
    () => import("./scripts/recuperar.js"),
    () => import("./scripts/navigation.js"),
  ],
  privacidade: [() => import("./scripts/navigation.js")],
};
