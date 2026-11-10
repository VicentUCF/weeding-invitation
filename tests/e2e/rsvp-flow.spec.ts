import { test, expect } from '@playwright/test';

test('private pages require access and unknown invitation links stay private', async ({ page }) => {
  await page.goto('/admin/');
  await expect(page).toHaveURL(/\/admin\/login$/);
  const exportResponse = await page.request.get('/admin/export.csv', { maxRedirects: 0 });
  expect(exportResponse.status()).toBe(303);
  const invalid = await page.request.get('/i/invalid/', { maxRedirects: 0 });
  expect(invalid.status()).toBe(404);
});

test('the couple creates a link, guests respond, and the couple can control access', async ({ page }) => {
  test.skip(!process.env.WEDDING_E2E_PASSWORD, 'Requires a disposable PostgreSQL database and local admin credentials');
  const unique = Date.now().toString();
  const first = `María ${unique}`;
  const second = `Pablo ${unique}`;

  await page.goto('/admin/login');
  await page.getByLabel('Correo electrónico').fill(process.env.WEDDING_E2E_EMAIL || 'test@example.com');
  await page.getByLabel('Contraseña').fill(process.env.WEDDING_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Invitaciones y respuestas' })).toBeVisible();

  await page.getByLabel('A quién va dirigida').fill(`${first} y ${second}`);
  await page.getByLabel('Correo de contacto (opcional)').fill('demo@example.com');
  await page.getByLabel('Personas incluidas, una por línea').fill(`${first}\n${second}`);
  await page.getByRole('button', { name: 'Crear invitación y enlace' }).click();
  await expect(page.getByText('Invitación creada. Copia el enlace para compartirla.')).toBeVisible();
  const originalLink = await page.getByLabel('Enlace de invitación').inputValue();
  expect(originalLink).toMatch(/\/i\/[A-Za-z0-9_-]{43}\/$/);

  await page.goto(originalLink);
  await page.getByRole('button', { name: 'Entrar sin animación' }).click();
  const guestFields = page.locator('[data-rsvp-guest]');
  await expect(guestFields).toHaveCount(2);
  await guestFields.nth(0).getByLabel('Sí, asistiré').check();
  await guestFields.nth(0).getByLabel('Sí', { exact: true }).check();
  await guestFields.nth(0).getByLabel(/Describe todas las alergias/).fill('Frutos secos; evitar trazas');
  await guestFields.nth(0).getByLabel('Otras necesidades alimentarias (opcional)').fill('Sin lactosa');
  await guestFields.nth(0).getByLabel(/Autorizo a que los novios/).check();
  await guestFields.nth(1).getByLabel('No podré asistir').check();
  await page.getByRole('button', { name: 'Guardar confirmación' }).click();
  await page.getByRole('button', { name: 'Entrar sin animación' }).click();
  await expect(page.getByRole('status')).toContainText('Respuesta guardada');

  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: `${first} y ${second}` })).toBeVisible();
  await page.locator('.admin-invitation').filter({ hasText: `${first} y ${second}` }).getByRole('link', { name: 'Gestionar' }).click();
  await expect(page.getByLabel('Alergias e intolerancias').first()).toHaveValue('Frutos secos; evitar trazas');
  const csv = await page.request.get('/admin/export.csv');
  expect(csv.ok()).toBeTruthy();
  expect(await csv.text()).toContain('Frutos secos; evitar trazas');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Renovar enlace' }).click();
  await expect.poll(() => page.getByLabel('Enlace de invitación').inputValue()).not.toBe(originalLink);
  const newLink = await page.getByLabel('Enlace de invitación').inputValue();
  expect(newLink).not.toBe(originalLink);
  expect((await page.request.get(originalLink)).status()).toBe(404);
  expect((await page.request.get(newLink)).status()).toBe(200);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Revocar enlace' }).click();
  await expect.poll(async () => (await page.request.get(newLink)).status()).toBe(404);
  await page.getByLabel(`Escribe «${first} y ${second}» para confirmar`).fill(`${first} y ${second}`);
  await page.getByRole('button', { name: 'Borrar definitivamente' }).click();
  await expect(page.getByText('Invitación y respuestas eliminadas.')).toBeVisible();
});
