import { expect, test } from "@playwright/test";

const STORAGE_KEY = "hailmary-ui-prefs";

test.describe("表示設定パネル: 開閉・トグル操作・localStorage 永続化", () => {
  test("初期状態ではパネルは閉じており、トグルボタンで開閉できる", async ({
    page,
  }) => {
    await page.goto("/physics");

    const toggle = page.locator("#accessibility-toggle");
    const panel = page.locator("#accessibility-panel");

    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(panel).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(panel).toBeHidden();
  });

  test("パネルを開くと最初のオプションボタンへフォーカスが移る（WCAG 2.4.3）", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();

    const firstOption = page
      .locator("#accessibility-panel [data-ui-setting][data-ui-value]")
      .first();
    await expect(firstOption).toBeFocused();
  });

  test("Escape キーでパネルを閉じ、トグルボタンへフォーカスが戻る", async ({
    page,
  }) => {
    await page.goto("/physics");

    const toggle = page.locator("#accessibility-toggle");
    await toggle.click();
    await expect(page.locator("#accessibility-panel")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(page.locator("#accessibility-panel")).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
  });

  test("パネル外をクリックすると閉じる", async ({ page }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    await expect(page.locator("#accessibility-panel")).toBeVisible();

    await page.locator("body").click({ position: { x: 5, y: 5 } });

    await expect(page.locator("#accessibility-panel")).toBeHidden();
  });

  test("文字サイズを「特大」に切り替えると data-font-scale が反映され、aria-pressed が更新される", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    const xlargeButton = page.locator(
      '[data-ui-setting="fontScale"][data-ui-value="xlarge"]'
    );
    await xlargeButton.click();

    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "xlarge"
    );
    await expect(xlargeButton).toHaveAttribute("aria-pressed", "true");

    const defaultButton = page.locator(
      '[data-ui-setting="fontScale"][data-ui-value="default"]'
    );
    await expect(defaultButton).toHaveAttribute("aria-pressed", "false");
  });

  test("設定はlocalStorageに保存され、リロード後も復元される", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    await page
      .locator('[data-ui-setting="contrast"][data-ui-value="high"]')
      .click();

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY
    );
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? "{}")).toMatchObject({ contrast: "high" });

    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-contrast", "high");
    await page.locator("#accessibility-toggle").click();
    await expect(
      page.locator('[data-ui-setting="contrast"][data-ui-value="high"]')
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("破損したlocalStorageデータでもデフォルト設定にフォールバックする", async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, "{not valid json");
    }, STORAGE_KEY);
    await page.goto("/physics");

    await expect(page.locator("html")).not.toHaveAttribute("data-font-scale");
    await expect(page.locator("html")).not.toHaveAttribute("data-contrast");

    await page.locator("#accessibility-toggle").click();
    await expect(
      page.locator('[data-ui-setting="fontScale"][data-ui-value="default"]')
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("動きを「少なめ」へ明示的に切り替えるとmotionSourceがexplicitとして保存される", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    await page
      .locator('[data-ui-setting="motion"][data-ui-value="reduced"]')
      .click();

    await expect(page.locator("html")).toHaveAttribute(
      "data-motion",
      "reduced"
    );

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      STORAGE_KEY
    );
    expect(JSON.parse(stored ?? "{}")).toMatchObject({
      motion: "reduced",
      motionSource: "explicit",
    });
  });

  test("動きを「通常」に戻すとdata-motion属性が外れる", async ({ page }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    await page
      .locator('[data-ui-setting="motion"][data-ui-value="reduced"]')
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-motion",
      "reduced"
    );

    await page
      .locator('[data-ui-setting="motion"][data-ui-value="default"]')
      .click();
    await expect(page.locator("html")).not.toHaveAttribute("data-motion");
  });

  test("ページ遷移後もパネルの構造とツールバーが保持される（transition:persist）", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    await page
      .locator('[data-ui-setting="fontScale"][data-ui-value="large"]')
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "large"
    );

    await page.locator('[data-nav-link][href="/chemistry"]').click();
    await page.waitForURL("**/chemistry");

    await expect(page.locator("html")).toHaveAttribute(
      "data-font-scale",
      "large"
    );
    await expect(page.locator("#accessibility-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
