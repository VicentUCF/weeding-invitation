import { test, expect } from '@playwright/test';

test('RSVP submission updates its result without reloading the invitation', async ({ page }) => {
  await page.goto('/i/');
  const scriptUrl = new URL('/src/components/rsvp/RSVPForm.astro?astro&type=script&index=0&lang.ts', page.url()).href;

  await page.setContent(`
    <main>
      <form method="post" action="/i/test-token/?lang=es" data-rsvp-live
        data-saved-message="Respostes guardades." data-save-error="No s’ha pogut guardar."
        data-yes="Sí" data-no="No">
        <input name="response_guest" value="yes" />
        <button type="submit">Guarda</button>
      </form>
    </main>
  `);
  let requestCount = 0;
  await page.route('**/i/test-token/?lang=es', (route) => {
    requestCount += 1;
    return route.fulfill({ status: requestCount === 1 ? 200 : 400, contentType: 'application/json', body: requestCount === 1
      ? JSON.stringify({ guests: [{ name: 'Maria', response: 'yes' }] })
      : JSON.stringify({ error: 'Revisa les respostes.' }) });
  });
  await page.addScriptTag({ url: scriptUrl, type: 'module' });
  await page.evaluate(() => { (window as typeof window & { originalDocument?: Document }).originalDocument = document; });

  await page.getByRole('button', { name: 'Guarda' }).click();
  await expect(page.getByRole('status')).toContainText('Respostes guardades.');
  await expect(page.getByRole('status')).toContainText('Maria');
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);

  await page.getByRole('button', { name: 'Guarda' }).click();
  await expect(page.getByRole('alert')).toHaveText('Revisa les respostes.');
  expect(requestCount).toBe(2);
});
