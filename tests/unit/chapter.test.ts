import { describe, expect, it } from "vitest";
import {
  clampChapter,
  compactLabel,
  MAX_CHAPTER,
  navLabel,
  statusLabel,
} from "../../src/scripts/chapter";

describe("clampChapter", () => {
  it("負の値は0に丸める", () => {
    expect(clampChapter(-1)).toBe(0);
    expect(clampChapter(-100)).toBe(0);
  });

  it("MAX_CHAPTERを超える値はMAX_CHAPTERに丸める", () => {
    expect(clampChapter(MAX_CHAPTER + 1)).toBe(MAX_CHAPTER);
    expect(clampChapter(999)).toBe(MAX_CHAPTER);
  });

  it("範囲内の値はそのまま（整数化して）返す", () => {
    expect(clampChapter(9)).toBe(9);
    expect(clampChapter(9.9)).toBe(9);
  });

  it("NaNや非有限値は0とみなす", () => {
    expect(clampChapter(Number.NaN)).toBe(0);
    expect(clampChapter(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampChapter(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe("compactLabel", () => {
  it("0以下は未読扱い", () => {
    expect(compactLabel(0)).toBe("まだ読んでいない");
    expect(compactLabel(-1)).toBe("まだ読んでいない");
  });

  it("MAX_CHAPTER以上は全章読了", () => {
    expect(compactLabel(MAX_CHAPTER)).toBe("全章読了");
    expect(compactLabel(MAX_CHAPTER + 1)).toBe("全章読了");
  });

  it("中間の値は章番号を表示する", () => {
    expect(compactLabel(9)).toBe("第9章まで");
  });
});

describe("navLabel", () => {
  it("0以下は未読", () => {
    expect(navLabel(0)).toBe("未読");
  });

  it("MAX_CHAPTER以上は全章読了", () => {
    expect(navLabel(MAX_CHAPTER)).toBe("全章読了");
  });

  it("中間の値は章番号を表示する", () => {
    expect(navLabel(9)).toBe("第9章まで");
  });
});

describe("statusLabel", () => {
  it("0以下はネタバレなし文言", () => {
    expect(statusLabel(0)).toBe("まだ読んでいません（ネタバレなし）");
  });

  it("MAX_CHAPTER以上は全解除文言", () => {
    expect(statusLabel(MAX_CHAPTER)).toBe("全部読了（すべてのネタバレ解除）");
  });

  it("29章以上はロッキー船の危機・救出の文言", () => {
    expect(statusLabel(29)).toBe("第29章まで読了（ロッキー船の危機・救出）");
  });

  it("25章以上29章未満は終盤・タウメーバ漏洩の文言", () => {
    expect(statusLabel(25)).toBe("第25章まで読了（終盤・タウメーバ漏洩）");
    expect(statusLabel(28)).toBe("第28章まで読了（終盤・タウメーバ漏洩）");
  });

  it("9章以上25章未満はロッキー登場以降の文言", () => {
    expect(statusLabel(9)).toBe("第9章まで読了（ロッキー登場以降の内容解除）");
    expect(statusLabel(24)).toBe(
      "第24章まで読了（ロッキー登場以降の内容解除）"
    );
  });

  it("1章以上9章未満はロッキー登場前の文言", () => {
    expect(statusLabel(1)).toBe("第1章まで読了（ロッキー登場前まで）");
    expect(statusLabel(8)).toBe("第8章まで読了（ロッキー登場前まで）");
  });
});
