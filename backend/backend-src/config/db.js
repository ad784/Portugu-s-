const { createClient } = require("@supabase/supabase-js");
function createServerClient(accessToken) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        ...(accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : {}),
        fetch: async (url, options = {}) => {
          const { createAuthFetch } = await import("../utils/auth-fetch.mjs");
          return createAuthFetch()(url, {
            ...options,
            signal: options.signal || AbortSignal.timeout(10000),
          });
        },
      },
    },
  );
}

module.exports = { createServerClient };
