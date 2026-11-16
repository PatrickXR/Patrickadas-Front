import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { queryClient } from './query-client';
import { authClient, persistAuthSession } from './supabase-session';
import { useUiStore } from './ui-store';

export type Role = 'colaborador' | 'operacoes';
type Session = { token: string; role: Role; refreshToken?: string; email?: string };
type SessionContextValue = {
  session: Session | null;
  signIn: (session: Session) => Promise<void>;
  signOut: () => void;
};

export function isRole(value: unknown): value is Role {
  return value === 'colaborador' || value === 'operacoes';
}

function readSession(): Session | null {
  try {
    const token = localStorage.getItem('t');
    const role = localStorage.getItem('role');
    return token?.trim() && isRole(role) ? { token, role } : null;
  } catch {
    return null;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Local state controls navigation; the API remains responsible for authorization.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  function signOut() {
    void authClient?.auth.signOut({ scope: 'local' });
    queryClient.clear();
    useUiStore.getState().dismiss();
    setSession(null);
    localStorage.removeItem('t');
    localStorage.removeItem('role');
    localStorage.removeItem('refresh');
    localStorage.removeItem('session-id');
  }

  async function signIn(next: Session) {
    const persisted = await persistAuthSession(next.token, next.refreshToken);
    next = { ...next, token: persisted.access_token, refreshToken: persisted.refresh_token, email: persisted.user.email };
    queryClient.clear();
    useUiStore.getState().dismiss();
    localStorage.setItem('session-id', crypto.randomUUID());
    localStorage.setItem('t', next.token);
    localStorage.setItem('role', next.role);
    if (next.refreshToken) localStorage.setItem('refresh', next.refreshToken);
    else localStorage.removeItem('refresh');
    setSession(next);
  }

  useEffect(() => {
    let active = true;
    const refreshed = async () => {
      const token = localStorage.getItem('t');
      const result = await authClient?.auth.getSession();
      const current = readSession();
      if (!active || current?.token !== token) return;
      const restored = result?.data.session;
      setSession(current ? {
        ...current,
        email: restored?.access_token === current.token ? restored.user.email : undefined,
      } : null);
    };
    const listener = authClient?.auth.onAuthStateChange((event, next) => {
      if (event === 'TOKEN_REFRESHED' && next && localStorage.getItem('session-id')) {
        localStorage.setItem('t', next.access_token);
        localStorage.setItem('refresh', next.refresh_token);
        const current = readSession();
        setSession(current ? { ...current, email: next.user.email } : null);
      }
    });
    void refreshed();
    window.addEventListener('session-expired', signOut);
    window.addEventListener('session-refreshed', refreshed);
    return () => {
      active = false;
      window.removeEventListener('session-expired', signOut);
      window.removeEventListener('session-refreshed', refreshed);
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={{ session, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider ausente.');
  return context;
}
