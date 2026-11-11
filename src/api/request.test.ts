import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { apiRequest } from './request';
vi.mock('../supabase-session', () => ({ persistAuthSession: vi.fn(async () => undefined) }));

const storage = new Map<string, string>();
const response = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });
let events: string[];
beforeEach(() => {
  storage.clear(); storage.set('t', 'expired'); storage.set('refresh', 'old-refresh'); storage.set('session-id', 'account-one');
  events = [];
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value) });
  vi.stubGlobal('window', { dispatchEvent: (event: Event) => { events.push(event.type); } });
});
afterEach(() => vi.unstubAllGlobals());

test('CA-009-02 concurrent expired requests share renewal and replay once', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    if (url.endsWith('/auth/refresh')) { await gate; return response(200, { token: 'renewed', refreshToken: 'new-refresh', role: 'colaborador' }); }
    return new Headers(init.headers).get('Authorization') === 'Bearer renewed' ? response(200, { ok: true }) : response(401);
  });
  vi.stubGlobal('fetch', fetch);
  const requests = [apiRequest('/v1/equipment'), apiRequest('/v1/loans/mine')];
  await vi.waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1));
  release();
  expect(await Promise.all(requests)).toEqual([{ ok: true }, { ok: true }]);
  expect(events).toEqual(['session-refreshed']);
  expect(storage.get('refresh')).toBe('new-refresh');
});

test('CA-009-02 rejected refresh expires session without replaying mutation', async () => {
  const fetch = vi.fn(async () => response(401)); vi.stubGlobal('fetch', fetch);
  await expect(apiRequest('/v1/loans', { method: 'POST' })).rejects.toThrow('Sessão expirada');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(events).toEqual(['session-expired']);
});

test('CA-009-02 sign-out during refresh cannot restore session', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.endsWith('/auth/refresh')) {
      storage.clear();
      return response(200, { token: 'renewed', refreshToken: 'new-refresh', role: 'colaborador' });
    }
    return response(401);
  }));
  await expect(apiRequest('/v1/loans', { method: 'POST' })).rejects.toThrow();
  expect(storage.size).toBe(0); expect(events).toEqual([]);
});

test('CA-009-02 account switch while a request is pending cannot replay its mutation', async () => {
  const fetch = vi.fn(async () => {
    storage.set('session-id', 'account-two'); storage.set('t', 'other-token'); storage.set('refresh', 'other-refresh');
    return response(401);
  });
  vi.stubGlobal('fetch', fetch);
  await expect(apiRequest('/v1/loans', { method: 'POST' })).rejects.toThrow('Sessão alterada');
  expect(fetch).toHaveBeenCalledTimes(1); expect(events).toEqual([]);
  expect(storage.get('t')).toBe('other-token');
});

test('CA-009-02 temporary refresh failure preserves session for retry', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => response(url.endsWith('/auth/refresh') ? 503 : 401)));
  await expect(apiRequest('/v1/equipment')).rejects.toThrow('Tente novamente');
  expect(storage.get('refresh')).toBe('old-refresh'); expect(events).toEqual([]);
});
