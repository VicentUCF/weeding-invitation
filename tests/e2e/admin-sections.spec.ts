import { test, expect } from '@playwright/test';

test('group edits refresh only their section and preserve a dirty form during remote changes', async ({ page }) => {
  let revision = 'r1';
  let fragmentCount = 0;
  let submittedName = '';
  const section = (name: string) => `<main data-admin-groups>
    <form id="group-form" method="post" action="/admin/gestion?view=grups"><input type="hidden" name="action" value="editGroup"><input type="hidden" name="groupId" value="id"></form>
    <label for="group-name">Nom</label><input id="group-name" form="group-form" name="name" value="${name}">
    <button form="group-form" type="submit">Guarda el grup</button>
  </main>`;
  await page.route(/\/admin\/revision(?:\?|$)/, (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ revision }) }));
  await page.route(/\/admin\/gestion\/grupos(?:\?|$)/, (route) => {
    fragmentCount += 1;
    return route.fulfill({ contentType: 'text/html', body: section(submittedName) });
  });
  await page.route(/\/admin\/gestion(?:\?|$)/, (route) => {
    if (route.request().method() === 'POST') {
      submittedName = /name="name"\r?\n\r?\n([^\r\n]+)/.exec(route.request().postData() ?? '')?.[1] ?? '';
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ page: 1 }) });
    }
    return route.fulfill({ contentType: 'text/html', body: `<html><body><div class="admin-shell" data-admin-revision="r1" data-admin-scope="groups"><header id="stable-header">Gestió</header><p data-admin-feedback hidden></p>${section('Família')}</div><script type="module" src="/src/pages/admin/gestion.astro?astro&type=script&index=0&lang.ts"></script></body></html>` });
  });

  await page.goto('/admin/gestion?view=grups');
  await page.evaluate(() => { (window as typeof window & { originalDocument?: Document }).originalDocument = document; });
  await page.locator('#group-name').fill('Amics');
  revision = 'r2';
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.locator('[data-admin-feedback]')).toContainText('Hi ha dades noves');
  expect(fragmentCount).toBe(0);
  await page.getByRole('button', { name: 'Guarda el grup' }).click();
  await expect(page.locator('#group-name')).toHaveValue('Amics');
  await expect.poll(() => fragmentCount).toBe(1);
  expect(submittedName).toBe('Amics');
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
});

test('invitation guest edit replaces only the guests fragment', async ({ page }) => {
  const id = '11111111-1111-4111-8111-111111111111';
  let fragmentCount = 0;
  let postCount = 0;
  const guests = (name: string) => `<section data-detail-part="guests"><div class="admin-guests"><article data-guest-id="a"><form><input id="other-edit" name="name" value="Inicial"></form></article>${name === 'Maria' ? '<article data-guest-id="b"><p data-guest-name>Maria</p></article>' : ''}</div><form method="post" action="/admin/invitations/${id}"><input type="hidden" name="action" value="addGuest"><input name="name" value="${name}"><button type="submit">Afig</button></form></section>`;
  await page.route(`/admin/invitations/${id}/fragmento?part=guests`, (route) => {
    fragmentCount += 1;
    return route.fulfill({ contentType: 'text/html', body: `<div data-detail-fragments>${guests('Maria')}</div>` });
  });
  await page.route(`/admin/invitations/${id}`, (route) => {
    if (route.request().method() === 'POST') {
      postCount += 1;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ part: 'guests' }) });
    }
    return route.fulfill({ contentType: 'text/html', body: `<html><body><div class="admin-shell--detail" data-admin-revision="r1"><header data-detail-part="header"><h1>Invitació</h1></header><p data-detail-feedback hidden></p>${guests('Inicial')}</div><script type="module" src="/src/pages/admin/invitations/[id].astro?astro&type=script&index=0&lang.ts"></script></body></html>` });
  });

  await page.goto(`/admin/invitations/${id}`);
  await page.evaluate(() => { (window as typeof window & { originalDocument?: Document }).originalDocument = document; });
  await page.locator('#other-edit').fill('Encara editant');
  await page.locator('[data-detail-part="guests"] > form input[name="name"]').fill('Maria');
  await page.getByRole('button', { name: 'Afig' }).click();
  await expect(page.locator('[data-guest-name]')).toHaveText('Maria');
  await expect(page.locator('#other-edit')).toHaveValue('Encara editant');
  expect({ postCount, fragmentCount }).toEqual({ postCount: 1, fragmentCount: 1 });
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
});

