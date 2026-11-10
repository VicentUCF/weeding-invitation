import { test, expect } from '@playwright/test';

test('opens the sealed envelope and reveals the configured event', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Abrir la invitación de Jose y Anas' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeHidden();
  const miniPaper = page.locator('[data-paper="mini"]');
  const fullPaper = page.locator('[data-paper="full"]');
  await expect(page.locator('.hero__paper')).toHaveCount(1);
  await expect(fullPaper).toHaveCount(0);
  const miniBounds = (await miniPaper.boundingBox())!;
  const letterBounds = (await page.locator('[data-letter]').boundingBox())!;
  expect(miniBounds.width).toBeLessThanOrEqual(letterBounds.width + 1);
  expect(miniBounds.height).toBeLessThanOrEqual(letterBounds.height + 1);
  const travelingPaper = await miniPaper.elementHandle();
  const floral = await page.locator('.opening__floral--right').boundingBox();
  expect(floral).not.toBeNull();
  expect(floral!.height / floral!.width).toBeCloseTo(900 / 860, 1);
  const seal = page.locator('[data-open]');
  const initialSealTop = (await seal.boundingBox())!.y;
  await expect(page.locator('[data-flap] [data-open]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Abrir la invitación de Jose y Anas' }).click();
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-state', 'opening');
  await expect.poll(() => page.locator('[data-flap]').evaluate((flap) => (flap as HTMLElement).style.transform)).not.toBe('');
  await expect.poll(async () => (await seal.boundingBox())!.y).toBeLessThan(initialSealTop - 20);
  await expect(page.locator('[data-opening]')).toHaveClass(/opening--approaching/);
  await expect.poll(() => page.locator('[data-letter]').evaluate((node) => (node as HTMLElement).style.zIndex)).toBe('7');
  await expect.poll(() => page.locator('[data-letter]').evaluate((node) => (node as HTMLElement).style.clipPath)).toBe('none');
  const clearedLetter = (await page.locator('[data-letter]').boundingBox())!;
  const loweredEnvelope = (await page.locator('[data-envelope]').boundingBox())!;
  expect(clearedLetter.y + clearedLetter.height).toBeLessThan(loweredEnvelope.y);
  await expect(page.locator('[data-card-rotor], .invitation-card__back')).toHaveCount(0);
  await expect(fullPaper).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jose');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Anas');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('[data-opening]')).toBeHidden();
  expect(await travelingPaper!.evaluate((paper) => (paper as HTMLElement).dataset.paper)).toBe('full');
  expect((await fullPaper.boundingBox())!.width).toBeGreaterThan(letterBounds.width);
  await expect(page.getByRole('heading', { name: 'L’Alqueria de Galim' })).toBeVisible();
  await expect.poll(() => page.locator('[data-paper="full"] .hero__portrait img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test('can enter without animation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entrar sin animación' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-opening]')).toBeHidden();
});

test('respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir la invitación de Jose y Anas' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-opening]')).toBeHidden();
});

test('settles the same card without the View Transition API', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { value: undefined });
  });
  await page.goto('/');
  const travelingPaper = await page.locator('[data-paper="mini"]').elementHandle();
  await page.locator('[data-open]').click();
  await expect(page.locator('[data-opening]')).toBeHidden();
  expect(await travelingPaper!.evaluate((paper) => (paper as HTMLElement).dataset.paper)).toBe('full');
  await expect(page.locator('[data-paper="full"] .hero__portrait img')).toBeVisible();
});

test('keeps the invitation legible without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-opening]')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'L’Alqueria de Galim' })).toBeVisible();
  await context.close();
});
