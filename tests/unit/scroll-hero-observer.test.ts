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

// 別タブで読了章を変更し SpoilerGate が初めて解放されると、新しく展開された
// .phase-hero がモバイル画像用 Observer に登録されなかった（#294）。
// storage イベントと chapterChanged イベントの両方の経路で、章解放時に
// initScrollReveal も呼ばれるようになったことを検証する。
function createChapterUnlockContext() {
  let chapter = 0;
  let loaded = false;
  const heroImage = { classList: { add() {}, remove() {}, toggle() {} } };
  const storageHandlers: Array<(event: { key: string | null }) => void> = [];
  const chapterChangedHandlers: Array<() => void> = [];
  const observers: Array<{
    active: boolean;
    options: ObserverOptions;
    targets: unknown[];
  }> = [];

  class IntersectionObserverMock {
    options: ObserverOptions;
    active = true;
    targets: unknown[] = [];
    constructor(_callback: unknown, options: ObserverOptions) {
      this.options = options;
      observers.push(this);
    }
    observe(el: unknown) {
      this.targets.push(el);
    }
    unobserve() {}
    disconnect() {
      this.active = false;
    }
  }

  const contentDiv = {
    dataset: {} as Record<string, string>,
    appendChild() {
      loaded = true;
    },
  };
  const gate = {
    dataset: { minChapter: "9" },
    classList: { toggle() {} },
    querySelector: (selector: string) =>
      selector === ".spoiler-gate-content"
        ? contentDiv
        : { content: { cloneNode: () => ({}) } },
  };

  const context = vm.createContext({
    IntersectionObserver: IntersectionObserverMock,
    navigator: { maxTouchPoints: 1 },
    localStorage: { getItem: () => null, setItem: () => {} },
    readChapter: () => chapter,
    updateNavIndicator: () => {},
    syncChapterFromStorage: () => {},
    STORAGE_KEY: "hailmary-chapter",
    window: {
      matchMedia: (query: string) => ({ matches: query.includes("820px") }),
      addEventListener: (
        type: string,
        fn: (event: { key: string | null }) => void
      ) => {
        if (type === "storage") storageHandlers.push(fn);
      },
      removeEventListener: () => {},
    },
    document: {
      documentElement: { dataset: {} },
      querySelector: () => null,
      querySelectorAll: (selector: string) => {
        if (selector === ".spoiler-gate") return [gate];
        if (selector === ".phase-hero") return loaded ? [heroImage] : [];
        return [];
      },
      addEventListener: (type: string, fn: () => void) => {
        if (type === "chapterChanged") chapterChangedHandlers.push(fn);
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
    return observers
      .filter((o) => o.active && o.options.threshold === 0)
      .flatMap((o) => o.targets).length;
  }

  function unlockViaStorage(min: number) {
    chapter = min;
    for (const handler of storageHandlers) handler({ key: "hailmary-chapter" });
  }

  function unlockViaChapterChanged(min: number) {
    chapter = min;
    for (const handler of chapterChangedHandlers) handler();
  }

  return {
    context,
    activeHeroObserverCount,
    unlockViaStorage,
    unlockViaChapterChanged,
  };
}

describe("別タブの章変更で解放された画像とスクロール監視(#294)", () => {
  it("storage イベント経由の章解放で新規展開した画像が監視に登録される", () => {
    const { context, activeHeroObserverCount, unlockViaStorage } =
      createChapterUnlockContext();

    vm.runInContext("applySpoilerGates(); initScrollReveal();", context);
    expect(activeHeroObserverCount()).toBe(0);

    unlockViaStorage(9);
    expect(activeHeroObserverCount()).toBe(2);
  });

  it("chapterChanged イベント経由の章解放でも新規展開した画像が監視に登録される", () => {
    const { context, activeHeroObserverCount, unlockViaChapterChanged } =
      createChapterUnlockContext();

    vm.runInContext("applySpoilerGates(); initScrollReveal();", context);
    expect(activeHeroObserverCount()).toBe(0);

    unlockViaChapterChanged(9);
    expect(activeHeroObserverCount()).toBe(2);
  });

  it("章解放後に繰り返し storage イベントが来ても登録が累積しない", () => {
    const { context, activeHeroObserverCount, unlockViaStorage } =
      createChapterUnlockContext();

    vm.runInContext("applySpoilerGates(); initScrollReveal();", context);
    unlockViaStorage(9);
    unlockViaStorage(9);
    unlockViaStorage(9);

    expect(activeHeroObserverCount()).toBe(2);
  });
});
