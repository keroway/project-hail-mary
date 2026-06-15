import { defineConfig, devices } from "@playwright/test";

const PORT = parseInt(process.env.PORT ?? "4323", 10);

export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // In CI, dist is pre-built and downloaded as an artifact; skip rebuild.
    command: process.env.CI
      ? `npm run preview -- --port ${PORT}`
      : `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
