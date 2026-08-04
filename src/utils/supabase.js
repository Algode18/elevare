import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Single shared client for the whole app. `currentToken` is swapped in
// right before each request via supabaseClient(token) below, and the
// `accessToken` callback (supported for third-party auth like Clerk)
// hands whatever the latest token is to Supabase per-request — so we
// never need to call createClient() more than once.
let currentToken = null;

const supabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: async () => currentToken,
});

const supabaseClient = async (supabaseAccessToken) => {
  currentToken = supabaseAccessToken || null;
  return supabase;
};

export default supabaseClient;