import { expect, test } from "@playwright/test";

const STORAGE_KEY = "hailmary-chapter";

async function setChapter(
  page: import("@playwright/test").Page,
  chapter: number
) {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, String(value));
    },
    { key: STORAGE_KEY, value: chapter }
  );
}

test.describe("decorateExternalLinks: 外部リンクの新規タブ予告（WCAG 3.2.5）", () => {
  test("初回ロード時、外部リンク(target=_blank)にsr-onlyの新規タブ予告が付与される", async ({
    page,
  }) => {
    await page.goto("/physics");

    const link = page.locator(
      'a.link-item[href="https://www.youtube.com/watch?v=Pj2N9bYqCv0"]'
    );
    await expect(link.locator(".sr-only")).toHaveText("（新しいタブで開く）");
    await expect(link).toHaveAttribute("data-ext-decorated", "true");
  });

  test("読了章の変更を複数回発火しても新規タブ予告が重複付与されない", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/physics");

    const link = page.locator(
      'a.link-item[href="https://www.youtube.com/watch?v=Pj2N9bYqCv0"]'
    );
    await expect(link.locator(".sr-only")).toHaveCount(1);

    for (let i = 0; i < 3; i++) {
      await page.evaluate((key) => {
        window.dispatchEvent(new StorageEvent("storage", { key }));
      }, STORAGE_KEY);
    }

    await expect(link.locator(".sr-only")).toHaveCount(1);
  });

  test("ネタバレ解放で動的挿入された外部リンクにも新規タブ予告が付与される", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/physics");

    const gatedLink = page.locator(
      'a.link-item[href="https://www.youtube.com/watch?v=X2io3H2h-A0"]'
    );
    await expect(gatedLink).toHaveCount(0);

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "9");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    await expect(gatedLink.locator(".sr-only")).toHaveText(
      "（新しいタブで開く）"
    );
    await expect(gatedLink).toHaveAttribute("data-ext-decorated", "true");
  });
});
