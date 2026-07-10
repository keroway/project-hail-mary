import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://hailmary.keroway.com",
  output: "static",
  compressHTML: true,
  build: {
    assets: "_astro",
  },
  integrations: [sitemap()],
});
