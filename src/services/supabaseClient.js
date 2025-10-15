import { createClient } from '@supabase/supabase-js';

let client = null;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true
    }
  });
}

export const getSupabaseClient = () => client;

export const isSupabaseConfigured = () => Boolean(client);
