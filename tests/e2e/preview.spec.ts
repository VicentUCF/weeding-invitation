import { test, expect } from '@playwright/test';

test('opens the sealed envelope and reveals the configured event', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Obri la invitació de Jose i Anas' })).toBeVisible();
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
  expect(floral!.height / floral!.width).toBeCloseTo(800 / 1200, 1);
  const seal = page.locator('[data-open]');
  const initialSealTop = (await seal.boundingBox())!.y;
  await expect(page.locator('[data-flap] [data-open]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Obri la invitació de Jose i Anas' }).click();
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-state', 'opening');
  await expect.poll(() => page.locator('[data-flap]').evaluate((flap) => (flap as HTMLElement).style.transform)).not.toBe('');
  await expect.poll(async () => (await seal.boundingBox())!.y).toBeLessThan(initialSealTop - 20);
  await expect(page.locator('[data-opening]')).toHaveClass(/opening--approaching/);
  await expect.poll(() => page.locator('[data-letter]').evaluate((node) => (node as HTMLElement).style.zIndex)).toBe('7');
  await expect(page.locator('[data-letter]')).toHaveCSS('clip-path', 'none');
  await expect.poll(async () => {
    const clearedLetter = (await page.locator('[data-letter]').boundingBox())!;
    const loweredEnvelope = (await page.locator('[data-envelope]').boundingBox())!;
    return loweredEnvelope.y - (clearedLetter.y + clearedLetter.height);
  }, { intervals: [50, 100] }).toBeGreaterThan(0);
  await expect(page.locator('[data-card-rotor], .invitation-card__back')).toHaveCount(0);
  await expect(fullPaper).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jose');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Anas');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('[data-opening]')).toBeHidden();
  expect(await travelingPaper!.evaluate((paper) => (paper as HTMLElement).dataset.paper)).toBe('full');
  expect((await fullPaper.boundingBox())!.width).toBeGreaterThan(letterBounds.width);
  await expect(page.getByRole('heading', { name: 'L’Alqueria de Galim', exact: true })).toBeVisible();
  await expect.poll(() => page.locator('[data-paper="full"] .hero__portrait img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await page.locator('.journey__start').scrollIntoViewIfNeeded();
  await expect(page.locator('.journey__start .journey__place')).toContainText('Xeraco');
  await page.locator('.journey__destination').scrollIntoViewIfNeeded();
  await expect(page.locator('.journey__destination .journey__place')).toContainText('L’Olleria');
  await expect.poll(() => page.locator('.venue-card__art--aerial img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
});

test('draws the road from Xeraco to the arrival pin as the car moves', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  await page.locator('.journey__start').scrollIntoViewIfNeeded();
  await expect(page.locator('.journey__start')).toHaveClass(/is-visible/);
  await expect.poll(() => page.evaluate(() => {
    const start = document.querySelector('.journey__start .journey__place')!.getBoundingClientRect();
    const road = document.querySelector('.journey__road-scene')!.getBoundingClientRect();
    return road.top - start.bottom;
  })).toBeGreaterThan(18);
  const endpoints = await page.evaluate(() => {
    const start = document.querySelector('.journey__start .journey__place')!.getBoundingClientRect();
    const road = document.querySelector('.journey__road-scene')!.getBoundingClientRect();
    const pin = document.querySelector('.journey__arrival-pin')!.getBoundingClientRect();
    return { horizontalOffset: Math.abs(start.left + start.width / 2 - (road.left + road.width / 2)), startGap: road.top - start.bottom, pinOverlap: road.bottom - pin.top };
  });
  expect(endpoints.horizontalOffset).toBeLessThan(3);
  expect(endpoints.startGap).toBeGreaterThan(18);
  expect(endpoints.pinOverlap).toBeGreaterThan(10);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!;
    window.scrollTo(0, road.getBoundingClientRect().top + window.scrollY - window.innerHeight * .8);
  });
  await expect.poll(() => page.locator('[data-route-mask]').evaluate((mask: SVGPathElement) => Number(mask.style.strokeDashoffset))).toBeGreaterThan(100);
  await expect(page.locator('[data-route-start-mask]')).toHaveCSS('opacity', '0');
  await page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!;
    window.scrollTo(0, road.getBoundingClientRect().top + window.scrollY + road.getBoundingClientRect().height * .6 - window.innerHeight * .72);
  });
  await expect.poll(() => page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!;
    const path = document.querySelector<SVGPathElement>('[data-route-path]')!;
    const mask = document.querySelector<SVGPathElement>('[data-route-mask]')!;
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .72 - road.getBoundingClientRect().top) / road.getBoundingClientRect().height));
    return Math.abs(path.getTotalLength() * (1 - progress) - Number(mask.style.strokeDashoffset));
  })).toBeLessThan(2);
  await page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!;
    window.scrollTo(0, road.getBoundingClientRect().top + window.scrollY + road.getBoundingClientRect().height - window.innerHeight * .72);
  });
  await expect.poll(() => page.locator('[data-route-mask]').evaluate((mask: SVGPathElement) => Number(mask.style.strokeDashoffset))).toBeLessThan(2);
  await expect(page.locator('[data-route-end-mask]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-car]')).toHaveCSS('opacity', '1');
  const parkedCar = await page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!.getBoundingClientRect();
    const path = document.querySelector<SVGPathElement>('[data-route-path]')!;
    const parkingPoint = path.getPointAtLength(path.getTotalLength());
    const car = document.querySelector<HTMLElement>('[data-journey-car]')!.getBoundingClientRect();
    return { horizontalGap: Math.abs(car.left + car.width / 2 - (road.left + parkingPoint.x / 500 * road.width)), verticalGap: Math.abs(car.top + car.height / 2 - (road.top + parkingPoint.y / 1220 * road.height)) };
  });
  expect(parkedCar.horizontalGap).toBeLessThan(3);
  expect(parkedCar.verticalGap).toBeLessThan(3);
  await expect(page.locator('[data-journey-car] img')).toHaveAttribute('src', '/images/car-top-view.webp');
  await expect(page.locator('.journey__compass-art img')).toHaveAttribute('src', '/images/galim-aerial-sheet.webp');
});

