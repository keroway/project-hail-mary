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

// 表示設定パネルで「動き」を切り替えても initScrollMascot が再実行されず、
// scroll リスナー登録・解除と data-motion の実効値がずれたままになっていた（#286）。
// この回帰防止テストは実ソースからパネルのクリックハンドラーと initScrollMascot
// を抜き出し、motion オプションのクリックのたびにリスナー数が追従することを検証する。
function extractUiClickHandlerAndMascot(): string {
  const source = readFileSync(
    join(__dirname, "../../src/layouts/BaseLayout.astro"),
    "utf-8"
  );
  const clickStart = source.indexOf(
    "  const UI_PREFS_KEY = 'hailmary-ui-prefs';"
  );
  const clickEnd = source.indexOf("  function updateActiveNav() {");
  const mascotStart = source.indexOf("  let mascotRafId:");
  const mascotEnd = source.indexOf("  const prefersReducedMotion =");
  if (
    clickStart === -1 ||
    clickEnd === -1 ||
    mascotStart === -1 ||
    mascotEnd === -1
  ) {
    throw new Error("抽出対象マーカーが見つかりません");
  }
  return (
    source.slice(clickStart, clickEnd) + source.slice(mascotStart, mascotEnd)
  );
}

describe("表示設定パネルの motion クリックと initScrollMascot", () => {
  it("motion オプションのクリックごとに scroll リスナーが追従する", () => {
    const code = extractUiClickHandlerAndMascot();
    const listeners = new Set<() => void>();
    const clickHandlers: Array<(event: unknown) => void> = [];
    const store = new Map<string, string>();
    const mascotClasses = new Set<string>();

    class Element {}

    function makeOptionTarget(value: string) {
      const target = new Element() as InstanceType<typeof Element> & {
        closest: (selector: string) => unknown;
      };
      target.closest = (selector: string) =>
        selector === "[data-ui-setting][data-ui-value]"
          ? {
              getAttribute: (name: string) =>
                name === "data-ui-setting"
                  ? "motion"
                  : name === "data-ui-value"
                    ? value
                    : null,
            }
          : null;
      return target;
    }

    const context = vm.createContext({
      Element,
      HTMLElement: class {},
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
      window: {
        matchMedia: () => ({ matches: false }),
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
          classList: {
            add: () => mascotClasses.add("is-active"),
            remove: () => mascotClasses.delete("is-active"),
          },
          style: { setProperty: () => {} },
        }),
        querySelectorAll: () => [],
        addEventListener: (type: string, fn: (event: unknown) => void) => {
          if (type === "click") clickHandlers.push(fn);
        },
      },
      requestAnimationFrame: (fn: () => void) => {
        fn();
        return 1;
      },
      cancelAnimationFrame: () => {},
    });

    vm.runInContext(stripTypeScriptTypes(code), context);
    vm.runInContext("initScrollMascot()", context);
    expect(listeners.size).toBe(1);

    const click = (value: string) => {
      const target = makeOptionTarget(value);
      for (const handler of clickHandlers) handler({ target });
    };

    click("reduced");
    expect(listeners.size).toBe(0);

    click("default");
    expect(listeners.size).toBe(1);
  });
});

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
