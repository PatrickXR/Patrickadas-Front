import type { Page } from '@playwright/test';

export function fixtureToken(label: string) {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: '88000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600, label })}.${part('fixture-signature')}`;
}

export async function mockSdkAuth(page: Page) {
  await page.route('**/auth/v1/user', route => route.fulfill({ json: {
    id: '88000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated',
    email: 'fixture@example.invalid', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
  } }));
  await page.route('**/auth/v1/logout*', route => route.fulfill({ status: 204 }));
}
