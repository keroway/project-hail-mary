import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// astro check は TS の unused-locals/unused-parameters 診断を既定で
// hint 扱いにし、`pnpm run check` は exit code 0 のまま素通りする。
// noUnusedLocals/noUnusedParameters を有効化すると同じ診断が error に
// 昇格し、CI の Typecheck ジョブが実際に失敗するようになる（#320）。
// この2オプションが tsconfig.json から消えると検知漏れが再発するため、
// 存在を機械的に検証する。
const tsconfig = JSON.parse(
  readFileSync(join(__dirname, "../../tsconfig.json"), "utf8")
);

describe.each(["noUnusedLocals", "noUnusedParameters"])(
  "tsconfig.json の compilerOptions.%s",
  (option) => {
    it("true が設定されている", () => {
      expect(tsconfig.compilerOptions?.[option]).toBe(true);
    });
  }
);
