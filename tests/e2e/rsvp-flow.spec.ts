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
  test.skip(!process.env.WEDDING_E2E_EMAIL || !process.env.WEDDING_E2E_PASSWORD, 'Requires a disposable Supabase project and an authorized Auth user');
  const unique = Date.now().toString();
  const first = `María ${unique}`;
  const second = `Pablo ${unique}`;
  const addressee = `${first} y ${second}`;
  let detailUrl = '';
  let deleted = false;

  try {
    await page.goto('/admin/login');
    await page.getByLabel('Correu electrònic').fill(process.env.WEDDING_E2E_EMAIL!);
    await page.getByLabel('Contrasenya').fill(process.env.WEDDING_E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Entra' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.goto('/admin/gestion?view=nova');
    await page.locator('[data-invitation-dialog] input[name="name"]').fill(addressee);
    await page.getByRole('button', { name: 'Crea la invitació i l’enllaç' }).click();
    detailUrl = page.url();
    await expect(page.getByText('Invitació creada. Copia l’enllaç per a compartir-la.')).toBeVisible();
    const originalLink = await page.getByLabel('Enllaç de la invitació').inputValue();
    expect(originalLink).toMatch(/\/i\/[A-Za-z0-9_-]{43}\/$/);

    await page.getByLabel('Afig una persona a esta invitació').fill(second);
    await page.getByRole('button', { name: 'Afig', exact: true }).click();
    await expect(page.locator('[data-guest-id]')).toHaveCount(2);

    await page.goto(originalLink);
    await page.getByRole('button', { name: 'Entra sense animació' }).click();
    const guestFields = page.locator('[data-rsvp-guest]');
    await expect(guestFields).toHaveCount(2);
    await guestFields.nth(0).getByLabel('Sí, vindré').check();
    await expect(guestFields.nth(0).locator('.rsvp-form__food')).toBeVisible();
    await guestFields.nth(0).getByLabel('Sí', { exact: true }).check();
    await guestFields.nth(0).getByLabel(/Explica les al·lèrgies/).fill('Frutos secos; evitar trazas');
    await guestFields.nth(0).getByLabel(/Autoritze Jose i Anas/).check();
    await guestFields.nth(0).getByLabel('Sí, vull plaça').check();
    await guestFields.nth(0).getByLabel('Anada i tornada').check();
    await guestFields.nth(1).getByLabel('No podré vindre').check();
    const responseSaved = page.waitForResponse((response) => response.request().method() === 'POST' && /\/i\/[^/]+\//.test(new URL(response.url()).pathname));
    await page.getByRole('button', { name: 'Guarda les respostes' }).click();
    const savedResponse = await responseSaved;
    expect(savedResponse.status(), await savedResponse.text()).toBe(200);
    await expect(page.getByRole('status')).toContainText('Hem guardat les teues respostes');

    await page.goto('/admin/gestion');
    await page.getByRole('searchbox', { name: 'Busca per nom o correu' }).fill(unique);
    await page.getByRole('button', { name: 'Filtra' }).click();
    await expect(page.locator('[data-management-results] tr[data-invitation-id]')).toHaveCount(1);
    await expect(page.locator('[data-management-results]')).toContainText(addressee);

    await page.goto(detailUrl);
    await expect(page.getByLabel('Al·lèrgies i intoleràncies').first()).toHaveValue('Frutos secos; evitar trazas');
    await expect(page.getByLabel('Plaça a l’autobús').first()).toHaveValue('yes');
    await expect(page.getByLabel('Trajecte de l’autobús').first()).toHaveValue('both');
    const firstGuest = page.locator('[data-guest-id]').first();
    await firstGuest.getByLabel('Altres observacions').fill('Arribaré a les dotze');
    await firstGuest.getByRole('button', { name: 'Guarda la resposta' }).click();
    await expect(firstGuest.getByLabel('Altres observacions')).toHaveValue('Arribaré a les dotze');
    const csv = await page.request.get('/admin/export.csv');
    expect(csv.ok()).toBeTruthy();
    const csvText = await csv.text();
    expect(csvText).toContain('Frutos secos; evitar trazas');
    expect(csvText).toContain('"Anada i tornada"');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Renova l’enllaç' }).click();
    await expect.poll(() => page.getByLabel('Enllaç de la invitació').inputValue()).not.toBe(originalLink);
    const newLink = await page.getByLabel('Enllaç de la invitació').inputValue();
    expect((await page.request.get(originalLink)).status()).toBe(404);
    expect((await page.request.get(newLink)).status()).toBe(200);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Revoca l’enllaç' }).click();
    await expect.poll(async () => (await page.request.get(newLink)).status()).toBe(404);

    await page.getByLabel(`Escriu «${addressee}» per a confirmar`).fill(addressee);
    await page.getByRole('button', { name: 'Elimina definitivament' }).click();
    await expect(page).toHaveURL(/\/admin\/gestion\?deleted=1$/);
    deleted = true;
  } finally {
    if (!deleted && detailUrl) {
      await page.goto(detailUrl);
      await page.getByLabel(`Escriu «${addressee}» per a confirmar`).fill(addressee);
      await page.getByRole('button', { name: 'Elimina definitivament' }).click();
      await expect(page).toHaveURL(/\/admin\/gestion\?deleted=1$/);
    }
  }
});
