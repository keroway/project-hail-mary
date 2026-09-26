import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../..");
const DOC_FILES = ["README.md", "CLAUDE.md"];

// tests/unit・tests/playwright にテストファイルを追加した際、README.md/CLAUDE.md
// のディレクトリ構成節への追記が漏れる事象が繰り返し発生している
// (#195, #204, #247, #258, #268, #306, #316, #324, #330)。ci-workflow-filters.test.ts
// と同様に、実ファイル名の集合とdocs本文中の記載を機械的に比較し再発を検知する(#331)。

function actualTestFiles(dir: string, suffix: string): Set<string> {
  return new Set(
    readdirSync(join(ROOT, dir)).filter((file) => file.endsWith(suffix))
  );
}

function docTestFileMentions(docFile: string, suffix: string): Set<string> {
  const source = readFileSync(join(ROOT, docFile), "utf8");
  const escapedSuffix = suffix.replace(/\./g, "\\.");
  const pattern = new RegExp(`[\\w-]+${escapedSuffix}`, "g");
  return new Set(source.match(pattern) ?? []);
}

describe.each(DOC_FILES)("%s のテスト一覧", (docFile) => {
  it("tests/unit/*.test.ts の記載が実ファイルと一致する", () => {
    expect(docTestFileMentions(docFile, ".test.ts")).toEqual(
      actualTestFiles("tests/unit", ".test.ts")
    );
  });

  it("tests/playwright/*.spec.ts の記載が実ファイルと一致する", () => {
    expect(docTestFileMentions(docFile, ".spec.ts")).toEqual(
      actualTestFiles("tests/playwright", ".spec.ts")
    );
  });
});
