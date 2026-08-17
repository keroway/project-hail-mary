import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  citations,
  getCitationsFor,
  type PageId,
} from "../../src/data/citations";

const PAGES_DIR = join(__dirname, "../../src/pages");

// `<CitationList page="..." phaseId="..." />` の呼び出しを .astro ソースから抽出する。
// citations.ts のデータを直接列挙せず .astro を正とすることで、
// ページ側の呼び出しとデータの対応漏れ（#172 と同種の回帰）を機械的に検知する。
function extractCitationListCalls(): Array<{
  page: PageId;
  phaseId: string;
  file: string;
}> {
  const calls: Array<{ page: PageId; phaseId: string; file: string }> = [];
  const files = readdirSync(PAGES_DIR).filter((f) => f.endsWith(".astro"));

  for (const file of files) {
    const source = readFileSync(join(PAGES_DIR, file), "utf-8");
    const pattern = /<CitationList\s+page="([^"]+)"\s+phaseId="([^"]+)"\s*\/>/g;
    for (const match of source.matchAll(pattern)) {
      calls.push({ page: match[1] as PageId, phaseId: match[2], file });
    }
  }

  return calls;
}

describe("CitationList呼び出しとcitations.tsの対応関係", () => {
  const calls = extractCitationListCalls();

  it("少なくとも1件のCitationList呼び出しを抽出できる（抽出ロジック自体の健全性確認）", () => {
    expect(calls.length).toBeGreaterThan(0);
  });

  it.each(
    calls
  )('$file の <CitationList page="$page" phaseId="$phaseId" /> はcitations.tsに対応データを持つ', ({
    page,
    phaseId,
  }) => {
    expect(getCitationsFor(page, phaseId).length).toBeGreaterThan(0);
  });

  it("citations.ts側の全エントリは、いずれかのページのCitationList呼び出しから参照されている（孤立データの検知）", () => {
    const referenced = new Set(
      calls.map(({ page, phaseId }) => `${page}:${phaseId}`)
    );
    const orphans = citations
      .map((c) => `${c.page}:${c.phaseId}`)
      .filter((key, index, self) => self.indexOf(key) === index)
      .filter((key) => !referenced.has(key));

    expect(orphans).toEqual([]);
  });
});
