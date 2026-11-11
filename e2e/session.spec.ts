import { test, expect } from '@playwright/test';

test('CA-009-01 CA-009-02 token expirado renova no catálogo sem novo login', async ({ page }) => {
  let refreshCalls = 0;
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && url.port === '4173') await route.continue();
    else await route.abort();
  });
  await page.route('**/auth/login', route => route.fulfill({ json: {
    token: 'expired-fixture', refreshToken: 'refresh-fixture', role: 'colaborador', userId: 'local-test-user',
  } }));
  await page.route('**/auth/refresh', route => {
    refreshCalls++;
    expect(route.request().postDataJSON()).toEqual({ refreshToken: 'refresh-fixture' });
    return route.fulfill({ json: { token: 'renewed-fixture', refreshToken: 'rotated-fixture', role: 'colaborador', userId: 'local-test-user' } });
  });
  await page.route('**/v1/loans/mine', route => route.fulfill({ json: [] }));
  await page.route('**/v1/equipment*', route => route.fulfill(
    route.request().headers()['authorization'] === 'Bearer renewed-fixture'
      ? { json: { items: [], total: 0, available: 0, nextCursor: null } }
      : { status: 401, json: { title: 'Unauthorized' } },
  ));
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('fixture@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('fixture-local-only');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/home');
  await page.goto('/catalogo');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('t'))).toBe('renewed-fixture');
  await expect(page).toHaveURL('/catalogo');
  expect(refreshCalls).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('refresh'))).toBe('rotated-fixture');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('refresh'))).toBeNull();
});
