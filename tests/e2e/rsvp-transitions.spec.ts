import { test, expect } from '@playwright/test';

test('animates the RSVP fields that depend on selected answers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const rsvp = page.locator('#confirmar');
  const food = rsvp.locator('.rsvp-form__food');
  const allergy = rsvp.locator('.rsvp-form__allergy-detail');
  const route = rsvp.locator('.rsvp-form__bus-route');

  await rsvp.getByLabel('Sí, vindré').check();
  expect(await food.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);
  await expect(food).toBeVisible();

  await rsvp.getByLabel('Sí', { exact: true }).check();
  expect(await allergy.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);
  await expect(allergy).toBeVisible();

  await rsvp.getByLabel('No', { exact: true }).check();
  expect(await allergy.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);
  await expect(allergy).toBeHidden();

  await rsvp.getByLabel('Sí, vull plaça').check();
  expect(await route.evaluate((element) => element.getAnimations().length)).toBeGreaterThan(0);
  await expect(route).toBeVisible();
  await rsvp.getByLabel('No, gràcies').check();
  await expect(route).toBeHidden();
});

test('shows dependent fields immediately when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const rsvp = page.locator('#confirmar');
  await rsvp.getByLabel('Sí, vindré').check();
  const food = rsvp.locator('.rsvp-form__food');
  await expect(food).toBeVisible();
  expect(await food.evaluate((element) => element.getAnimations().length)).toBe(0);
  await rsvp.getByLabel('Sí', { exact: true }).check();
  const allergy = rsvp.locator('.rsvp-form__allergy-detail');
  await expect(allergy).toBeVisible();
  expect(await allergy.evaluate((element) => element.getAnimations().length)).toBe(0);
});

test('starts each expansion without a layout jump', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const rsvp = page.locator('#confirmar');
  const firstFrameChange = (selector: string) => rsvp.locator('.rsvp-form__guest').evaluate((fieldset, selector) => {
    const before = fieldset.getBoundingClientRect().height;
    const input = fieldset.querySelector<HTMLInputElement>(selector)!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return fieldset.getBoundingClientRect().height - before;
  }, selector);

  expect(Math.abs(await firstFrameChange('input[name^="response_"][value="yes"]'))).toBeLessThan(2);
  await expect(rsvp.locator('.rsvp-form__food')).toBeVisible();
  await rsvp.locator('.rsvp-form__food').evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  expect(Math.abs(await firstFrameChange('input[name^="allergy_answer_"][value="yes"]'))).toBeLessThan(2);
  await expect(rsvp.locator('.rsvp-form__allergy-detail')).toBeVisible();
});

test('finishes the bus route expansion without a layout jump', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const rsvp = page.locator('#confirmar');
  await rsvp.getByLabel('Sí, vindré').check();
  await rsvp.locator('.rsvp-form__transport').evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  await rsvp.getByLabel('Sí, vull plaça').check();
  const sizes = await rsvp.locator('.rsvp-form__bus-route').evaluate(async (element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 319.9;
    const read = () => ({ route: element.getBoundingClientRect().height, transport: element.parentElement!.getBoundingClientRect().height, fieldset: element.closest('fieldset')!.getBoundingClientRect().height, margin: getComputedStyle(element).marginTop });
    const before = read();
    animation.finish();
    await new Promise(requestAnimationFrame);
    return { before, after: read() };
  });
  expect(Math.abs(sizes.after.fieldset - sizes.before.fieldset)).toBeLessThan(2);
});
