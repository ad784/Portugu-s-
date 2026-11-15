// Aceita o .env da raiz ou da pasta backend, sem depender da pasta de execução.
// Variáveis do processo têm prioridade; o .env da raiz prevalece sobre backend/.env.
const dotenv = require("dotenv");
const envPaths = [
  require("path").join(__dirname, "../../../.env"),
  require("path").join(__dirname, "../../.env"),
];
for (const envPath of envPaths) {
  const envFile = dotenv.config({ path: envPath, quiet: true });
  for (const [key, value] of Object.entries(envFile.parsed || {})) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

// O frontend ja utiliza estas credenciais publicas. Usamos os mesmos valores
// como padrao no servidor para que a autenticacao funcione tanto localmente
// quanto na Vercel, mesmo se essas variaveis publicas nao forem cadastradas.
// Valores definidos no ambiente sempre tem prioridade.
process.env.CONTACT_EMAIL ||= "portuguesmais02@gmail.com";
process.env.SUPABASE_URL ||= "https://lzapufofepqbvqgzsqwg.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ||=
  "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";
process.env.SUPABASE_JWKS_URL ||= `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`;
