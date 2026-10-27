export const scriptsByPage = {
  index: [() => import("../scripts/supabase.js"), () => import("../scripts/script.js"), () => import("../scripts/navigation.js")],
  cadastro: [() => import("../scripts/supabase.js"), () => import("../scripts/cadastro.js"), () => import("../scripts/navigation.js")],
  nova: [() => import("../scripts/supabase.js"), () => import("../scripts/script.js"), () => import("../scripts/navigation.js")],
  resultado: [() => import("../scripts/script.js"), () => import("../scripts/navigation.js")],
  foto: [() => import("../scripts/supabase.js"), () => import("../scripts/foto.js"), () => import("../scripts/navigation.js")],
  exemplos: [() => import("../scripts/navigation.js")],
  historico: [() => import("../scripts/supabase.js"), () => import("../scripts/historico.js"), () => import("../scripts/navigation.js")],
  evolucao: [() => import("../scripts/supabase.js"), () => import("../scripts/evolucao.js"), () => import("../scripts/navigation.js")],
  perfil: [() => import("../scripts/supabase.js"), () => import("../scripts/perfil.js"), () => import("../scripts/navigation.js")],
  recuperar: [() => import("../scripts/supabase.js"), () => import("../scripts/recuperar.js"), () => import("../scripts/navigation.js")],
  privacidade: [() => import("../scripts/navigation.js")]
};
