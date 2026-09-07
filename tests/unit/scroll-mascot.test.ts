import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

// initScrollMascot() はページ遷移や reduced-motion 変更のたびに再実行されるが、
// 再実行のたびに古い scroll リスナーを解除せず window.addEventListener を
// 積み増していた（#238）。この回帰防止テストは実ソースから initScrollMascot
// を抜き出し、複数回初期化した後も scroll リスナーが1つしか残らないことを検証する。
function extractInitScrollMascot(): string {
  const source = readFileSync(
    join(__dirname, "../../src/layouts/BaseLayout.astro"),
    "utf-8"
  );
  const start = source.indexOf("  let mascotRafId:");
  const end = source.indexOf("  const prefersReducedMotion =");
  if (start === -1 || end === -1) {
    throw new Error("initScrollMascot の抽出対象マーカーが見つかりません");
  }
  return source.slice(start, end);
}

describe("initScrollMascot の再初期化", () => {
  it("複数回呼び出しても scroll リスナーが1つに保たれる", () => {
    const code = extractInitScrollMascot();
    const listeners = new Set<() => void>();
    const frames = new Map<number, () => void>();
    let nextFrameId = 0;
    let styleWrites = 0;

    const context = vm.createContext({
      window: {
        scrollY: 200,
        innerHeight: 800,
        addEventListener: (type: string, fn: () => void) => {
          if (type === "scroll") listeners.add(fn);
        },
        removeEventListener: (type: string, fn: () => void) => {
          if (type === "scroll") listeners.delete(fn);
        },
      },
      document: {
        documentElement: { dataset: {}, scrollHeight: 2400 },
        querySelector: () => ({
          classList: { add() {}, remove() {} },
          style: {
            setProperty: () => {
              styleWrites++;
            },
          },
        }),
      },
      requestAnimationFrame: (fn: () => void) => {
        frames.set(++nextFrameId, fn);
        return nextFrameId;
      },
      cancelAnimationFrame: (id: number) => frames.delete(id),
    });

    vm.runInContext(stripTypeScriptTypes(code), context);

    function flush() {
      for (const [id, fn] of [...frames]) {
        frames.delete(id);
        fn();
      }
    }

    for (let i = 0; i < 5; i++) {
      vm.runInContext("initScrollMascot()", context);
      flush();
    }

    expect(listeners.size).toBe(1);

    styleWrites = 0;
    for (const fn of listeners) fn();
    flush();

    expect(styleWrites).toBe(1);
  });
});
