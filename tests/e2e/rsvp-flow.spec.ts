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
  await page.getByLabel('Correu electrònic').fill(process.env.WEDDING_E2E_EMAIL || 'test@example.com');
  await page.getByLabel('Contrasenya').fill(process.env.WEDDING_E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Entra' }).click();
  await expect(page.getByRole('heading', { name: 'Invitacions i respostes' })).toBeVisible();

  await page.getByLabel('A qui va dirigida').fill(`${first} y ${second}`);
  await page.getByLabel('Correu de contacte (opcional)').fill('demo@example.com');
  await page.getByLabel('Persones convidades, una per línia').fill(`${first}\n${second}`);
  await page.getByRole('button', { name: 'Crea la invitació i l’enllaç' }).click();
  await expect(page.getByText('Invitació creada. Copia l’enllaç per a compartir-la.')).toBeVisible();
  const originalLink = await page.getByLabel('Enllaç de la invitació').inputValue();
  expect(originalLink).toMatch(/\/i\/[A-Za-z0-9_-]{43}\/$/);

  await page.goto(originalLink);
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const guestFields = page.locator('[data-rsvp-guest]');
  await expect(guestFields).toHaveCount(2);
  await guestFields.nth(0).getByLabel('Sí, vindré').check();
  await expect(guestFields.nth(0).locator('.rsvp-form__food')).toBeVisible();
  await guestFields.nth(0).getByLabel('Sí', { exact: true }).check();
  await expect(guestFields.nth(0).locator('.rsvp-form__allergy-detail')).toBeVisible();
  await guestFields.nth(0).getByLabel(/Explica les al·lèrgies/).fill('Frutos secos; evitar trazas');
  await guestFields.nth(0).getByLabel('Altres necessitats alimentàries (opcional)').fill('Sin lactosa');
  await guestFields.nth(0).getByLabel(/Autoritze Jose i Anas/).check();
  await guestFields.nth(1).getByLabel('No podré vindre').check();
  await expect(guestFields.nth(1).locator('.rsvp-form__food')).toBeHidden();
  await page.getByRole('button', { name: 'Guarda les respostes' }).click();
  await expect(page.getByRole('status')).toContainText('Hem guardat les teues respostes');

  await page.goto('/admin/');
  await expect(page.getByRole('heading', { name: `${first} y ${second}` })).toBeVisible();
  await page.locator('.admin-invitation').filter({ hasText: `${first} y ${second}` }).getByRole('link', { name: 'Gestiona' }).click();
  await expect(page.getByLabel('Al·lèrgies i intoleràncies').first()).toHaveValue('Frutos secos; evitar trazas');
  const csv = await page.request.get('/admin/export.csv');
  expect(csv.ok()).toBeTruthy();
  expect(await csv.text()).toContain('Frutos secos; evitar trazas');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Renova l’enllaç' }).click();
  await expect.poll(() => page.getByLabel('Enllaç de la invitació').inputValue()).not.toBe(originalLink);
  const newLink = await page.getByLabel('Enllaç de la invitació').inputValue();
  expect(newLink).not.toBe(originalLink);
  expect((await page.request.get(originalLink)).status()).toBe(404);
  expect((await page.request.get(newLink)).status()).toBe(200);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Revoca l’enllaç' }).click();
  await expect.poll(async () => (await page.request.get(newLink)).status()).toBe(404);
  await page.getByLabel(`Escriu «${first} y ${second}» per a confirmar`).fill(`${first} y ${second}`);
  await page.getByRole('button', { name: 'Elimina definitivament' }).click();
  await expect(page.getByText('Invitació i respostes eliminades.')).toBeVisible();
});
