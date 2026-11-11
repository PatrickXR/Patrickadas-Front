const renewals = new Map<string, Promise<boolean>>();

async function renew(base: string, refreshToken: string): Promise<boolean> {
  const existing = renewals.get(refreshToken);
  if (existing) return existing;
  const pending = (async () => {
    const response = await fetch(base + '/v1/auth/refresh', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
    if (localStorage.getItem('refresh') !== refreshToken) return false;
    if (response.status === 401 || response.status === 403) return false;
    if (!response.ok) throw new Error('Não foi possível renovar a sessão. Tente novamente.');
    const session = await response.json();
    if (localStorage.getItem('refresh') !== refreshToken) return false;
    if (typeof session.token !== 'string' || !session.token || typeof session.refreshToken !== 'string'
      || !session.refreshToken || !['colaborador', 'operacoes'].includes(session.role)) return false;
    localStorage.setItem('t', session.token);
    localStorage.setItem('refresh', session.refreshToken);
    localStorage.setItem('role', session.role);
    window.dispatchEvent(new Event('session-refreshed'));
    return true;
  })();
  renewals.set(refreshToken, pending);
  try { return await pending; } finally { renewals.delete(refreshToken); }
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/v1').replace(/\/v1\/?$/, '');
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('t');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const refreshToken = localStorage.getItem('refresh');
  const sessionId = localStorage.getItem('session-id');
  let response = await fetch(base + url, { ...options, headers });
  if (response.status === 401 && localStorage.getItem('session-id') !== sessionId) {
    throw new Error('Sessão alterada. Tente novamente.');
  }
  if (response.status === 401 && token && localStorage.getItem('t') === token && refreshToken) {
    const renewed = await renew(base, refreshToken);
    if (!renewed) {
      if (localStorage.getItem('refresh') === refreshToken) window.dispatchEvent(new Event('session-expired'));
      throw new Error('Sessão expirada. Entre novamente.');
    }
  }
  if (response.status === 401 && token && localStorage.getItem('t') !== token) {
    if (localStorage.getItem('session-id') !== sessionId) throw new Error('Sessão alterada. Tente novamente.');
    const currentToken = localStorage.getItem('t');
    if (!currentToken) throw new Error('Sessão encerrada.');
    // Never replay a previous account's mutation after a new sign-in.
    headers.set('Authorization', `Bearer ${currentToken}`);
    response = await fetch(base + url, { ...options, headers });
  }
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && localStorage.getItem('t') === headers.get('Authorization')?.slice(7)) {
    window.dispatchEvent(new Event('session-expired'));
  }
  if (!response.ok) throw new Error(body.detail ?? body.title ?? 'Não foi possível concluir a operação.');
  return body as T;
}
