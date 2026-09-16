import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

let currentSession: Session | null = null;
let currentUser: User | null = null;
let isInitialized = false;
const listeners = new Set<() => void>();

function notifyAuthListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error(e);
    }
  });
}

function updateGlobalAuth(session: Session | null) {
  currentSession = session;
  currentUser = session?.user ?? null;
  isInitialized = true;
  if (session?.user?.email) {
    try {
      localStorage.setItem('testownik_user_email', session.user.email);
    } catch {
      // ignore
    }
  }
  notifyAuthListeners();
}

// Global listener for auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  updateGlobalAuth(session);
});

// Initial session check at module load
supabase.auth.getSession().then(async ({ data: { session } }) => {
  updateGlobalAuth(session);
  if (session?.user && !session.user.email) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        currentUser = data.user;
        try {
          localStorage.setItem('testownik_user_email', data.user.email);
        } catch {
          // ignore
        }
        notifyAuthListeners();
      }
    } catch {
      // ignore
    }
  }
});

export function useAuth() {
  const [session, setSession] = useState<Session | null>(currentSession);
  const [user, setUser] = useState<User | null>(currentUser);
  const [loading, setLoading] = useState(!isInitialized);

  useEffect(() => {
    const handleAuthChange = () => {
      setSession(currentSession);
      setUser(currentUser);
      setLoading(!isInitialized);
    };

    listeners.add(handleAuthChange);

    // If state changed between initial render and mount, sync immediately
    if (session !== currentSession || user !== currentUser || loading !== !isInitialized) {
      handleAuthChange();
    }

    return () => {
      listeners.delete(handleAuthChange);
    };
  }, [session, user, loading]);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    try {
      localStorage.setItem('testownik_user_email', email);
    } catch {
      // ignore
    }
    return data;
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('testownik_user_email');
    } catch {
      // ignore
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInAnonymously = async () => {
    try {
      localStorage.removeItem('testownik_user_email');
    } catch {
      // ignore
    }
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  };

  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user');
    if (error) throw error;
    await signOut();
  };

  return {
    session,
    user,
    loading,
    sendOtp,
    verifyOtp,
    signInAnonymously,
    signOut,
    deleteAccount,
  };
}