test('pair links refresh the guest section and can be removed', async ({ page }) => {
  const id = '11111111-1111-4111-8111-111111111111';
  let linked = false;
  const section = () => `<section data-detail-part="guests"><div class="admin-guests"><article data-guest-id="first"><p>Maria</p>${linked ? `<div class="admin-guest__partner"><a href="/admin/invitations/22222222-2222-4222-8222-222222222222">Joan · Invitació de Joan</a><form method="post"><input type="hidden" name="action" value="unlinkGuest"><input type="hidden" name="guestId" value="first"><button type="submit">Desvincula la parella</button></form></div>` : ''}</article></div><div class="admin-partners"><form method="post"><input type="hidden" name="action" value="linkGuests"><label for="pair-first">Persona d’esta invitació</label><select id="pair-first" name="firstGuestId"><option value="first">Maria</option></select><label for="pair-second">Parella en una altra invitació</label><select id="pair-second" name="secondGuestId"><option value="second">Joan</option></select><button type="submit">Vincula la parella</button></form></div></section>`;
  await page.route(`/admin/invitations/${id}/fragmento?part=guests`, (route) => route.fulfill({ contentType: 'text/html', body: `<div data-detail-fragments>${section()}</div>` }));
  await page.route(`/admin/invitations/${id}`, (route) => {
    if (route.request().method() === 'POST') {
      const action = /name="action"\r?\n\r?\n([^\r\n]+)/.exec(route.request().postData() ?? '')?.[1];
      linked = action === 'linkGuests';
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ part: 'guests' }) });
    }
    return route.fulfill({ contentType: 'text/html', body: `<html><body><div class="admin-shell--detail"><p data-detail-feedback hidden></p>${section()}</div><script type="module" src="/src/pages/admin/invitations/[id].astro?astro&type=script&index=0&lang.ts"></script></body></html>` });
  });

  await page.goto(`/admin/invitations/${id}`);
  await page.evaluate(() => { (window as typeof window & { originalDocument?: Document }).originalDocument = document; });
  await page.getByRole('button', { name: 'Vincula la parella' }).click();
  await expect(page.getByRole('link', { name: 'Joan · Invitació de Joan' })).toBeVisible();
  await page.getByRole('button', { name: 'Desvincula la parella' }).click();
  await expect(page.getByRole('link', { name: 'Joan · Invitació de Joan' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
});

test('settings save refreshes its section without loading a new document', async ({ page }) => {
  let postCount = 0;
  let fragmentCount = 0;
  const section = (checked: boolean) => `<main data-admin-settings><form method="post" action="/admin/gestion?view=ajustos"><input type="hidden" name="action" value="settings"><label><input type="checkbox" name="enabled" value="yes" ${checked ? 'checked' : ''}>Permet les respostes</label><button type="submit">Guarda la configuració</button></form></main>`;
  await page.route(/\/admin\/gestion\/ajustes(?:\?|$)/, (route) => {
    fragmentCount += 1;
    return route.fulfill({ contentType: 'text/html', body: section(false) });
  });
  await page.route(/\/admin\/gestion(?:\?|$)/, (route) => {
    if (route.request().method() === 'POST') {
      postCount += 1;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ saved: true }) });
    }
    return route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<html><head><meta charset="utf-8"></head><body><div class="admin-shell" data-admin-revision="r1" data-admin-scope="settings"><header id="stable-header">Gestió</header><p data-admin-feedback hidden></p>${section(true)}</div><script type="module" src="/src/pages/admin/gestion.astro?astro&type=script&index=0&lang.ts"></script></body></html>` });
  });

  await page.goto('/admin/gestion?view=ajustos');
  await page.evaluate(() => { (window as typeof window & { originalDocument?: Document }).originalDocument = document; });
  await page.getByRole('checkbox', { name: 'Permet les respostes' }).uncheck();
  await page.getByRole('button', { name: 'Guarda la configuració' }).click();
  await expect(page.getByRole('checkbox', { name: 'Permet les respostes' })).not.toBeChecked();
  await expect.poll(() => fragmentCount).toBe(1);
  expect(postCount).toBe(1);
  expect(await page.evaluate(() => (window as typeof window & { originalDocument?: Document }).originalDocument === document)).toBe(true);
});
