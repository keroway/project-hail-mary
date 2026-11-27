import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/ScienceDiagram.astro", "utf8");

/** セレクタに指定クラスを含み、かつ stroke 宣言を持つ CSS 規則が存在するか */
function hasStrokeRule(className: string): boolean {
  const rules = source.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, selector, body] of rules) {
    const selectors = selector.split(",").map((s) => s.trim());
    if (
      selectors.includes(`.${className}`) &&
      /(^|[\s;])stroke\s*:/.test(body)
    ) {
      return true;
    }
  }
  return false;
}

describe("ScienceDiagram の破線クラス", () => {
  it.each(["diagram-dashed", "diagram-dashed-accent"])(
    "%s に stroke 色が指定されている",
    (cls) => {
      expect(source).toContain(`class="${cls}"`);
      expect(hasStrokeRule(cls)).toBe(true);
    }
  );
});
