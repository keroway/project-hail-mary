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

test.describe("SpoilerGate: 読了章に応じたネタバレロックの開閉", () => {
  test("未読了（章0）では第9章以降のゲートがロックされている", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/physics");

    const gate = page.locator("#phase05");
    await expect(gate).not.toHaveClass(/is-unlocked/);
    await expect(gate.locator(".spoiler-gate-overlay")).toBeVisible();
  });

  test("第9章まで読了するとminChapter=9のゲートが解放される", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/physics");

    const gate = page.locator("#phase05");
    await expect(gate).toHaveClass(/is-unlocked/);
    await expect(gate.locator(".spoiler-gate-overlay")).toBeHidden();

    // minChapter=25 の別ゲートはまだロックされたまま
    const laterGate = page.locator("#phase06");
    await expect(laterGate).not.toHaveClass(/is-unlocked/);
  });

  test("第25章まで読了すると全ゲートが解放される", async ({ page }) => {
    await setChapter(page, 25);
    await page.goto("/physics");

    await expect(page.locator("#phase05")).toHaveClass(/is-unlocked/);
    await expect(page.locator("#phase06")).toHaveClass(/is-unlocked/);
  });

  test("未読了（章0）ではstoryページのminChapter=9タイムラインリンクが無効化されている", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/story");

    const lockedItem = page.locator(
      '.timeline-item[href="/physics#phase05"], .timeline-item[data-original-href="/physics#phase05"]'
    );
    await expect(lockedItem).toHaveClass(/is-locked/);
    await expect(lockedItem).toHaveAttribute("aria-disabled", "true");
  });

  test("第9章まで読了するとstoryページのminChapter=9タイムラインリンクが有効化される", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/story");

    const unlockedItem = page.locator(
      '.timeline-item[href="/physics#phase05"]'
    );
    await expect(unlockedItem).not.toHaveClass(/is-locked/);
    await expect(unlockedItem).not.toHaveAttribute("aria-disabled", "true");

    // decodeB64() によりプレースホルダーが実際のタイトル/メタに差し替わる
    await expect(unlockedItem.locator(".tl-title")).toHaveText(
      "ロッキーとの会話 — 音波と周波数"
    );
    await expect(unlockedItem.locator(".tl-meta")).toHaveText(
      "波 / 周波数 / 音の情報伝達"
    );
  });
});
