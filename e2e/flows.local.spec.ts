import { test, expect, type Page } from '@playwright/test';

test.skip(process.env.PATRICKADAS_REAL_E2E !== '1', 'Executado no Supabase descartável com a API local');
test.setTimeout(120000);

async function login(page: Page, operations: boolean) {
  await page.getByLabel('E-mail', { exact: true }).fill(operations ? 'ops@flows.local' : 'colaborador@flows.local');
  await page.getByLabel('Senha', { exact: true }).fill('fixture-local-only-2026');
  await page.getByRole('button', { name: operations ? 'Entrar como Operações →' : 'Entrar', exact: true }).click();
  await expect(page).toHaveURL('/home');
}

test('test_ca_01_ca_06_ca_09_ca_11_fluxo_real_cadastrar_solicitar_devolver_e_preservar_historico', async ({ page }, info) => {
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' && ['4173','3101','55321'].includes(url.port)) await route.continue();
    else await route.abort();
  });
  const name = `Monitor ${info.project.name} ${Date.now()}`;
  await page.goto('/');
  await login(page, true);
  await page.getByRole('link', { name: 'Equipamentos', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill(name);
  await page.getByLabel('Patrimônio', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Cadastrar equipamento', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Equipamento salvo');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, false);
  await page.getByRole('link', { name: 'Catálogo', exact: true }).click();
  await page.getByLabel('Buscar equipamento', { exact: true }).fill(name);
  const card = page.getByRole('article').filter({ hasText: name });
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Solicitar empréstimo' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Empréstimo confirmado');
  await page.getByRole('link', { name: 'Meus empréstimos', exact: true }).click();
  await page.getByRole('article').filter({ hasText: name }).getByRole('button', { name: 'Devolver', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar devolução', exact: true }).click();
  await expect(page.getByRole('article').filter({ hasText: name })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await login(page, true);
  await page.getByRole('link', { name: 'Equipamentos', exact: true }).click();
  const row = page.getByRole('article').filter({ hasText: name });
  await row.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('histórico');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByRole('combobox', { name: 'Situação', exact: true }).selectOption('manutencao');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(row).toContainText('Em manutenção');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
