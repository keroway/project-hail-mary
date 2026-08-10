/**
 * axe-core によるアクセシビリティ検査 (issue #161)
 *
 * 静的に見える範囲 (alt の有無・見出し階層) は起票時点で既に問題が無かった。
 * この検査が狙うのは grep では見えない種類の違反 — とくに color-contrast。
 * 同じワークスペースの keroway/astro-blog では、同じ検査で静的検査に映らない
 * color-contrast (serious) 違反が実際に見つかっている (astro-blog#647)。
 *
 * 除外ルール:
 *   - color-contrast: 検査を入れた時点で **7 ページ中 6 ページ・計 53 ノード**の
 *     serious 違反が既に存在した (issue #162)。「検査を入れること」と
 *     「出た違反を直すこと」は別スコープ (issue #161 の STOP 条件) のため、
 *     ここでは一時的に除外する。
 *     **外す条件: #162 が解決したら、この行を削除して再実行する。**
 *
 * 理由の無い除外は「検査しているように見えて何も見ていない」状態を作る。
 * astro-blog は color-contrast を除外したまま緑を維持していた期間があり、
 * 除外を撤廃して初めて機能した (astro-blog#647)。除外を追加するときは
 * 必ず理由と「いつ外せるか」を書くこと。
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// smoke.spec.ts と同じ対象。増減させるときは両方を合わせる。
const PAGES = [
  { path: "/" },
  { path: "/story" },
  { path: "/physics" },
  { path: "/chemistry" },
  { path: "/biology" },
  { path: "/math" },
  { path: "/notes" },
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

// 上のコメントの「除外ルール」節に理由と撤廃条件を書くこと。空にするのが目標。
const EXCLUDED_RULES = ["color-contrast"];

for (const { path } of PAGES) {
  test(`${path} ページに WCAG 2.2 AA の違反が無い`, async ({ page }) => {
    await page.goto(path);
    // main が描画されるまで待つ。描画途中で解析すると偽陰性になりうる。
    await expect(page.locator("main")).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .disableRules(EXCLUDED_RULES)
      .analyze();

    // 失敗時に「どのルールがどの要素で落ちたか」が出るようにしてから比較する。
    // 件数だけを assert すると、落ちた理由を CI ログから追えない。
    const summary = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));

    expect(summary).toEqual([]);
  });
}
