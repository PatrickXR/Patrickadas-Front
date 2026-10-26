import { test, expect, type Page } from '@playwright/test';

type Role = 'colaborador' | 'operacoes';

test.beforeEach(async ({ page }) => {
  // The suite is self-contained: no requests reach external services or databases.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && url.port === '4173') await route.continue();
    else await route.abort();
  });
});

async function mockLogin(page: Page, body: unknown, status = 200) {
  await page.route('**/auth/login', (route) => route.fulfill({ status, json: body }));
}

async function login(page: Page, role: Role) {
  await mockLogin(page, { token: 'local-test-token', role, userId: 'local-test-user' });
  await page.goto('/');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.invalid');
  await page.getByLabel('Senha', { exact: true }).fill('local-test-password');
  await page.getByRole('button', { name: role === 'operacoes' ? 'Entrar como Operações' : 'Entrar', exact: role !== 'operacoes' }).click();
  await expect(page).toHaveURL('/home');
}

for (const role of ['colaborador', 'operacoes'] as const) {
  test(`test_ca_01_ca_02_login_${role}_abre_home_com_papel_real`, async ({ page }) => {
    await login(page, role);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Boas-vindas ao EMPREST.AI');
    await expect(page.getByRole('link', { name: 'EMPREST.AI — Início' })).toBeVisible();
    await expect(page.locator('.role-tag')).toHaveText(role === 'operacoes' ? 'Operações' : 'Colaborador');
    await expect(page.getByText('Os equipamentos de que você precisa. Os empréstimos sob controle.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(role === 'operacoes' ? 4 : 2);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/');
    await expect(page).toHaveURL('/home');
  });
}

test('test_ca_03_colaborador_tem_apenas_dois_atalhos', async ({ page }) => {
  await login(page, 'colaborador');
  await expect(page.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
  await expect(page.getByRole('link', { name: 'Ver meus empréstimos' })).toHaveAttribute('href', '/meus-emprestimos');
  await expect(page.getByRole('link', { name: 'Ir para Operações' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver equipamentos' })).toHaveCount(0);
  for (const path of ['/operacoes', '/equipamentos']) {
    await page.goto(path);
    await expect(page).toHaveURL('/home');
  }
});

test('test_ca_04_operacoes_tem_quatro_atalhos', async ({ page }) => {
  await login(page, 'operacoes');
  await expect(page.getByRole('link', { name: 'Ver catálogo' })).toHaveAttribute('href', '/catalogo');
  await expect(page.getByRole('link', { name: 'Ver meus empréstimos' })).toHaveAttribute('href', '/meus-emprestimos');
  await expect(page.getByRole('link', { name: 'Ir para Operações' })).toHaveAttribute('href', '/operacoes');
  await expect(page.getByRole('link', { name: 'Ver equipamentos' })).toHaveAttribute('href', '/equipamentos');
});

for (const failure of [
  { name: 'credenciais_invalidas', body: { detail: 'E-mail ou senha incorretos.' }, status: 401 },
  { name: 'papel_incompativel', body: { detail: 'Este usuário não tem acesso por este botão.' }, status: 403 },
]) {
  test(`test_ca_01_${failure.name}_permanece_no_login`, async ({ page }) => {
    await mockLogin(page, failure.body, failure.status);
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(failure.body.detail);
    await expect(page).toHaveURL('/');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('t'))).toBeNull();
    await page.goto('/home');
    await expect(page).toHaveURL('/');
  });
}

for (const invalid of [
  { name: 'token_ausente', body: { role: 'colaborador' } },
  { name: 'token_vazio', body: { token: ' ', role: 'colaborador' } },
  { name: 'papel_desconhecido', body: { token: 'test', role: 'admin' } },
  { name: 'papel_divergente', body: { token: 'test', role: 'operacoes' } },
]) {
  test(`test_ca_05_${invalid.name}_nao_cria_sessao`, async ({ page }) => {
    await mockLogin(page, invalid.body);
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('Não foi possível validar sua sessão. Tente entrar novamente.');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('t'))).toBeNull();
    await page.goto('/home');
    await expect(page).toHaveURL('/');
  });
}

test('test_ca_05_acesso_sem_sessao_e_sessao_antiga_voltam_ao_login', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL('/');
  await page.evaluate(() => localStorage.setItem('t', 'old-token-without-role'));
  await page.goto('/home');
  await expect(page).toHaveURL('/');
});

test('test_ca_05_sair_limpa_sessao_e_impede_retorno', async ({ page }) => {
  await login(page, 'operacoes');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => [localStorage.getItem('t'), localStorage.getItem('role')])).toEqual([null, null]);
  await page.goBack();
  await expect(page).not.toHaveURL('/home');
  await page.goto('/home');
  await expect(page).toHaveURL('/');
});

test('test_ca_06_todos_destinos_mostram_em_breve_e_retornam_ao_inicio', async ({ page }) => {
  await login(page, 'operacoes');
  for (const [action, path] of [
    ['Ver catálogo', '/catalogo'],
    ['Ver meus empréstimos', '/meus-emprestimos'],
    ['Ir para Operações', '/operacoes'],
    ['Ver equipamentos', '/equipamentos'],
  ]) {
    await page.getByRole('link', { name: action }).click();
    await expect(page).toHaveURL(path);
    await expect(page.getByRole('heading', { name: 'Em breve', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Voltar ao Início', exact: true }).click();
    await expect(page).toHaveURL('/home');
  }
  await page.goto('/catalogo');
  await page.getByRole('navigation').getByRole('link', { name: 'Início', exact: true }).click();
  await expect(page).toHaveURL('/home');
});

test('test_ca_07_layout_responsivo_e_tokens_visuais', async ({ page }, testInfo) => {
  await login(page, 'operacoes');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Sair' })).toBeInViewport();
  const grid = page.locator('.shortcut-grid');
  expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(testInfo.project.name === 'mobile' ? 1 : 2);
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(22, 24, 38)');
  expect(await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)).toContain('Raleway');
  await expect(page.getByRole('link', { name: 'Ver equipamentos' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('home.png'), fullPage: true });
});

test('test_ca_07_teclado_acessa_atalhos_e_sair_com_foco_visivel', async ({ page }) => {
  await login(page, 'operacoes');
  await page.reload();
  const required = new Set(['Sair', 'Ver catálogo', 'Ver meus empréstimos', 'Ir para Operações', 'Ver equipamentos']);
  for (let index = 0; index < 12 && required.size > 0; index++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const text = (await focused.innerText()).replace('→', '').trim();
    if (required.has(text)) {
      await expect(focused).toHaveCSS('outline-style', 'solid');
      required.delete(text);
    }
  }
  expect([...required]).toEqual([]);
  await page.getByRole('link', { name: 'Ver catálogo' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/catalogo');
  await page.getByRole('button', { name: 'Sair' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/');
});
