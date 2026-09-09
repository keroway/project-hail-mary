import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_CHAPTER } from "../../src/scripts/chapter";

const INDEX_ASTRO = join(__dirname, "../../src/pages/index.astro");

// index.astro の章数上限表記が MAX_CHAPTER からずれる回帰(#254と同種)を機械的に検知する。
// chapter.ts を正としてソースを検査し、リテラルのハードコードを許さない。
describe("index.astroの章数上限表記とMAX_CHAPTERの対応関係", () => {
  const source = readFileSync(INDEX_ASTRO, "utf-8");

  it("MAX_CHAPTERをchapter.tsからimportしている", () => {
    expect(source).toMatch(
      /import\s*\{\s*MAX_CHAPTER\s*\}\s*from\s*["']\.\.\/scripts\/chapter["']/
    );
  });

  it("章数上限を表す4箇所すべてがMAX_CHAPTERを参照し、リテラルをハードコードしていない", () => {
    expect(source).toContain("data-chapter={MAX_CHAPTER}");
    expect(source).toContain('max={MAX_CHAPTER}\n            value="0"');
    expect(source).toContain(
      'max={MAX_CHAPTER}\n              value="0"\n              class="cs-number"'
    );
    expect(source).toContain("/ {MAX_CHAPTER}章");
  });

  it("MAX_CHAPTERは想定どおり30である（表記が変わった場合はここも見直す）", () => {
    expect(MAX_CHAPTER).toBe(30);
  });
});
