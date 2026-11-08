import { createClient } from "@supabase/supabase-js";
import { initializeSession } from "./session.js";
import { createAuthFetch, authErrorMessage } from './auth-errors.mjs';

const supabaseUrl = "https://lzapufofepqbvqgzsqwg.supabase.co";
const supabasePublishableKey = "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";

const recovering = /type=recovery/.test(window.location.hash);
export const ready = (async () => {
  let config;
  try {
    const response = await fetch('/api/config', { signal: AbortSignal.timeout(8000) });
    if (response.ok) config = await response.json();
  } catch { /* Os valores públicos padrão permitem iniciar o cliente se a API estiver indisponível. */ }
  window.authErrorMessage = authErrorMessage;
  window.legalVersions = config?.legal;
  window.emailRecoveryEnabled = config?.emailRecoveryEnabled === true;
  window.checkSignupConfiguration = async () => {
    const response = await fetch(`${config?.supabaseUrl || supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: config?.supabasePublishableKey || supabasePublishableKey }, signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Não foi possível verificar o cadastro agora. Tente novamente mais tarde.');
    const settings = await response.json();
    if (settings.disable_signup || settings.external?.email === false) throw new Error('Novos cadastros estão temporariamente indisponíveis.');
    if (settings.mailer_autoconfirm !== true) throw new Error('O cadastro sem confirmação por e-mail ainda não foi habilitado. Entre em contato com o suporte.');
  };
  window.supabaseClient = createClient(config?.supabaseUrl || supabaseUrl, config?.supabasePublishableKey || supabasePublishableKey, { global: { fetch: createAuthFetch() } });
  window.supabasePublishableKey = config?.supabasePublishableKey || supabasePublishableKey;
  await initializeSession(window.supabaseClient, recovering);
})();
