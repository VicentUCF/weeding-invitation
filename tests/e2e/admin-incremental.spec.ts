import { test, expect } from '@playwright/test';

test('admin filters and delivery updates keep the document and reuse a recent result', async ({ page }) => {
  let getCount = 0;
  let documentGetCount = 0;
  let fragmentGetCount = 0;
  let postCount = 0;
  let revision = 'r1';
  let revisionCount = 0;
  await page.route(/\/admin\/revision(?:\?|$)/, (route) => {
    revisionCount += 1;
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ revision }) });
  });
  const results = (name: string) => `<div data-management-results><table><tbody><tr data-invitation-id="id"><td>${name}</td><td>
    <form class="admin-delivery-form" method="post" action="/admin/gestion">
      <input type="hidden" name="action" value="delivery" /><input type="hidden" name="invitationId" value="id" />
      <label class="admin-delivery-check"><input type="checkbox" name="sent" value="yes" /><span>Sense enviar</span></label>
    </form>
  </td></tr></tbody></table><nav class="admin-pagination"><a href="/admin/gestion?page=2">2</a></nav></div>`;
  await page.route(/\/admin\/gestion\/resultados(?:\?|$)/, (route) => {
    getCount += 1;
    fragmentGetCount += 1;
    const params = new URL(route.request().url()).searchParams;
    const name = params.get('q') ? 'Maria' : 'Inicial';
    const options = params.get('groups') === '1' ? '<template data-management-group-options><select data-filter-options><option value="all">Tots</option><option value="none">Sense grup</option><option value="new">Amics</option></select></template>' : '';
    return route.fulfill({ contentType: 'text/html', body: results(name) + options });
  });
  await page.route(/\/admin\/gestion(?:\?|$)/, (route) => {
    if (route.request().method() === 'POST') {
      postCount += 1;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ sent: true }) });
    }
    getCount += 1;
    documentGetCount += 1;
    const name = new URL(route.request().url()).searchParams.get('q') ? 'Maria' : 'Inicial';
    const body = `<html><body><div class="admin-shell" data-admin-revision="r1" data-admin-scope="list"><header id="stable-header">Gestió</header>
      <form class="admin-management-filters" action="/admin/gestion" method="get">
        <input name="q" /><select name="status"><option value="all">Tots</option></select>
        <select name="response"><option value="all">Totes</option></select>
        <select name="group"><option value="all">Tots</option></select>
        <button type="submit">Filtra</button>
      </form>${results(name)}<p data-copy-status role="status"></p>
      </div><script type="module" src="/src/pages/admin/gestion.astro?astro&type=script&index=0&lang.ts"></script>
    </body></html>`;
    return route.fulfill({ contentType: 'text/html', body });
  });

  await page.goto('/admin/gestion');
  await page.evaluate(() => {
    (window as typeof window & { originalDocument?: Document; originalHeader?: Element | null }).originalDocument = document;
    (window as typeof window & { originalHeader?: Element | null }).originalHeader = document.querySelector('#stable-header');
  });
  await page.locator('input[name="q"]').fill('Maria');
  await page.getByRole('button', { name: 'Filtra' }).click();
  await expect(page.locator('[data-management-results] td').first()).toHaveText('Maria');
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
  expect(getCount).toBe(2);
  expect({ documentGetCount, fragmentGetCount }).toEqual({ documentGetCount: 1, fragmentGetCount: 1 });

  await page.goBack();
  await expect(page.locator('[data-management-results] td').first()).toHaveText('Inicial');
  await page.goForward();
  await expect(page.locator('[data-management-results] td').first()).toHaveText('Maria');
  expect(getCount).toBe(2);

  await page.locator('.admin-delivery-check input').check();
  await expect.poll(() => postCount).toBe(1);
  await expect(page.locator('.admin-delivery-check span')).toHaveText('Enviada');
  expect(postCount).toBe(1);
  expect(getCount).toBe(2);

  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => revisionCount).toBe(1);
  expect(getCount).toBe(2);

  revision = 'r2';
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'wedding.admin.changed' })));
  await expect.poll(() => getCount).toBe(3);
  await expect(page.locator('select[name="group"] option[value="new"]')).toHaveText('Amics');
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
  expect(await page.evaluate(() => (window as typeof window & { originalHeader?: Element | null }).originalHeader === document.querySelector('#stable-header'))).toBe(true);
  expect({ documentGetCount, fragmentGetCount }).toEqual({ documentGetCount: 1, fragmentGetCount: 2 });
});
