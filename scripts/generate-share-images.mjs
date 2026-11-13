import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const origin = process.env.SHARE_PREVIEW_ORIGIN ?? 'http://127.0.0.1:4343';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
});

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });

  try {
    await page.goto(new URL('/', origin).href);
    await page.locator('[data-envelope]').waitFor();
    await page.addStyleTag({ content: `
      .opening__frame, .opening__eyebrow, .opening__names,
      .opening__date, .opening__hint, .opening__skip,
      .opening__sound, .opening__floral, .opening__petals,
      astro-dev-toolbar { display: none !important; }
      .opening {
        background: radial-gradient(ellipse at 50% 43%, #fcfaf2 14%, #f2f0e5 64%, #e4e8dc) !important;
      }
      .opening__content { width: calc(100vw - 3rem) !important; max-width: none !important; }
      .envelope { width: 57rem !important; max-width: calc(100% - 2rem); }
    ` });
    await page.locator('.envelope__seal img').evaluate((image) => image.decode());

    const screenshot = await page.screenshot();
    const thumbnail = await sharp(screenshot).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
    await Promise.all([
      'public/images/invitation-share-ca.jpg',
      'public/images/invitation-share-uk.jpg',
    ].map((file) => writeFile(file, thumbnail)));
  } finally {
    await page.close();
  }
} finally {
  await browser.close();
}
