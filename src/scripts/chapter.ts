/**
 * 読了章ドメインの単一の真実 (single source of truth)。
 * index.astro（章設定ダイアログ）と BaseLayout.astro（ナビ表示・ネタバレ解放）の
 * 両方からこのモジュールを import して使う。クランプ上限・ラベル文言・
 * #nav-chapter-status への書き込みをここに集約し、二重実装による不整合を防ぐ。
 */

export const STORAGE_KEY = "hailmary-chapter";

/** スポイラー全解放は第25章。余裕を持って小説の全章をカバーする上限。 */
export const MAX_CHAPTER = 30;

/** 0〜MAX_CHAPTER の整数に丸める。NaN は 0 とみなす。 */
export function clampChapter(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(MAX_CHAPTER, Math.trunc(raw)));
}

/** localStorage から現在の読了章を読む（クランプ済み）。 */
export function readChapter(): number {
  const raw = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
  return clampChapter(raw);
}

/**
 * 読了章を保存し chapterChanged を発火する。
 * DOM の更新（ダイアログ・ナビ・ネタバレ）は購読側に委ねる。
 * @returns クランプ後の確定値
 */
export function setChapter(v: number): number {
  const clamped = clampChapter(v);
  localStorage.setItem(STORAGE_KEY, String(clamped));
  document.dispatchEvent(
    new CustomEvent("chapterChanged", { detail: clamped })
  );
  return clamped;
}

/** ナビ右側のコンパクト表示（index トップの読了章バーと共通文言）。 */
export function compactLabel(chapter: number): string {
  if (chapter <= 0) return "まだ読んでいない";
  if (chapter >= MAX_CHAPTER) return "全章読了";
  return `第${chapter}章まで`;
}

/** サイト上部ナビのチップ表示。 */
export function navLabel(chapter: number): string {
  if (chapter <= 0) return "未読";
  if (chapter >= MAX_CHAPTER) return "全章読了";
  return `第${chapter}章まで`;
}

/** 章設定ダイアログのステータス文（ネタバレ範囲を補足）。 */
export function statusLabel(chapter: number): string {
  if (chapter <= 0) return "まだ読んでいません（ネタバレなし）";
  if (chapter >= MAX_CHAPTER) return "全部読了（すべてのネタバレ解除）";
  if (chapter >= 29) return `第${chapter}章まで読了（ロッキー船の危機・救出）`;
  if (chapter >= 25) return `第${chapter}章まで読了（終盤・タウメーバ漏洩）`;
  if (chapter >= 9)
    return `第${chapter}章まで読了（ロッキー登場以降の内容解除）`;
  return `第${chapter}章まで読了（ロッキー登場前まで）`;
}

/**
 * ナビの読了章チップ (#nav-chapter-status) を更新する唯一の書き込み口。
 * index と BaseLayout から重複して書き込まれていた不整合を一本化する。
 */
export function updateNavIndicator(chapter: number): void {
  const el = document.getElementById("nav-chapter-status");
  if (!el) return;
  const text = navLabel(chapter);
  el.textContent = text;
  el.setAttribute("aria-label", `現在の読了章設定: ${text}`);
}
