import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://lzapufofepqbvqgzsqwg.supabase.co";
const supabasePublishableKey = "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";

window.supabaseClient = createClient(supabaseUrl, supabasePublishableKey);

window.sair = async (event) => {
  event?.preventDefault();
  await window.supabaseClient.auth.signOut();
  window.location.href = "index.html";
};