test('carries the car past L’Olleria and the venue illustration into the location card', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(() => {
    const lastMile = document.querySelector<HTMLElement>('[data-last-mile]')!;
    const top = lastMile.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top - window.innerHeight * .72 + lastMile.offsetHeight * .5);
  });
  await expect(page.locator('.journey__road-surface')).toHaveCount(1);
  await expect(page.locator('[data-last-mile] svg')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!;
    const path = document.querySelector<SVGPathElement>('[data-route-path]')!;
    const mask = document.querySelector<SVGPathElement>('[data-route-mask]')!;
    const progress = Math.max(0, Math.min(1, (window.innerHeight * .72 - road.getBoundingClientRect().top) / road.getBoundingClientRect().height));
    return Math.abs(path.getTotalLength() * (1 - progress) - Number(mask.style.strokeDashoffset));
  })).toBeLessThan(2);
  await expect(page.locator('[data-journey-car]')).toHaveCSS('opacity', '1');
  const arrival = await page.evaluate(() => {
    const car = document.querySelector('[data-journey-car]')!.getBoundingClientRect();
    const pin = document.querySelector('.journey__arrival-pin')!.getBoundingClientRect();
    const label = document.querySelector('.journey__destination .journey__place')!.getBoundingClientRect();
    return { carBelowPin: car.top + car.height / 2 > pin.top + pin.height / 2, labelClearance: label.left - (pin.left + pin.width / 2) };
  });
  expect(arrival.carBelowPin).toBe(true);
  expect(arrival.labelClearance).toBeGreaterThan(35);

  const scrollThroughHandoff = async (progress: number) => page.evaluate((progress) => {
    const top = (element: HTMLElement) => {
      let value = 0;
      for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) value += node.offsetTop;
      return value;
    };
    const preview = document.querySelector<HTMLElement>('[data-journey-preview]')!;
    const art = document.querySelector<HTMLElement>('.venue-card__art--aerial')!;
    const heading = document.querySelector<HTMLElement>('[data-journey-heading]')!;
    const start = top(preview) + preview.offsetHeight * .15 - window.innerHeight * .72;
    const finish = Math.min(top(art) - window.innerHeight * .36, top(heading) - 24);
    window.scrollTo(0, start + (finish - start) * progress);
  }, progress);

  await scrollThroughHandoff(.5);
  await expect(page.locator('[data-journey-art-handoff]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-name-handoff]')).toHaveText('L’Alqueria de Galim');
  await expect(page.locator('[data-journey-name-handoff]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-preview]')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-journey-name]')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-journey-heading]')).toHaveCSS('opacity', '0');

  await scrollThroughHandoff(1);
  await expect(page.locator('[data-journey-card]')).toHaveClass(/is-journey-visible/);
  await expect(page.locator('[data-journey-heading]')).toHaveClass(/is-journey-visible/);
  const headingBounds = (await page.locator('[data-journey-heading]').boundingBox())!;
  expect(headingBounds.y).toBeGreaterThanOrEqual(0);
  expect(headingBounds.y + headingBounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.locator('.venue-card__art--aerial')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-card] h3')).toHaveCSS('opacity', '1');
  await expect.poll(() => page.locator('[data-journey-art-handoff]').evaluate((node) => Number(getComputedStyle(node).opacity))).toBeLessThan(.05);
  await expect.poll(() => page.locator('[data-journey-name-handoff]').evaluate((node) => Number(getComputedStyle(node).opacity))).toBeLessThan(.05);
  await expect.poll(() => page.locator('[data-journey-card]').evaluate((node) => getComputedStyle(node, '::before').backgroundImage)).toContain('venue-map-watercolor.webp');
  await expect(page.locator('[data-journey-card] .venue-card__map')).toHaveAttribute('href', /maps\.google\.com\/\?q=L%27Alqueria/);
});

