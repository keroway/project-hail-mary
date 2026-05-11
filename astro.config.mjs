import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hailmary.keroway.com',
  output: 'static',
  build: {
    assets: '_astro',
  },
  integrations: [sitemap()],
});
