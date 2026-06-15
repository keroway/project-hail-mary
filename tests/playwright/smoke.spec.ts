import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/" },
  { path: "/story" },
  { path: "/physics" },
  { path: "/chemistry" },
  { path: "/biology" },
  { path: "/math" },
  { path: "/notes" },
];

for (const { path } of PAGES) {
  test(`${path} ページが正常に表示される`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("/404 ページがカスタム 404 コンテンツを表示する", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    // 404 ステータス自体が引き起こすネットワークエラーは想定内なので除外する
    if (msg.type() === "error" && !msg.text().includes("404")) {
      errors.push(msg.text());
    }
  });

  const response = await page.goto("/this-page-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.locator("main")).toBeVisible();
  expect(errors).toEqual([]);
});
