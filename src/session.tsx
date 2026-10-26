import { createContext, useContext, useState, type ReactNode } from 'react';

export type Role = 'colaborador' | 'operacoes';
type Session = { token: string; role: Role };
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
    setSession(null);
    localStorage.removeItem('t');
    localStorage.removeItem('role');
  }

  function signIn(next: Session) {
    localStorage.setItem('t', next.token);
    localStorage.setItem('role', next.role);
    setSession(next);
  }

  return <SessionContext.Provider value={{ session, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('SessionProvider ausente.');
  return context;
}
