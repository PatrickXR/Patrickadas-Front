import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { queryClient } from './query-client';

export type Role = 'colaborador' | 'operacoes';
type Session = { token: string; role: Role; refreshToken?: string };
type SessionContextValue = {
  session: Session | null;
  signIn: (session: Session) => void;
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
    queryClient.clear();
    setSession(null);
    localStorage.removeItem('t');
    localStorage.removeItem('role');
    localStorage.removeItem('refresh');
    localStorage.removeItem('session-id');
  }

  function signIn(next: Session) {
    queryClient.clear();
    localStorage.setItem('session-id', crypto.randomUUID());
    localStorage.setItem('t', next.token);
    localStorage.setItem('role', next.role);
    if (next.refreshToken) localStorage.setItem('refresh', next.refreshToken);
    else localStorage.removeItem('refresh');
    setSession(next);
  }

  useEffect(() => {
    const refreshed = () => setSession(readSession());
    window.addEventListener('session-expired', signOut);
    window.addEventListener('session-refreshed', refreshed);
    return () => {
      window.removeEventListener('session-expired', signOut);
      window.removeEventListener('session-refreshed', refreshed);
    };
  });

  return <SessionContext.Provider value={{ session, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider ausente.');
  return context;
}
