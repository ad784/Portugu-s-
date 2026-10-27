import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lzapufofepqbvqgzsqwg.supabase.co";
const supabasePublishableKey = "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";

window.supabaseClient = createClient(supabaseUrl, supabasePublishableKey);
window.supabasePublishableKey = supabasePublishableKey;
