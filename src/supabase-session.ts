import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const authClient = url && key ? createClient(url, key, { auth: {
  persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'patrickadas-auth',
} }) : null;

export class SessionInitializationError extends Error {}

export async function persistAuthSession(token: string, refreshToken?: string) {
  if (!authClient || !refreshToken) throw new SessionInitializationError('Não foi possível iniciar sua sessão. Tente novamente em instantes.');
  const { error, data } = await authClient.auth.setSession({ access_token: token, refresh_token: refreshToken });
  if (error || !data.session) throw new SessionInitializationError('Não foi possível validar sua sessão. Entre novamente.');
  return data.session;
}
