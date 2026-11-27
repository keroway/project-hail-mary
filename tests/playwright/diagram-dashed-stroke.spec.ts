import { expect, test } from "@playwright/test";

// orbit（physics / math）と pendulum（physics）の補助破線は diagram-dashed を使う。
// stroke が none や未指定のままだと描画されないため、computed style で検証する。
const PAGES = [
  { path: "/physics", minCount: 2 },
  { path: "/math", minCount: 1 },
];

for (const { path, minCount } of PAGES) {
  test(`${path}: diagram-dashed の computed stroke が none でない`, async ({
    page,
  }) => {
    await page.goto(path);

    const dashed = page.locator(".diagram-dashed");
    expect(await dashed.count()).toBeGreaterThanOrEqual(minCount);

    const strokes = await dashed.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).stroke)
    );
    for (const stroke of strokes) {
      expect(stroke).not.toBe("none");
      expect(stroke).toMatch(/^rgb/);
    }
  });
}
