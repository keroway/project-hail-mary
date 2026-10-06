import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGES_DIR = join(__dirname, "../../src/pages");

function read(file: string): string {
  return readFileSync(join(PAGES_DIR, file), "utf-8");
}

// story.astro の timeline-item リンクを { href, minChapter } に抽出する。
function extractStoryLinks(source: string) {
  const links: { page: string; id: string; minChapter: number | null }[] = [];
  for (const m of source.matchAll(/<a class="timeline-item"[^>]*>/g)) {
    const tag = m[0];
    const href = tag.match(/href="\/(\w+)#(\w+)"/);
    if (!href) continue;
    const min = tag.match(/data-min-chapter="(\d+)"/);
    links.push({
      page: href[1],
      id: href[2],
      minChapter: min ? Number(min[1]) : null,
    });
  }
  return links;
}

// 遷移先ページの <SpoilerGate id=".." minChapter={N}> を id → N で返す。
function extractGates(source: string): Map<string, number> {
  const gates = new Map<string, number>();
  for (const m of source.matchAll(/<SpoilerGate\b[^>]*>/g)) {
    const id = m[0].match(/\bid="(\w+)"/);
    const min = m[0].match(/minChapter=\{(\d+)\}/);
    if (id && min) gates.set(id[1], Number(min[1]));
  }
  return gates;
}

// ストーリー順リンクの章ロックが遷移先 SpoilerGate と一致することを検証する
// （#356 の回帰防止）。
describe("story.astro のリンクと遷移先 SpoilerGate の章条件の一致", () => {
  const links = extractStoryLinks(read("story.astro"));
  const gatesByPage = new Map<string, Map<string, number>>();
  for (const page of new Set(links.map((l) => l.page))) {
    gatesByPage.set(page, extractGates(read(`${page}.astro`)));
  }

  it("リンクを抽出できている", () => {
    expect(links.length).toBeGreaterThan(0);
  });

  it.each(links.map((l) => [`${l.page}#${l.id}`, l] as const))(
    "%s のリンク側 data-min-chapter が遷移先ゲートと一致する",
    (_name, link) => {
      const gate = gatesByPage.get(link.page)?.get(link.id) ?? null;
      expect(link.minChapter).toBe(gate);
    }
  );
});
