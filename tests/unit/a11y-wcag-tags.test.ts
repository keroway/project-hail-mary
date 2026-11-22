import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// a11y.spec.ts の WCAG_TAGS が WCAG 2.x の A/AA 系タグを取りこぼすと、
// 該当する axe ルールが検査対象から黙って外れる (#392: wcag21a 欠落で
// label-content-name-mismatch が対象外だった)。インストール済み axe-core の
// ルール定義と突き合わせ、A/AA 系タグを持つルールが必ず選択されることを検証する。
const spec = readFileSync(
  join(__dirname, "../playwright/a11y.spec.ts"),
  "utf8"
);
const match = spec.match(/const WCAG_TAGS = \[([^\]]*)\]/);
const wcagTags: string[] = match
  ? [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];

// @axe-core/playwright が実際に解決する axe-core を読む（pnpm の厳格な node_modules 対策）。
const rootRequire = createRequire(join(__dirname, "../../package.json"));
const playwrightRequire = createRequire(
  rootRequire.resolve("@axe-core/playwright")
);
const axe = playwrightRequire("axe-core") as {
  getRules: () => { ruleId: string; tags: string[] }[];
};

const TARGET_LEVEL = /^wcag(2a|2aa|21a|21aa|22a|22aa)$/;

describe("a11y.spec.ts の WCAG_TAGS", () => {
  it("WCAG_TAGS を a11y.spec.ts から読み取れる", () => {
    expect(wcagTags.length).toBeGreaterThan(0);
  });

  it("wcag21a を含む", () => {
    expect(wcagTags).toContain("wcag21a");
  });

  it("A/AA 系タグを持つ axe ルールをすべて選択する", () => {
    const missed = axe
      .getRules()
      .filter((r) => r.tags.some((t) => TARGET_LEVEL.test(t)))
      .filter((r) => !r.tags.some((t) => wcagTags.includes(t)))
      .map((r) => r.ruleId);
    expect(missed).toEqual([]);
  });
});
