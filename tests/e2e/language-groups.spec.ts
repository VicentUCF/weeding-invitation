import { test, expect } from '@playwright/test';
import { Client } from 'pg';

test('group language controls the invitation and follows later group changes', async ({ page }) => {
  test.skip(!process.env.WEDDING_E2E_EMAIL || !process.env.WEDDING_E2E_PASSWORD, 'Requires a disposable Supabase project and an authorized Auth user');
  const suffix = Date.now().toString();
  const groupName = `Familia ucraniana E2E ${suffix}`;
  const guestName = `Олена ${suffix}`;

  try {
    await page.goto('/admin/login');
    await page.getByLabel('Correu electrònic').fill(process.env.WEDDING_E2E_EMAIL!);
    await page.getByLabel('Contrasenya').fill(process.env.WEDDING_E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entra' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/admin/gestion?view=grups');
    await page.getByLabel('Nom del grup', { exact: true }).fill(groupName);
    await page.getByLabel('Idioma', { exact: true }).selectOption('uk');
    await page.getByRole('button', { name: 'Crea el grup' }).click();
    await expect(page.locator('.admin-group-table')).toContainText(groupName);

    await page.goto('/admin/gestion?view=nova');
    await page.locator('[data-invitation-dialog] input[name="name"]').fill(guestName);
    await page.locator('[data-invitation-dialog] select[name="groupId"]').selectOption({ label: `${groupName} · Українська` });
    await page.getByRole('button', { name: 'Crea la invitació i l’enllaç' }).click();
    await expect(page.getByText('Invitació creada. Copia l’enllaç per a compartir-la.')).toBeVisible();
    const detailUrl = page.url();
    const link = await page.getByLabel('Enllaç de la invitació').inputValue();
    expect(new URL(link).pathname).toMatch(/^\/uk\/i\/[A-Za-z0-9_-]{43}\/$/);

    await page.goto(link);
    await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
    await page.getByRole('button', { name: 'Увійти без анімації' }).click();
    await page.getByLabel('Так, буду').check();
    await page.getByLabel('Ні', { exact: true }).check();
    await page.getByLabel('Ні, дякую').check();
    await page.getByRole('button', { name: 'Зберегти відповідь' }).click();
    await expect(page.getByRole('status')).toContainText('Ми зберегли вашу відповідь');

    await page.goto('/admin/gestion?view=grups');
    const groupRow = page.locator('.admin-group-table tbody tr').filter({ has: page.locator(`input[name="name"][value="${groupName}"]`) });
    await groupRow.locator('select[name="locale"]').selectOption('es');
    await groupRow.getByRole('button', { name: `Guarda el grup ${groupName}` }).click();
    await expect(page.locator('[data-admin-feedback]')).toContainText('Grup i idioma guardats.');
    await expect(groupRow.locator('select[name="locale"]')).toHaveValue('es');

    await page.goto(link);
    expect(new URL(page.url()).pathname).toBe('/i/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');

    await page.goto(detailUrl);
    await page.locator('[data-detail-part="personalization"] select[name="groupId"]').selectOption('');
    await page.locator('[data-detail-part="personalization"] select[name="locale"]').selectOption('uk');
    await page.getByRole('button', { name: 'Guarda la invitació' }).click();
    await expect(page.getByLabel('Enllaç de la invitació')).toHaveValue(/\/uk\/i\//);
    await page.locator('[data-detail-part="personalization"] select[name="groupId"]').selectOption({ label: `${groupName} · Valencià` });
    await page.getByRole('button', { name: 'Guarda la invitació' }).click();
    await expect(page.getByLabel('Enllaç de la invitació')).toHaveValue(/^https?:\/\/[^/]+\/i\//);
  } finally {
    if (!process.env.DATABASE_URL) process.loadEnvFile('.env.local');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
      await client.connect();
      await client.query('delete from wedding.invitations where addressee=$1', [guestName]);
      await client.query('delete from wedding.invitation_groups g where g.name=$1 and not exists (select 1 from wedding.invitations i where i.group_id=g.id)', [groupName]);
    } finally {
      await client.end();
    }
  }
});
