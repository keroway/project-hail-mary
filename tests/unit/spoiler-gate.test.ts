import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = join(__dirname, "../../src/pages");

// SpoilerGate の外側に「ロッキー」（第9章以降のネタバレの固有名詞）が
// 露出していないことを .astro ソースから機械的に検知する（#225 の回帰防止）。
//
// biology.astro / math.astro / index.astro / story.astro は、ページ全体の
// 「⚠ ネタバレあり」表示や、SpoilerGateとは別の章連動ロック機構（chapter.ts /
// data-encoded-title）を前提に「ロッキー」の言及を含む箇所があり、この検知対象
// ではない。ここでは #225 で修正した「ネタバレなし前提のページ」だけを対象にする。
const TARGET_PAGES = ["chemistry.astro", "notes.astro"];

function stripSpoilerGateBlocks(source: string): string {
  return source.replace(/<SpoilerGate[^>]*>[\s\S]*?<\/SpoilerGate>/g, "");
}

describe("SpoilerGate外へのロッキー関連ネタバレ露出検知", () => {
  it.each(
    TARGET_PAGES
  )("%s はSpoilerGateの外側に「ロッキー」を含まない", (file) => {
    const source = readFileSync(join(PAGES_DIR, file), "utf-8");
    const outsideGate = stripSpoilerGateBlocks(source);
    expect(outsideGate).not.toContain("ロッキー");
  });
});
