import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const storage = typeof window !== 'undefined' ? window.localStorage : undefined;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          storage
        }
      })
    : null;

export const getSupabaseClient = () => supabase;

export const isSupabaseConfigured = () => Boolean(supabase);
