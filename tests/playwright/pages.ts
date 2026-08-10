/**
 * smoke / a11y の両 spec が検査する対象ページ。
 *
 * **ここが唯一の定義。** 以前は spec ごとに同じ配列を持っており、ルートを増減したときに
 * 片方だけ更新して検査対象がずれるおそれがあった (PR #163 のレビュー指摘)。
 * ページを追加・削除するときはこのファイルだけを変更する。
 */
export const PAGES = [
  { path: "/" },
  { path: "/story" },
  { path: "/physics" },
  { path: "/chemistry" },
  { path: "/biology" },
  { path: "/math" },
  { path: "/notes" },
] as const;
