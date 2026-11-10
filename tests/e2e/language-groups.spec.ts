import { test, expect } from '@playwright/test';

test('group preset opens a Ukrainian invitation and follows later group changes', async ({ page }) => {
  test.skip(!process.env.WEDDING_E2E_PASSWORD, 'Requires a disposable PostgreSQL database and local admin credentials');
  const suffix = Date.now().toString();
  const groupName = `Familia ucraniana ${suffix}`;
  const guestName = `Олена ${suffix}`;

  await page.goto('/admin/login');
  await page.getByLabel('Correu electrònic').fill(process.env.WEDDING_E2E_EMAIL || 'test@example.com');
  await page.getByLabel('Contrasenya').fill(process.env.WEDDING_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entra' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);

  await page.getByLabel('Grup nou').fill(groupName);
  await page.getByLabel('Idioma predeterminat').selectOption('uk');
  await page.getByRole('button', { name: 'Crea el grup' }).click();
  await expect(page.getByText('Grup i idioma guardats.')).toBeVisible();

  await page.getByLabel('A qui va dirigida').fill(guestName);
  await page.getByLabel('Persones convidades, una per línia').fill(guestName);
  await page.getByLabel('Grup (opcional)').selectOption({ label: `${groupName} · Українська` });
  await page.getByRole('button', { name: 'Crea la invitació i l’enllaç' }).click();
  const link = await page.getByLabel('Enllaç de la invitació').inputValue();
  expect(link).toMatch(/\/uk\/i\/[A-Za-z0-9_-]{43}\/$/);

  await page.goto(link);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await page.getByRole('button', { name: 'Увійти без анімації' }).click();
  await expect(page.getByRole('heading', { name: 'Ви будете з нами?' })).toBeVisible();
  await page.getByLabel('Так, буду').check();
  await page.getByLabel('Ні', { exact: true }).check();
  await page.getByRole('button', { name: 'Зберегти відповідь' }).click();
  await expect(page.getByRole('status')).toContainText('Ми зберегли вашу відповідь');
  await page.getByRole('link', { name: 'Valencià' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  await expect(page.getByRole('heading', { name: 'Ens acompanyes?' })).toBeVisible();
  await page.getByRole('button', { name: 'Guarda les respostes' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');
  await expect(page.getByRole('status')).toContainText('Hem guardat les teues respostes');

  await page.goto('/admin/');
  const groupForm = page.locator('form').filter({ has: page.locator(`input[value="${groupName}"]`) });
  await groupForm.getByLabel('Idioma del grup').selectOption('es');
  await groupForm.getByRole('button', { name: 'Guarda el grup' }).click();
  await expect(page).toHaveURL(/groupSaved=1/);
  await page.goto(link);
  expect(new URL(page.url()).pathname).toMatch(/^\/i\/[A-Za-z0-9_-]{43}\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca-ES-valencia');

  await page.goto('/admin/');
  await page.locator('.admin-invitation').filter({ hasText: guestName }).getByRole('link', { name: 'Gestiona' }).click();
  await page.getByLabel('Grup', { exact: true }).selectOption('');
  await page.getByLabel('Idioma si no hi ha grup').selectOption('uk');
  await page.getByRole('button', { name: 'Guarda la invitació' }).click();
  await expect(page.getByLabel('Enllaç de la invitació')).toHaveValue(/\/uk\/i\//);
  await page.getByLabel('Grup', { exact: true }).selectOption({ label: `${groupName} · Valencià` });
  await page.getByRole('button', { name: 'Guarda la invitació' }).click();
  await expect(page.getByLabel('Enllaç de la invitació')).toHaveValue(/^https?:\/\/[^/]+\/i\//);
  expect(new URL(await page.getByLabel('Enllaç de la invitació').inputValue()).pathname).toMatch(/^\/i\/[A-Za-z0-9_-]{43}\/$/);
});
