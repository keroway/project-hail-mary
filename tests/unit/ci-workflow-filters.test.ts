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
