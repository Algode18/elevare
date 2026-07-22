import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// token is optional: guest/public pages call this with no token so requests
// go through as anon (governed by RLS "public read" policies), while
// authenticated pages pass the Clerk-issued Supabase JWT as before.
const supabaseClient = async (supabaseAccessToken) => {
  const options = supabaseAccessToken
    ? { global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } } }
    : {};
  const supabase = createClient(supabaseUrl, supabaseKey, options);
  return supabase;
};

export default supabaseClient;