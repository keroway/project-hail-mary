import { expect, test } from "@playwright/test";

const ONBOARDED_KEY = "hailmary-onboarded";
const SESSION_DIALOG_KEY = "hailmary-dialog-shown";

test.describe("初回訪問オンボーディング", () => {
  test("初回訪問時は章設定ダイアログが自動的に開く", async ({ page }) => {
    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));

    await page.goto("/");

    await expect(page.locator("#chapter-dialog")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("sessionStorageへのアクセスが失敗しても例外を投げず、ダイアログは自動的に開く(#260)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const proto = Object.getPrototypeOf(window.sessionStorage);
      proto.getItem = () => {
        throw new DOMException("SecurityError");
      };
      proto.setItem = () => {
        throw new DOMException("SecurityError");
      };
    });

    const errors: Error[] = [];
    page.on("pageerror", (err) => errors.push(err));

    await page.goto("/");

    await expect(page.locator("#chapter-dialog")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("2回目以降の訪問(localStorageに既読フラグあり)ではダイアログは自動的に開かない", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key }) => {
        window.localStorage.setItem(key, "true");
      },
      { key: ONBOARDED_KEY }
    );

    await page.goto("/");

    await expect(page.locator("#chapter-dialog")).not.toBeVisible();
  });

  test("同一セッション内で既にダイアログ表示済みなら再訪問時はガイドのみ表示する", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key }) => {
        window.sessionStorage.setItem(key, "true");
      },
      { key: SESSION_DIALOG_KEY }
    );

    await page.goto("/");

    await expect(page.locator("#chapter-dialog")).not.toBeVisible();
    await expect(page.locator("#onboarding-guide")).toBeVisible();
  });
});