test('can enter without animation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-opening]')).toBeHidden();
  await expect.poll(() => page.locator('#hero-title').evaluate((heading) => getComputedStyle(heading).opacity)).toBe('1');
});

test('keeps the unopened letter within short viewports without scrolling', async ({ page }) => {
  for (const viewport of [{ width: 320, height: 568 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('[data-opening]')).toHaveCSS('overflow', 'hidden');
    const bounds = await page.locator('[data-open], .opening__hint, [data-skip]').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      }),
    );
    expect(bounds.every(({ top, bottom }) => top >= 0 && bottom <= viewport.height)).toBe(true);
    await page.mouse.wheel(0, 600);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  }
});

test('respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Obri la invitació de Jose i Anas' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[data-opening]')).toBeHidden();
  await expect(page.locator('[data-route-mask]')).toHaveCSS('stroke-dasharray', 'none');
  await expect(page.locator('[data-route-start-mask]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-route-end-mask]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-art-handoff]')).toHaveCSS('display', 'none');
  await expect(page.locator('[data-journey-name-handoff]')).toHaveCSS('display', 'none');
  await expect(page.locator('[data-journey-heading]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-name]')).toContainText('L’Alqueria de Galim');
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
  await expect(page.getByRole('heading', { name: 'L’Alqueria de Galim', exact: true })).toBeVisible();
  await expect(page.locator('.journey__tower-art img')).toHaveAttribute('src', '/images/galim-facade-sheet.webp');
  await expect(page.locator('.venue-card__art--aerial img')).toHaveAttribute('src', '/images/galim-aerial-sheet.webp');
  await expect(page.locator('[data-journey-heading]')).toHaveCSS('opacity', '1');
  await context.close();
});
