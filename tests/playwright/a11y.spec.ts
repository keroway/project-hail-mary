/**
 * axe-core によるアクセシビリティ検査 (issue #161)
 *
 * 静的に見える範囲 (alt の有無・見出し階層) は起票時点で既に問題が無かった。
 * この検査が狙うのは grep では見えない種類の違反 — とくに color-contrast。
 * 同じワークスペースの keroway/astro-blog では、同じ検査で静的検査に映らない
 * color-contrast (serious) 違反が実際に見つかっている (astro-blog#647)。
 *
 * 除外ルール: **無し。** color-contrast の一時除外は #162 で撤廃した。
 * 理由の無い除外は「検査しているように見えて何も見ていない」状態を作る。
 * astro-blog は color-contrast を除外したまま緑を維持していた期間があり、
 * 除外を撤廃して初めて機能した (astro-blog#647)。除外を追加するときは
 * 必ず理由と「いつ外せるか」を書くこと。
 *
 * ## なぜ検査前にアニメーションを止めるのか (#162)
 *
 * `.scroll-reveal` は opacity を 0 → 1 へ 0.7 秒かけて遷移させ、さらに
 * `:nth-child` で最大 0.4 秒ずらして開始する。`main` が可視になった直後に
 * 解析すると、**まだ透けている途中の文字**を axe が測ってしまう。
 * 半透明の文字は背景と混ざった色として読まれるため、確定状態では十分な
 * コントラストがある要素まで違反として報告される。
 *
 * 実測 (2026-08-11, 7 ページ):
 *
 * | 解析タイミング | color-contrast 違反ノード |
 * |---|---|
 * | `main` 可視直後 (遷移の途中) | **65** |
 * | 遷移を止めて確定状態 | **2** |
 *
 * つまり 65 件のうち 63 件は**測定タイミングの産物**で、デザインの欠陥では
 * なかった。これを真に受けて 63 箇所の配色を変えていたら、必要のない
 * 改変でデザインを壊した上、本物の 2 件は埋もれていた。
 *
 * WCAG 1.4.3 が求めるのは**確定した表示状態**のコントラストであり、
 * フェードイン中の途中経過ではない。そこで解析前に遷移とアニメーションを
 * 止め、`.scroll-reveal` を最終状態へ固定する。
 *
 * **これは「違反を隠す」処理ではない。** 静的に指定された `opacity`
 * (例: 撤廃前の `.act-header--spoiler .act-range { opacity: 0.7 }`) は
 * 確定状態でもそのまま残るため、引き続き検出される。実際にこの処理を
 * 入れた状態で本物の違反 2 件が残り、それが #162 の修正対象になった。
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// WCAG 2.2 AA は 2.0/2.1/2.2 の A・AA 基準の累積。wcag21a を欠くと
// label-content-name-mismatch (WCAG 2.5.3) が検査対象外になる (#392)。
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const STORAGE_KEY = "hailmary-chapter";

/**
 * 第25章で全SpoilerGateが解放される（chapter.ts の MAX_CHAPTER=30）。
 * ここを設定しないと <template> 内の本文がDOMに展開されず、axeの検査対象から
 * 漏れたまま緑を維持してしまう (#204)。
 */
const FULL_UNLOCK_CHAPTER = 30;

/**
 * 遷移・アニメーションを止め、スクロール連動の表示を最終状態へ固定する。
 * 上の「なぜ検査前にアニメーションを止めるのか」を参照。
 */
const SETTLE_STYLE = [
  "*, *::before, *::after { transition: none !important; animation: none !important; }",
  ".scroll-reveal { opacity: 1 !important; transform: none !important; }",
].join("\n");

async function expectNoA11yViolations(
  page: import("@playwright/test").Page,
  path: string,
  chapter: number,
  options: {
    openPanel?: boolean;
    /** 追加で localStorage に保存する値 (例: 初回訪問フラグの解除) */
    storage?: Record<string, string>;
    /** main 描画後・解析前に検査状態を整え、その状態を assert する */
    prepare?: (page: import("@playwright/test").Page) => Promise<void>;
  } = {}
) {
  await page.addInitScript(
    ({ key, value, extra }) => {
      window.localStorage.setItem(key, String(value));
      for (const [k, v] of Object.entries(extra)) {
        window.localStorage.setItem(k, v);
      }
    },
    { key: STORAGE_KEY, value: chapter, extra: options.storage ?? {} }
  );
  await page.goto(path);
  // main が描画されるまで待つ。描画途中で解析すると偽陰性になりうる。
  await expect(page.locator("main")).toBeVisible();

  await options.prepare?.(page);

  // 表示設定パネルは hidden 属性で閉じているため、開かないと axe の検査対象外になる (#390)。
  if (options.openPanel) {
    await page.locator("#accessibility-toggle").click();
    await expect(page.locator("#accessibility-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await expect(page.locator("#accessibility-panel")).toBeVisible();
  }

  await page.addStyleTag({ content: SETTLE_STYLE });
  // スタイル適用が反映されてから解析する。
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = document.querySelector(".scroll-reveal");
        return el ? getComputedStyle(el).opacity : "1";
      })
    )
    .toBe("1");

  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  // 失敗時に「どのルールがどの要素で落ちたか」が出るようにしてから比較する。
  // 件数だけを assert すると、落ちた理由を CI ログから追えない。
  // color-contrast は前景色・背景色・比率まで出す（配色の話は数値が無いと直せない）。
  const summary = violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => {
      const target = n.target.join(" ");
      const data = (n.any?.[0]?.data ?? {}) as {
        fgColor?: string;
        bgColor?: string;
        contrastRatio?: number;
      };
      return data.contrastRatio === undefined
        ? target
        : `${target} (fg=${data.fgColor} bg=${data.bgColor} ratio=${data.contrastRatio})`;
    }),
  }));

  expect(summary).toEqual([]);
}

