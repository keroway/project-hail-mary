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

  test("図の文字サイズを「大きめ」に切り替えると data-diagram-scale が反映され、aria-pressed が更新される", async ({
    page,
  }) => {
    await page.goto("/physics");

    await page.locator("#accessibility-toggle").click();
    const largeButton = page.locator(
      '[data-ui-setting="diagramScale"][data-ui-value="large"]'
    );
    await largeButton.click();

    await expect(page.locator("html")).toHaveAttribute(
      "data-diagram-scale",
      "large"
    );
    await expect(largeButton).toHaveAttribute("aria-pressed", "true");

    const defaultButton = page.locator(
      '[data-ui-setting="diagramScale"][data-ui-value="default"]'
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

  test("localStorageへの書き込みが失敗しても当該セッション内の表示設定は反映される", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const proto = Object.getPrototypeOf(window.localStorage);
      proto.setItem = () => {
        throw new DOMException("QuotaExceededError");
      };
    });
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

  test.describe("head の FOUC防止スクリプト単体の先行適用（末尾スクリプトをブロックして検証、#198）", () => {
    async function blockTailModuleScript(
      page: import("@playwright/test").Page
    ) {
      await page.route(
        "**/_astro/BaseLayout.astro_astro_type_script_index_0_lang*.js",
        (route) => route.abort()
      );
    }

    test("localStorageの設定値がhead側スクリプト単体でdata-*属性へ先行適用される", async ({
      page,
    }) => {
      await page.addInitScript(
        ({ key, value }) => {
          window.localStorage.setItem(key, value);
        },
        {
          key: STORAGE_KEY,
          value: JSON.stringify({
            fontScale: "xlarge",
            diagramScale: "large",
            contrast: "high",
            motion: "reduced",
            motionSource: "explicit",
          }),
        }
      );
      await blockTailModuleScript(page);

      await page.goto("/physics");

      const html = page.locator("html");
      await expect(html).toHaveAttribute("data-font-scale", "xlarge");
      await expect(html).toHaveAttribute("data-diagram-scale", "large");
      await expect(html).toHaveAttribute("data-contrast", "high");
      await expect(html).toHaveAttribute("data-motion", "reduced");
    });

    test("破損したlocalStorageデータでもhead側スクリプト単体で例外を投げずdata-*属性を付与しない", async ({
      page,
    }) => {
      await page.addInitScript((key) => {
        window.localStorage.setItem(key, "{not valid json");
      }, STORAGE_KEY);
      await blockTailModuleScript(page);

      await page.goto("/physics");

      const html = page.locator("html");
      await expect(html).not.toHaveAttribute("data-font-scale");
      await expect(html).not.toHaveAttribute("data-diagram-scale");
      await expect(html).not.toHaveAttribute("data-contrast");
      await expect(html).not.toHaveAttribute("data-motion");
    });

    test("motionが未設定の場合、head側スクリプト単体でも prefers-reduced-motion に従って先行適用される", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await blockTailModuleScript(page);

      await page.goto("/physics");

      await expect(page.locator("html")).toHaveAttribute(
        "data-motion",
        "reduced"
      );
    });
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
