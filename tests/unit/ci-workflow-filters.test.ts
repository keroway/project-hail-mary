import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WORKFLOWS_DIR = join(__dirname, "../../.github/workflows");

// 依存インストールに関わる設定ファイルが ci.yml / deploy.yml の `code` filter に
// 含まれていることを機械的に検証する（#236 と同種の漏れの再発防止）。
const DEPENDENCY_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
];

function extractCodeFilterPatterns(workflowFile: string): string[] {
  const source = readFileSync(join(WORKFLOWS_DIR, workflowFile), "utf8");
  const codeSection = source.split(/^\s*code:\s*$/m)[1];
  if (!codeSection) {
    throw new Error(`${workflowFile}: \`code:\` filter section not found`);
  }
  const patterns: string[] = [];
  for (const line of codeSection.split("\n")) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+- '([^']+)'/);
    if (match) patterns.push(match[1]);
  }
  return patterns;
}

describe.each(["ci.yml", "deploy.yml"])("%s の code filter", (workflowFile) => {
  const patterns = extractCodeFilterPatterns(workflowFile);

  it.each(DEPENDENCY_FILES)("%s を対象に含む", (file) => {
    expect(patterns).toContain(file);
  });
});

// lefthook.yml の pre-push build glob は ci.yml の code filter と揃える運用
// （lefthook.yml 冒頭のコメント参照）。#248 で乖離が発生したため、両者の
// パターン集合が一致することを機械的に検証する。
function extractLefthookPrePushBuildGlob(): string[] {
  const source = readFileSync(join(__dirname, "../../lefthook.yml"), "utf8");
  const match = source.match(/pre-push:[\s\S]*?glob:\s*"\{([^}]*)\}"/);
  if (!match) {
    throw new Error("lefthook.yml: pre-push build job の glob が見つからない");
  }
  return match[1].split(",");
}

it("lefthook.yml の pre-push build glob は ci.yml の code filter と一致する", () => {
  const ciPatterns = extractCodeFilterPatterns("ci.yml");
  const lefthookPatterns = extractLefthookPrePushBuildGlob();
  expect(new Set(lefthookPatterns)).toEqual(new Set(ciPatterns));
});

// deploy.yml のコメントは「ci.yml の changes job と揃えている」と明記しているが、
// これまで ci.yml 側だけにパスを追加して deploy.yml への反映を忘れる漏れが
// 複数回発生していた（#210, #216 → #255 で発覚）。パターン集合全体の一致を
// 機械的に検証し、同種の乖離を再発防止する。
it("deploy.yml の code filter は ci.yml の code filter と完全に一致する", () => {
  const ciPatterns = extractCodeFilterPatterns("ci.yml");
  const deployPatterns = extractCodeFilterPatterns("deploy.yml");
  expect(new Set(deployPatterns)).toEqual(new Set(ciPatterns));
});
