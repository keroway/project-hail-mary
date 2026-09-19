import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

// 表示設定パネルで「動き」を切り替えても initScrollReveal が再実行されず、
// モバイル向け画像用 Observer(heroEnterObserver / heroLeaveObserver)が
// 実効設定に追従しないままだった（#289）。別タブでの設定同期(storage イベント)
// も同じ呼出し不足を抱えていた。このテストは実ソースから UI 設定ヘルパー・
// クリックハンドラー・storage 同期ハンドラー・initScrollReveal / initScrollMascot
// を抜き出し、両方の経路で画像用 Observer 数が動き設定に追従することを検証する。
function extractUiPrefsAndScrollReveal(): string {
  const source = readFileSync(
    join(__dirname, "../../src/layouts/BaseLayout.astro"),
    "utf-8"
  );
  const start = source.indexOf("  const UI_PREFS_KEY = 'hailmary-ui-prefs';");
  const end = source.indexOf("  const prefersReducedMotion =");
  if (start === -1 || end === -1) {
    throw new Error("抽出対象マーカーが見つかりません");
  }
  return source.slice(start, end);
}

type ObserverOptions = { threshold?: number };

function createContext() {
  const store = new Map<string, string>();
  const clickHandlers: Array<(event: unknown) => void> = [];
  const observers: Array<{ active: boolean; options: ObserverOptions }> = [];
  const heroImage = { classList: { add() {}, remove() {}, toggle() {} } };

  class Element {}
  class IntersectionObserverMock {
    options: ObserverOptions;
    active = true;
    constructor(_callback: unknown, options: ObserverOptions) {
      this.options = options;
      observers.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.active = false;
    }
  }

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
    HTMLElement: Element,
    IntersectionObserver: IntersectionObserverMock,
    navigator: { maxTouchPoints: 1 },
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
    window: {
      matchMedia: (query: string) => ({ matches: query.includes("820px") }),
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    document: {
      documentElement: { dataset: {} },
      querySelector: () => null,
      querySelectorAll: (selector: string) =>
        selector === ".phase-hero" ? [heroImage] : [],
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

  vm.runInContext(
    stripTypeScriptTypes(extractUiPrefsAndScrollReveal()),
    context
  );

  function activeHeroObserverCount() {
    return observers.filter((o) => o.active && o.options.threshold === 0)
      .length;
  }

  function click(value: string) {
    const target = makeOptionTarget(value);
    for (const handler of clickHandlers) handler({ target });
  }

  return { context, store, activeHeroObserverCount, click };
}

describe("表示設定パネルの motion クリックと画像用 Observer(#289)", () => {
  it("motion クリックのたびにモバイル画像用 Observer が追従する", () => {
    const { context, activeHeroObserverCount, click } = createContext();

    vm.runInContext("applyUiPrefs(); initScrollReveal();", context);
    expect(activeHeroObserverCount()).toBe(2);

    click("reduced");
    expect(activeHeroObserverCount()).toBe(0);

    click("default");
    expect(activeHeroObserverCount()).toBe(2);
  });

  it("重複初期化してもモバイル画像用 Observer は増殖しない", () => {
    const { context, activeHeroObserverCount, click } = createContext();

    vm.runInContext("applyUiPrefs(); initScrollReveal();", context);
    click("default");
    click("default");
    click("default");

    expect(activeHeroObserverCount()).toBe(2);
  });
});

describe("別タブでの motion 同期(storage イベント)と画像用 Observer(#289)", () => {
  it("storage イベント経由の同期でもモバイル画像用 Observer が追従する", () => {
    const { context, store, activeHeroObserverCount } = createContext();

    store.set(
      "hailmary-ui-prefs",
      JSON.stringify({ motion: "default", motionSource: "explicit" })
    );
    vm.runInContext("applyUiPrefs(); initScrollReveal();", context);
    expect(activeHeroObserverCount()).toBe(2);

    store.set(
      "hailmary-ui-prefs",
      JSON.stringify({ motion: "reduced", motionSource: "explicit" })
    );
    vm.runInContext("syncUiPrefsFromStorage()", context);
    expect(activeHeroObserverCount()).toBe(0);
  });
});
