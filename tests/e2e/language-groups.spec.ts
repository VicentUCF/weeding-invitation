import { test, expect } from '@playwright/test';

test('group preset opens a Ukrainian invitation and follows later group changes', async ({ page }) => {
  test.skip(!process.env.WEDDING_E2E_PASSWORD, 'Requires a disposable PostgreSQL database and local admin credentials');
  const suffix = Date.now().toString();
  const groupName = `Familia ucraniana ${suffix}`;
  const guestName = `Олена ${suffix}`;

  await page.goto('/admin/login');
  await page.getByLabel('Correo electrónico').fill(process.env.WEDDING_E2E_EMAIL || 'test@example.com');
  await page.getByLabel('Contraseña').fill(process.env.WEDDING_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/$/);

  await page.getByLabel('Nuevo grupo').fill(groupName);
  await page.getByLabel('Idioma predeterminado').selectOption('uk');
  await page.getByRole('button', { name: 'Crear grupo' }).click();
  await expect(page.getByText('Grupo e idioma guardados.')).toBeVisible();

  await page.getByLabel('A quién va dirigida').fill(guestName);
  await page.getByLabel('Personas incluidas, una por línea').fill(guestName);
  await page.getByLabel('Grupo (opcional)').selectOption({ label: `${groupName} · Українська` });
  await page.getByRole('button', { name: 'Crear invitación y enlace' }).click();
  const link = await page.getByLabel('Enlace de invitación').inputValue();
  expect(link).toMatch(/\/uk\/i\/[A-Za-z0-9_-]{43}\/$/);

  await page.goto(link);
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  await page.getByRole('button', { name: 'Увійти без анімації' }).click();
  await expect(page.getByRole('heading', { name: 'Ви будете з нами?' })).toBeVisible();
  await page.getByLabel('Так, буду').check();
  await page.getByLabel('Ні', { exact: true }).check();
  await page.getByRole('button', { name: 'Зберегти відповідь' }).click();
  await page.getByRole('button', { name: 'Увійти без анімації' }).click();
  await expect(page.getByRole('status')).toContainText('Відповідь збережено');
  await page.getByRole('link', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('button', { name: 'Entrar sin animación' }).click();
  await expect(page.getByRole('heading', { name: '¿Nos acompañas?' })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar confirmación' }).click();
  await page.getByRole('button', { name: 'Entrar sin animación' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('status')).toContainText('Respuesta guardada');

  await page.goto('/admin/');
  const groupForm = page.locator('form').filter({ has: page.locator(`input[value="${groupName}"]`) });
  await groupForm.getByLabel('Idioma del grupo').selectOption('es');
  await groupForm.getByRole('button', { name: 'Guardar grupo' }).click();
  await expect(page).toHaveURL(/groupSaved=1/);
  await page.goto(link);
  expect(new URL(page.url()).pathname).toMatch(/^\/i\/[A-Za-z0-9_-]{43}\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');

  await page.goto('/admin/');
  await page.locator('.admin-invitation').filter({ hasText: guestName }).getByRole('link', { name: 'Gestionar' }).click();
  await page.getByLabel('Grupo', { exact: true }).selectOption('');
  await page.getByLabel('Idioma si no hay grupo').selectOption('uk');
  await page.getByRole('button', { name: 'Guardar tarjeta' }).click();
  await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/\/uk\/i\//);
  await page.getByLabel('Grupo', { exact: true }).selectOption({ label: `${groupName} · Español` });
  await page.getByRole('button', { name: 'Guardar tarjeta' }).click();
  await expect(page.getByLabel('Enlace de invitación')).toHaveValue(/^https?:\/\/[^/]+\/i\//);
  expect(new URL(await page.getByLabel('Enlace de invitación').inputValue()).pathname).toMatch(/^\/i\/[A-Za-z0-9_-]{43}\/$/);
});
