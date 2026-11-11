import { expect, test } from '@playwright/test';

test('keeps the opened flap behind the letter and the envelope front ahead of it', async ({ page }, testInfo) => {
  await page.goto('/');
  const layers = () => page.evaluate(() => {
    const z = (selector: string) => Number(getComputedStyle(document.querySelector(selector)!).zIndex);
    return {
      back: z('.envelope__back'),
      letter: z('[data-letter]'),
      front: z('[data-envelope-front]'),
      flap: z('[data-flap]'),
    };
  });
  await expect.poll(layers).toEqual({ back: 1, letter: 2, front: 3, flap: 3 });

  await page.evaluate(() => {
    const opening = document.querySelector<HTMLElement>('[data-opening]')!;
    const envelope = document.querySelector<HTMLElement>('[data-envelope]')!;
    const letter = document.querySelector<HTMLElement>('[data-letter]')!;
    const flap = document.querySelector<HTMLElement>('[data-flap]')!;
    const initialOffset = letter.getBoundingClientRect().top - envelope.getBoundingClientRect().top;
    const sample = () => {
      const offset = letter.getBoundingClientRect().top - envelope.getBoundingClientRect().top;
      if (initialOffset - offset > 1 && (getComputedStyle(flap).zIndex === '3' || !flap.classList.contains('envelope__lid--open'))) {
        opening.dataset.earlyRise = 'true';
      }
      if (!opening.classList.contains('opening--approaching')) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.locator('[data-open]').click();
  await page.waitForFunction(() => {
    const flap = document.querySelector<HTMLElement>('[data-flap]')!;
    const letter = document.querySelector<HTMLElement>('[data-letter]')!;
    const envelope = document.querySelector<HTMLElement>('[data-envelope]')!;
    return envelope.contains(letter)
      && new DOMMatrixReadOnly(getComputedStyle(flap).transform).m22 < -.4
      && getComputedStyle(flap).zIndex === '1';
  });
  expect(await layers()).toEqual({ back: 1, letter: 2, front: 3, flap: 1 });
  await expect(page.locator('.envelope__flap')).toHaveCSS('backface-visibility', 'visible');
  await expect(page.locator('[data-open]')).toHaveCSS('visibility', 'hidden');
  await expect(page.locator('.opening__names')).toHaveCSS('opacity', '0');
  await expect(page.locator('.opening__date')).toHaveCSS('opacity', '0');
  await page.screenshot({ path: `/tmp/wedding-letter-layer-${testInfo.project.name}-opened.png` });
  await expect(page.locator('[data-opening]')).toHaveClass(/opening--approaching/);
  await expect(page.locator('[data-opening]')).not.toHaveAttribute('data-early-rise', 'true');
  await expect(page.locator('[data-letter]')).toHaveCSS('clip-path', 'none');
  await expect(page.locator('[data-envelope-front]')).toHaveCSS('z-index', '8');
  await expect(page.locator('[data-letter]')).toHaveCSS('z-index', '7');
  await expect.poll(() => page.evaluate(() => {
    const envelope = document.querySelector<HTMLElement>('[data-envelope]')!.getBoundingClientRect();
    const front = document.querySelector<HTMLElement>('[data-envelope-front]')!.getBoundingClientRect();
    return Math.max(
      Math.abs(front.left - envelope.left), Math.abs(front.top - envelope.top),
      Math.abs(front.width - envelope.width), Math.abs(front.height - envelope.height),
    );
  }), { intervals: [50, 100] }).toBeLessThan(2);
});
