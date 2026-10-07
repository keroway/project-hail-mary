import { readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";
import { describe, expect, it } from "vitest";

const WORKFLOWS_DIR = join(__dirname, "../../.github/workflows");

// 依存インストールに関わる設定ファイルが ci.yml / deploy.yml の `code` filter に
// 含まれていることを機械的に検証する（#236 と同種の漏れの再発防止）。
const DEPENDENCY_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
];

function extractFilterPatterns(workflowFile: string, filter: string): string[] {
  const source = readFileSync(join(WORKFLOWS_DIR, workflowFile), "utf8");
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line.trim() === `${filter}:`);
  if (start === -1) {
    throw new Error(`${workflowFile}: \`${filter}:\` filter section not found`);
  }
  const indent = lines[start].search(/\S/);
  const patterns: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() && line.search(/\S/) <= indent) break;
    const match = line.match(/^\s+- '([^']+)'/);
    if (match) patterns.push(match[1]);
  }
  return patterns;
}

function extractCodeFilterPatterns(workflowFile: string): string[] {
  return extractFilterPatterns(workflowFile, "code");
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

// ci.yml と deploy.yml は actions/checkout・pnpm/action-setup・
// actions/setup-node・cloudflare/wrangler-action のバージョンピン（SHA）を
// 共通で使う運用だが、#281 で deploy.yml 側の1箇所だけ更新が漏れ、
// 本番デプロイ経路が約3ヶ月古いピンのまま残った。CI・テストはどちらも
// green のまま進行し人間のレビューでしか気づけないため、両ファイル間で
// SHA の集合が一致することを機械的に検証する（#318）。
const PINNED_ACTIONS = [
  "actions/checkout",
  "pnpm/action-setup",
  "actions/setup-node",
  "cloudflare/wrangler-action",
];

function extractActionPins(workflowFile: string, action: string): Set<string> {
  const source = readFileSync(join(WORKFLOWS_DIR, workflowFile), "utf8");
  const pattern = new RegExp(
    `uses:\\s*${action.replace("/", "\\/")}@([0-9a-f]{40})`,
    "g"
  );
  const shas = new Set<string>();
  for (const match of source.matchAll(pattern)) {
    shas.add(match[1]);
  }
  if (shas.size === 0) {
    throw new Error(`${workflowFile}: ${action} の uses: 行が見つからない`);
  }
  return shas;
}

describe.each(PINNED_ACTIONS)("%s のバージョンピン", (action) => {
  it("ci.yml と deploy.yml で一致する", () => {
    const ciShas = extractActionPins("ci.yml", action);
    const deployShas = extractActionPins("deploy.yml", action);
    expect(deployShas).toEqual(ciShas);
  });
});

// docs を code に混ぜると文書だけで build・deploy まで起動するため、
// filter の境界と job の条件を含めて回帰検証する (#359)。
describe("文書のテスト一覧検査の起動条件", () => {
  const source = readFileSync(join(WORKFLOWS_DIR, "ci.yml"), "utf8");
  const codePatterns = extractCodeFilterPatterns("ci.yml");
  const docsPatterns = extractFilterPatterns("ci.yml", "docs");

  it.each([
    ["README.md", false, true],
    ["CLAUDE.md", false, true],
    ["docs/guide.md", false, false],
    ["SECURITY.md", false, false],
    ["src/pages/index.astro", true, false],
    ["tests/unit/docs-test-list-sync.test.ts", true, false],
    [".github/workflows/ci.yml", true, false],
  ])("%s の code=%s / docs=%s", (path, code, docs) => {
    expect(codePatterns.some((pattern) => matchesGlob(path, pattern))).toBe(
      code
    );
    expect(docsPatterns.some((pattern) => matchesGlob(path, pattern))).toBe(
      docs
    );
  });

  it("docs filter の出力を下流 job に公開する", () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression
    expect(source).toContain("docs: ${{ steps.filter.outputs.docs }}");
  });

  it("Lint は code または docs の変更で unit test を実行する", () => {
    const lint = source.split(/^ {2}lint:$/m)[1].split(/^ {2}typecheck:$/m)[0];
    expect(lint).toContain("needs: [changes]");
    expect(lint).toContain(
      "if: needs.changes.outputs.code == 'true' || needs.changes.outputs.docs == 'true'"
    );
    expect(lint).toContain("run: pnpm run test:unit");
  });

  it.each(["typecheck", "build", "e2e", "deploy-preview"])(
    "%s は code 変更だけで起動する",
    (job) => {
      const section = source.split(new RegExp(`^  ${job}:$`, "m"))[1];
      const condition = section.split("runs-on:")[0];
      expect(condition).toContain("needs.changes.outputs.code == 'true'");
      expect(condition).not.toContain("needs.changes.outputs.docs");
    }
  );
});
