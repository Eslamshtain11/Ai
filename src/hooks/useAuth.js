import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';

const AuthContext = createContext({ session: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        console.error('فشل في استرجاع الجلسة الحالية:', error);
        setSession(null);
      } else {
        setSession(data?.session ?? null);
      }
      setLoading(false);
    };

    initSession();
    const { data: listener } = supabase?.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    }) ?? { data: null };

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
