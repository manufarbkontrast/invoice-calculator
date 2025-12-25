import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

type AuthState = {
  user: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });
  
  const initialized = useRef(false);

  // Initialize auth state only once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState(prev => ({ ...prev, loading: false, error }));
        return;
      }
      
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
        isAuthenticated: !!session?.user,
      });
    });

    // Listen for auth changes - only update on actual auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only update on actual auth events, completely ignore token refresh and password recovery
        const relevantEvents = ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'];
        if (!relevantEvents.includes(event)) {
          return; // Ignore all other events including TOKEN_REFRESHED
        }
        
        setState(prev => {
          // Only update if the user ID actually changed to prevent unnecessary re-renders
          const newUserId = session?.user?.id ?? null;
          const oldUserId = prev.user?.id ?? null;
          
          // Skip update if user hasn't changed (except on sign out)
          if (newUserId === oldUserId && event !== 'SIGNED_OUT') {
            return prev;
          }
          
          // Skip update if state is already correct
          if (
            prev.user?.id === newUserId &&
            prev.isAuthenticated === !!session?.user &&
            event !== 'SIGNED_OUT'
          ) {
            return prev;
          }
          
          return {
            user: session?.user ?? null,
            session,
            loading: false,
            error: null,
            isAuthenticated: !!session?.user,
          };
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      setState({
        user: data.user,
        session: data.session,
        loading: false,
        error: null,
        isAuthenticated: !!data.user,
      });
      
      return data;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      }));
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });
      
      if (error) throw error;
      
      // Don't auto-login after signup, let user confirm email first
      setState(prev => ({ ...prev, loading: false }));
      
      return data;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error : new Error(String(error)) 
      }));
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      setState(prev => ({ ...prev, error }));
      return;
    }
    setState(prev => ({
      ...prev,
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session?.user,
    }));
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    logout,
    refresh,
  };
}
