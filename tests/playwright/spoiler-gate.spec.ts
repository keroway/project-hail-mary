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

  test("未読了（章0）ではstoryページのACT3見出しが「???」でロッキーを露出しない（#272）", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/story");

    const act3Title = page.locator("#act3 .act-title");
    await expect(act3Title).toHaveText("???");
    await expect(act3Title).not.toContainText("ロッキー");
  });

  test("第9章まで読了するとstoryページのACT3見出しが解放される（#272）", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/story");

    const act3Title = page.locator("#act3 .act-title");
    await expect(act3Title).toHaveText("ロッキーとの出会い");
  });

  test("第9章解放後に読了章を0へ戻すとstoryページのACT3見出しもプレースホルダーへ戻る（#272）", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/story");

    const act3Title = page.locator("#act3 .act-title");
    await expect(act3Title).toHaveText("ロッキーとの出会い");

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    await expect(act3Title).toHaveText("???");
  });

  test("第9章解放後に読了章を0へ戻すと復号済みタイトル・メタ情報もプレースホルダーへ戻る（#243）", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/story");

    const item = page.locator('.timeline-item[href="/physics#phase05"]');
    await expect(item).not.toHaveClass(/is-locked/);
    await expect(item.locator(".tl-title")).toHaveText(
      "ロッキーとの会話 — 音波と周波数"
    );

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    const lockedItem = page.locator(
      '.timeline-item[data-original-href="/physics#phase05"]'
    );
    await expect(lockedItem).toHaveClass(/is-locked/);
    await expect(lockedItem).toHaveAttribute("aria-disabled", "true");
    await expect(lockedItem.locator(".tl-title")).toHaveText("???");
    await expect(lockedItem.locator(".tl-meta")).toHaveText("第9章以降に解放");
  });

  test("未読了（章0）ではstoryページのACT4見出しが「???」で終盤の決断を露出しない（#274）", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/story");

    const act4Title = page.locator("#act4 .act-title");
    await expect(act4Title).toHaveText("???");
    await expect(act4Title).not.toContainText("終盤の決断");
  });

  test("第9章まで読了してもstoryページのACT4見出しはロックされたまま（#274）", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/story");

    const act4Title = page.locator("#act4 .act-title");
    await expect(act4Title).toHaveText("???");
  });

  test("第25章まで読了するとstoryページのACT4見出しが解放される（#274）", async ({
    page,
  }) => {
    await setChapter(page, 25);
    await page.goto("/story");

    const act4Title = page.locator("#act4 .act-title");
    await expect(act4Title).toHaveText("終盤の決断");
  });

  test("第25章解放後に読了章を0へ戻すとstoryページのACT4見出しもプレースホルダーへ戻る（#274）", async ({
    page,
  }) => {
    await setChapter(page, 25);
    await page.goto("/story");

    const act4Title = page.locator("#act4 .act-title");
    await expect(act4Title).toHaveText("終盤の決断");

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    await expect(act4Title).toHaveText("???");
  });

  test("未読了（章0）ではstoryページのminChapter=25タイムラインリンクが無効化されている（#274）", async ({
    page,
  }) => {
    await setChapter(page, 0);
    await page.goto("/story");

    const lockedPhysics = page.locator(
      '.timeline-item[data-original-href="/physics#phase06"], .timeline-item[href="/physics#phase06"]'
    );
    await expect(lockedPhysics).toHaveClass(/is-locked/);
    await expect(lockedPhysics).toHaveAttribute("aria-disabled", "true");

    const lockedBiology = page.locator(
      '.timeline-item[data-original-href="/biology#bio05"], .timeline-item[href="/biology#bio05"]'
    );
    await expect(lockedBiology).toHaveClass(/is-locked/);
    await expect(lockedBiology).toHaveAttribute("aria-disabled", "true");
  });

  test("第25章まで読了するとstoryページのminChapter=25タイムラインリンクが有効化される（#274）", async ({
    page,
  }) => {
    await setChapter(page, 25);
    await page.goto("/story");

    const unlockedPhysics = page.locator(
      '.timeline-item[href="/physics#phase06"]'
    );
    await expect(unlockedPhysics).not.toHaveClass(/is-locked/);
    await expect(unlockedPhysics).not.toHaveAttribute("aria-disabled", "true");
    await expect(unlockedPhysics.locator(".tl-title")).toHaveText(
      "宇宙旅行と相対性理論"
    );

    const unlockedBiology = page.locator(
      '.timeline-item[href="/biology#bio05"]'
    );
    await expect(unlockedBiology).not.toHaveClass(/is-locked/);
    await expect(unlockedBiology).not.toHaveAttribute("aria-disabled", "true");
    await expect(unlockedBiology.locator(".tl-title")).toHaveText(
      "タウメーバの進化獲得——グレースが仕掛けた「進化実験」"
    );
  });

  test("第25章解放後に読了章を0へ戻すとACT4タイムラインリンクの復号済みタイトルもプレースホルダーへ戻る（#274）", async ({
    page,
  }) => {
    await setChapter(page, 25);
    await page.goto("/story");

    const item = page.locator('.timeline-item[href="/physics#phase06"]');
    await expect(item).not.toHaveClass(/is-locked/);
    await expect(item.locator(".tl-title")).toHaveText("宇宙旅行と相対性理論");

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    const lockedItem = page.locator(
      '.timeline-item[data-original-href="/physics#phase06"]'
    );
    await expect(lockedItem).toHaveClass(/is-locked/);
    await expect(lockedItem).toHaveAttribute("aria-disabled", "true");
    await expect(lockedItem.locator(".tl-title")).toHaveText("???");
    await expect(lockedItem.locator(".tl-meta")).toHaveText("第25章以降に解放");
  });

  test("別タブ相当のstorageイベントでトップの読了章バー・設定欄・ナビが同期する（#266）", async ({
    page,
  }) => {
    await setChapter(page, 9);
    await page.goto("/");

    await expect(page.locator("#cc-text")).toHaveText("第9章まで");
    await expect(page.locator("#nav-chapter-status")).toHaveText("第9章まで");

    await page.evaluate((key) => {
      window.localStorage.setItem(key, "0");
      window.dispatchEvent(new StorageEvent("storage", { key }));
    }, STORAGE_KEY);

    await expect(page.locator("#cc-text")).toHaveText("まだ読んでいない");
    await expect(page.locator("#nav-chapter-status")).toHaveText("未読");
    await expect(page.locator("#chapter-range")).toHaveValue("0");
    await expect(page.locator("#chapter-number")).toHaveValue("0");
    await expect(page.locator("#cs-status-text")).toHaveText(
      "まだ読んでいません（ネタバレなし）"
    );
  });
});
