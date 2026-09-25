import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = join(__dirname, "../../src/pages");

// SpoilerGate の外側に「ロッキー」（第9章以降のネタバレの固有名詞）が
// 露出していないことを .astro ソースから機械的に検知する（#225 の回帰防止）。
//
// index.astro / story.astro は、ページ全体の「⚠ ネタバレあり」表示や、
// SpoilerGateとは別の章連動ロック機構（chapter.ts / data-encoded-title）を
// 前提に「ロッキー」の言及を含む箇所があり、この検知対象ではない。ここでは
// #225 で修正した「ネタバレなし前提のページ」に加え、math.astro（#264 で
// フッターの露出を修正済み）、physics.astro（SpoilerGate 機構のみを使い、
// ゲート外に固有名詞の意図的言及が無いページ）、biology.astro（#278 で
// intro 段落の無条件露出を修正済み。bio03/bio05 の SpoilerGate 内の言及は
// stripSpoilerGateBlocks で除去される）を対象にする。
const TARGET_PAGES = [
  "chemistry.astro",
  "notes.astro",
  "math.astro",
  "physics.astro",
  "biology.astro",
];

function stripSpoilerGateBlocks(source: string): string {
  return source.replace(/<SpoilerGate[^>]*>[\s\S]*?<\/SpoilerGate>/g, "");
}

describe("SpoilerGate外へのロッキー関連ネタバレ露出検知", () => {
  it.each(TARGET_PAGES)(
    "%s はSpoilerGateの外側に「ロッキー」を含まない",
    (file) => {
      const source = readFileSync(join(PAGES_DIR, file), "utf-8");
      const outsideGate = stripSpoilerGateBlocks(source);
      expect(outsideGate).not.toContain("ロッキー");
    }
  );
});

// SpoilerGate の hint/label はロック中も overlay に常時表示されるため、
// 開始タグの属性値自体にネタバレ用語を書けない（#280 の回帰防止）。
const SPOILER_TERMS = ["ロッキー", "タウメーバ"];

function extractSpoilerGateOpenTags(source: string): string[] {
  return source.match(/<SpoilerGate\b[^>]*>/g) ?? [];
}

describe("SpoilerGate開始タグ（hint/label属性）へのネタバレ用語混入検知", () => {
  it.each(TARGET_PAGES)(
    "%s のSpoilerGate開始タグはhint/label属性にネタバレ用語を含まない",
    (file) => {
      const source = readFileSync(join(PAGES_DIR, file), "utf-8");
      const openTags = extractSpoilerGateOpenTags(source);
      expect(openTags.length).toBeGreaterThan(0);
      for (const tag of openTags) {
        for (const term of SPOILER_TERMS) {
          expect(tag).not.toContain(term);
        }
      }
    }
  );
});

// SpoilerGate は id をそのまま外側の div.spoiler-gate にレンダリングするため
// （SpoilerGate.astro）、直下の div.phase に同じ id を重複して付けると
// DOM上に同一idの要素が2つ存在する状態になる（#326 の回帰防止）。
function extractSpoilerGateIdToInnerPhaseId(
  source: string
): Array<{ gateId: string; innerId: string | null }> {
  const blocks =
    source.match(/<SpoilerGate\b[^>]*>[\s\S]*?<\/SpoilerGate>/g) ?? [];
  return blocks.map((block) => {
    const gateIdMatch = block.match(/<SpoilerGate\b[^>]*\bid="([^"]*)"/);
    const innerDivMatch = block.match(/<div\s+class="phase"([^>]*)>/);
    const innerIdMatch = innerDivMatch?.[1]?.match(/\bid="([^"]*)"/);
    return {
      gateId: gateIdMatch?.[1] ?? "",
      innerId: innerIdMatch?.[1] ?? null,
    };
  });
}

describe("SpoilerGate idと内側div.phase idの重複検知", () => {
  it.each(TARGET_PAGES)(
    "%s のSpoilerGate idは内側div.phaseのidと重複しない",
    (file) => {
      const source = readFileSync(join(PAGES_DIR, file), "utf-8");
      const pairs = extractSpoilerGateIdToInnerPhaseId(source);
      for (const { gateId, innerId } of pairs) {
        expect(innerId).not.toBe(gateId);
      }
    }
  );
});
