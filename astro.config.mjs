import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  i18n: { defaultLocale: 'es', locales: ['es', 'uk'], routing: { prefixDefaultLocale: false } },
});
