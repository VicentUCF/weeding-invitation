import { test, expect } from '@playwright/test';

test('shows an interactive RSVP preview on the public invitation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const rsvp = page.locator('#confirmar');
  await expect(rsvp.getByRole('heading', { name: 'Ens acompanyes?' })).toBeVisible();
  await expect(rsvp.getByText('Esta és una vista prèvia.')).toBeVisible();
  await expect(rsvp.locator('.rsvp-form__food')).toBeHidden();
  await rsvp.getByLabel('Sí, vindré').check();
  await expect(rsvp.locator('.rsvp-form__food')).toBeVisible();
  await expect(rsvp.getByText('Necessitaràs plaça a l’autobús?')).toBeVisible();
  await expect(rsvp.getByRole('heading', { name: 'Transport' })).toBeVisible();
  await expect(rsvp.locator('.rsvp-form__transport-icon img')).toHaveAttribute('src', '/images/bus-icon-refined.png');
  await expect(rsvp.getByLabel('Sí, vull plaça')).toBeVisible();
  const route = rsvp.locator('.rsvp-form__bus-route');
  await expect(route).toBeHidden();
  await rsvp.getByLabel('Sí, vull plaça').check();
  await expect(route).toBeVisible();
  await expect(route.getByLabel('Només anada')).toHaveAttribute('required', '');
  await expect(route.getByLabel('Només tornada')).toBeVisible();
  await expect(route.getByLabel('Anada i tornada')).toBeVisible();
  await route.getByLabel('Només tornada').check();
  await rsvp.getByLabel('No, gràcies').check();
  await expect(route).toBeHidden();
  await expect(route.getByLabel('Només tornada')).not.toHaveAttribute('required', '');
  const busColumns = await rsvp.locator('.rsvp-form__choices--bus').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
  expect(busColumns).toBe(page.viewportSize()!.width <= 620 ? 1 : 2);
  await expect(rsvp.getByText('Vols comentar-nos alguna altra cosa?')).toHaveCount(0);
  await expect(rsvp.getByRole('heading', { name: 'Detalls per al menú' })).toBeVisible();
  await expect(rsvp.locator('.rsvp-form__menu-icon img')).toHaveAttribute('src', '/images/menu-icon-refined.png');
  await expect.poll(() => rsvp.locator('.rsvp-form__menu-icon img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await rsvp.getByLabel('Sí', { exact: true }).check();
  await expect(rsvp.locator('.rsvp-form__allergy-detail')).toBeVisible();
  await rsvp.getByLabel('No podré vindre').check();
  await expect(rsvp.locator('.rsvp-form__food')).toBeHidden();
  await expect(rsvp.locator('.rsvp-form__transport')).toBeHidden();
  await expect(route).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(rsvp.getByRole('button', { name: 'Guarda les respostes' })).toHaveCount(0);
});

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
  await page.locator('[data-opening]').click({ position: { x: 8, y: 8 } });
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

test('opens the envelope from the seal with the keyboard', async ({ page }) => {
  await page.goto('/');
  const seal = page.getByRole('button', { name: 'Obri la invitació de Jose i Anas' });
  await seal.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-state', 'opening');
});

test('draws the road from Xeraco to the arrival pin as the bus moves', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Entra sense animació' }).click();
  const mobileLandscape = page.locator('.journey__landscape-mobile');
  if (testInfo.project.name === 'mobile') {
    await expect(mobileLandscape).toBeVisible();
    await expect.poll(() => mobileLandscape.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  } else {
    await expect(mobileLandscape).toBeHidden();
  }
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
  await expect(page.locator('[data-journey-bus]')).toHaveCSS('opacity', '1');
  const parkedBus = await page.evaluate(() => {
    const road = document.querySelector<SVGSVGElement>('.journey__roadline')!.getBoundingClientRect();
    const path = document.querySelector<SVGPathElement>('[data-route-path]')!;
    const parkingPoint = path.getPointAtLength(path.getTotalLength());
    const bus = document.querySelector<HTMLElement>('[data-journey-bus]')!.getBoundingClientRect();
    return { horizontalGap: Math.abs(bus.left + bus.width / 2 - (road.left + parkingPoint.x / 500 * road.width)), verticalGap: Math.abs(bus.top + bus.height / 2 - (road.top + parkingPoint.y / 1220 * road.height)) };
  });
  expect(parkedBus.horizontalGap).toBeLessThan(3);
  expect(parkedBus.verticalGap).toBeLessThan(3);
  await expect(page.locator('[data-journey-bus] img')).toHaveAttribute('src', '/images/bus-top-view.webp');
  await expect(page.locator('.journey__compass-art img')).toHaveAttribute('src', '/images/galim-aerial-sheet.webp');
});

test('carries the bus past L’Olleria and the venue illustration into the location card', async ({ page }) => {
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
  await expect(page.locator('[data-journey-bus]')).toHaveCSS('opacity', '1');
  const arrival = await page.evaluate(() => {
    const bus = document.querySelector('[data-journey-bus]')!.getBoundingClientRect();
    const pin = document.querySelector('.journey__arrival-pin')!.getBoundingClientRect();
    const label = document.querySelector('.journey__destination .journey__place')!.getBoundingClientRect();
    return { busBelowPin: bus.top + bus.height / 2 > pin.top + pin.height / 2, labelClearance: label.left - (pin.left + pin.width / 2) };
  });
  expect(arrival.busBelowPin).toBe(true);
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
  await expect(page.locator('.journey__venue-caption')).toContainText('Ací comença la celebració');
  await expect(page.locator('[data-journey-preview] img')).toHaveAttribute('src', '/images/galim-aerial-sheet.webp');
  await expect(page.locator('[data-journey-art-handoff] img')).toHaveAttribute('src', '/images/galim-aerial-sheet.webp');
  await expect(page.locator('[data-journey-art-handoff]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.journey__venue-name')).toHaveText('Jose i Anas t’esperen');
  await expect(page.locator('.journey__venue-name')).toBeVisible();
  await expect(page.locator('[data-journey-preview] img')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-journey-heading]')).toHaveCSS('opacity', '0');

  await scrollThroughHandoff(.75);
  await expect(page.locator('[data-journey-card]')).toHaveClass(/is-journey-visible/);
  await expect(page.locator('[data-journey-art-handoff]')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-card] h3')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-card] .venue-card__art--facade')).toHaveCSS('opacity', '0');

  await scrollThroughHandoff(1);
  await expect(page.locator('[data-journey-card]')).toHaveClass(/is-journey-visible/);
  await expect(page.locator('[data-journey-heading]')).toHaveClass(/is-journey-visible/);
  const headingBounds = (await page.locator('[data-journey-heading]').boundingBox())!;
  expect(headingBounds.y).toBeGreaterThanOrEqual(0);
  expect(headingBounds.y + headingBounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await expect(page.locator('.venue-card__art--aerial')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-card] .venue-card__art--facade')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-journey-card] h3')).toHaveCSS('opacity', '1');
  await expect.poll(() => page.locator('[data-journey-art-handoff]').evaluate((node) => Number(getComputedStyle(node).opacity))).toBeLessThan(.05);
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
  await expect(page.locator('[data-journey-name-handoff]')).toHaveCount(0);
  await expect(page.locator('[data-journey-heading]')).toHaveCSS('opacity', '1');
  await expect(page.locator('.journey__venue-name')).toContainText('Jose i Anas t’esperen');
});

