import { test } from '@playwright/test';

test('captures the visible letter over the envelope', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.locator('[data-open]').click();
  await page.waitForTimeout(1260);
  await page.screenshot({ path: `/tmp/wedding-letter-layer-${testInfo.project.name}-start.png` });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `/tmp/wedding-letter-layer-${testInfo.project.name}-middle.png` });
});