/**
 * 検査する viewport。デスクトップ (Playwright 既定) に加え、スマートフォン幅でのみ
 * 現れるレイアウト・操作部品の違反を拾うために 375x667 (iPhone SE 相当) を追加する (#346)。
 */
const VIEWPORTS = [
  { label: "", size: null },
  { label: "モバイル幅・", size: { width: 375, height: 667 } },
] as const;

for (const { label, size } of VIEWPORTS) {
  test.describe(label ? "モバイル幅" : "デスクトップ幅", () => {
    if (size) test.use({ viewport: size });

    for (const { path } of PAGES) {
      test(`${path} ページに WCAG 2.2 AA の違反が無い（${label}未読了・ロック状態）`, async ({
        page,
      }) => {
        await expectNoA11yViolations(page, path, 0);
      });

      // ロック画面のUIだけでなく、SpoilerGateの <template> 内に置かれた解説本文
      // （実際の閲覧者の大半が目にするコンテンツ）も検査対象に含める (#204)。
      test(`${path} ページに WCAG 2.2 AA の違反が無い（${label}ネタバレ全解放後）`, async ({
        page,
      }) => {
        await expectNoA11yViolations(page, path, FULL_UNLOCK_CHAPTER);
      });
    }

    // 表示設定パネルを開いた状態 (全ページ共通UI) を検査する (#390)。
    test(`表示設定パネルを開いた状態に WCAG 2.2 AA の違反が無い（${label}物理ページ）`, async ({
      page,
    }) => {
      await expectNoA11yViolations(page, "/physics", 0, { openPanel: true });
    });

    // トップページは初回訪問で章設定ダイアログが自動表示される。ダイアログ表示中・
    // 閉じた直後のガイド表示・ガイドも閉じた通常表示を明示的に分けて検査する (#395)。
    test(`トップページの章設定ダイアログ表示中に WCAG 2.2 AA の違反が無い（${label}初回訪問）`, async ({
      page,
    }) => {
      await expectNoA11yViolations(page, "/", 0, {
        prepare: async (p) => {
          await expect(p.locator("#chapter-dialog")).toBeVisible();
        },
      });
    });

    test(`トップページのオンボーディングガイド表示に WCAG 2.2 AA の違反が無い（${label}ダイアログを閉じた後）`, async ({
      page,
    }) => {
      await expectNoA11yViolations(page, "/", 0, {
        prepare: async (p) => {
          await expect(p.locator("#chapter-dialog")).toBeVisible();
          await p.locator("#cd-confirm").click();
          await expect(p.locator("#chapter-dialog")).toBeHidden();
          await expect(p.locator("#onboarding-guide")).toBeVisible();
        },
      });
    });

    test(`トップページの通常表示に WCAG 2.2 AA の違反が無い（${label}オンボーディング済み）`, async ({
      page,
    }) => {
      await expectNoA11yViolations(page, "/", FULL_UNLOCK_CHAPTER, {
        storage: { "hailmary-onboarded": "true" },
        prepare: async (p) => {
          await expect(p.locator("#chapter-dialog")).toBeHidden();
          await expect(p.locator("#onboarding-guide")).toBeHidden();
        },
      });
    });
  });
}

// カスタム404ページはsmoke.spec.tsで表示確認のみ行われ、axe検査の対象外だった (#217)。
// SpoilerGateが無いため状態は1つでよい。404であることも合わせてassertし、
// カスタム404の実体を検査していることを明示する。
test("/this-page-does-not-exist-xyz ページ（カスタム404）に WCAG 2.2 AA の違反が無い", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.locator("main")).toBeVisible();

  await page.addStyleTag({ content: SETTLE_STYLE });
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = document.querySelector(".scroll-reveal");
        return el ? getComputedStyle(el).opacity : "1";
      })
    )
    .toBe("1");

  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();

  const summary = violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => {
      const target = n.target.join(" ");
      const data = (n.any?.[0]?.data ?? {}) as {
        fgColor?: string;
        bgColor?: string;
        contrastRatio?: number;
      };
      return data.contrastRatio === undefined
        ? target
        : `${target} (fg=${data.fgColor} bg=${data.bgColor} ratio=${data.contrastRatio})`;
    }),
  }));

  expect(summary).toEqual([]);
});