test('returns the finished card from above after the letter leaves the screen', async ({ page }, testInfo) => {
  await page.goto('/');
  const travelingPaper = await page.locator('[data-paper="mini"]').elementHandle();
  await page.evaluate(() => {
    const opening = document.querySelector<HTMLElement>('[data-opening]')!;
    const letter = document.querySelector<HTMLElement>('[data-letter]')!;
    const envelope = document.querySelector<HTMLElement>('[data-envelope]')!;
    const paper = document.querySelector<HTMLElement>('.hero__paper')!;
    const sampleLetter = () => {
      if (opening.classList.contains('opening--approaching')) {
        const letterBounds = letter.getBoundingClientRect();
        if (letterBounds.top >= 0 && letterBounds.bottom < window.innerHeight && letterBounds.bottom + 16 < envelope.getBoundingClientRect().top) {
          opening.dataset.letterShown = 'true';
        }
        if (letterBounds.bottom < 0) opening.dataset.letterExited = 'true';
      }
      if (!opening.hidden) requestAnimationFrame(sampleLetter);
    };
    requestAnimationFrame(sampleLetter);
    new MutationObserver(() => {
      if (!opening.hidden) return;
      opening.dataset.entryPaper = paper.dataset.paper;
      opening.dataset.entryTop = String(paper.getBoundingClientRect().top);
      opening.dataset.entryGrid = getComputedStyle(paper).gridTemplateAreas;
    }).observe(opening, { attributes: true, attributeFilter: ['hidden'] });
  });
  await page.locator('[data-open]').click();
  await expect(page.locator('[data-opening]')).toBeHidden();
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-letter-shown', 'true');
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-letter-exited', 'true');
  await expect(page.locator('[data-opening]')).toHaveAttribute('data-entry-paper', 'full');
  expect(Number(await page.locator('[data-opening]').getAttribute('data-entry-top'))).toBeLessThan(0);
  const entryGrid = await page.locator('[data-opening]').getAttribute('data-entry-grid');
  expect(entryGrid).toContain(testInfo.project.name === 'mobile' ? '"content" "visual" "closing"' : '"content visual"');
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
