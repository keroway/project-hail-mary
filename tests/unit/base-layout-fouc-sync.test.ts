import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_PATH = join(__dirname, "../../src/layouts/BaseLayout.astro");

// BaseLayout.astro の head 内 is:inline スクリプトは、FOUC 防止のため
// 末尾 <script> の DEFAULT_UI_PREFS / getEffectiveMotion() と同じ判定ロジックを
// 手動で複製している（#194 由来）。項目を追加・変更した際に片方だけ更新される
// ドリフトを機械的に検知するため、両者が参照するプリファレンスキー集合の一致を
// 検証する（#327）。

function extractInlineScript(source: string): string {
  const match = source.match(/<script is:inline>([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(
      "BaseLayout.astro: head 内の is:inline スクリプトが見つからない"
    );
  }
  return match[1];
}

function extractInlinePrefKeys(inlineScript: string): Set<string> {
  const keys = new Set<string>();
  for (const match of inlineScript.matchAll(/\bp\.(\w+)/g)) {
    keys.add(match[1]);
  }
  return keys;
}

function extractDefaultUiPrefsKeys(source: string): Set<string> {
  const match = source.match(
    /const DEFAULT_UI_PREFS: UiPrefs = \{([\s\S]*?)\};/
  );
  if (!match) {
    throw new Error("BaseLayout.astro: DEFAULT_UI_PREFS の定義が見つからない");
  }
  const keys = new Set<string>();
  for (const line of match[1].split("\n")) {
    const keyMatch = line.match(/^\s*(\w+):/);
    if (keyMatch) keys.add(keyMatch[1]);
  }
  return keys;
}

describe("BaseLayout.astro の FOUC 防止スクリプトと表示設定の同期", () => {
  const source = readFileSync(SOURCE_PATH, "utf8");
  const inlineScript = extractInlineScript(source);

  it("is:inline スクリプトが参照するプリファレンスキー集合は DEFAULT_UI_PREFS のキー集合と一致する", () => {
    const inlineKeys = extractInlinePrefKeys(inlineScript);
    const defaultKeys = extractDefaultUiPrefsKeys(source);
    expect(inlineKeys).toEqual(defaultKeys);
  });
});
