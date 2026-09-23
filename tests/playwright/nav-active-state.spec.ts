import { expect, test } from "@playwright/test";

test.describe("SPA遷移後のナビ active/aria-current 更新", () => {
  test("ナビリンクをクリックして遷移すると、遷移先のリンクに active/aria-current が付き、遷移元からは外れる", async ({
    page,
  }) => {
    await page.goto("/physics");

    const physicsLink = page.locator('[data-nav-link][href="/physics"]');
    const chemistryLink = page.locator('[data-nav-link][href="/chemistry"]');

    await expect(physicsLink).toHaveClass(/active/);
    await expect(physicsLink).toHaveAttribute("aria-current", "page");
    await expect(chemistryLink).not.toHaveClass(/active/);
    await expect(chemistryLink).not.toHaveAttribute("aria-current", "page");

    await chemistryLink.click();
    await page.waitForURL("**/chemistry");

    await expect(chemistryLink).toHaveClass(/active/);
    await expect(chemistryLink).toHaveAttribute("aria-current", "page");
    await expect(physicsLink).not.toHaveClass(/active/);
    await expect(physicsLink).not.toHaveAttribute("aria-current", "page");
  });
});
