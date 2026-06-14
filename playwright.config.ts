import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  fullyParallel: true,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4323",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run build && npm run preview -- --port 4323",
    url: "http://localhost:4323",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
