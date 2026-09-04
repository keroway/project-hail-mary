# project-hail-mary — Claude Code Setup

このディレクトリは Claude Code の共有設定です。トップレベルの指示ファイルは、
ワークスペース内の他リポジトリと同じくリポジトリルートの `CLAUDE.md` に置いています
（`AGENTS.md` はルートから `CLAUDE.md` への symlink）。

## 構成

```
CLAUDE.md                          # プロジェクトの最上位指示ファイル（リポジトリルート）
AGENTS.md                          # CLAUDE.md への symlink（Codex / pi など他ハーネス用）
.claude/
├── agents/
│   ├── hail-mary-fact-checker.md  # 小説/映画の記述に対するファクトチェック担当
│   └── science-article-writer.md  # 中高生向け科学記事の執筆・リライト担当
├── hooks/
│   └── post-stop-check.sh         # Stop hook 本体（lint / typecheck を検証）
├── settings.json                  # 共有設定（有効プラグイン・Stop hook 登録等、コミット対象）
├── settings.local.json            # 個人設定（.gitignore で除外）
└── agent-memory/                  # サブエージェントの観察ログ（.gitignore で除外、machine-generated）
```

`commands/`、`rules/` は現状存在しない。追加したらこの README に役割を記録する。

以前は「小説の科学入門ガイド」という単一目的の小規模サイトであることを理由に
`CLAUDE.md` を `.claude/CLAUDE.md` に置く例外運用だったが、ワークスペース全体の配置
（ルート `CLAUDE.md` + `AGENTS.md` symlink）との一貫性を優先し、2026-09-05 に統一した
（agent-assets#339）。

## 依存ツール

| ツール | 用途 | 必須？ |
|---|---|---|
| `pnpm` | dev / build / lint / check / test:e2e の実行 | 必須 |
| `gh` | Issue/PR 操作（CLAUDE.md 記載の運用フロー） | 必須 |

## Hooks

`.claude/settings.json` に Stop hook を登録済み。ターン終了時に
`.claude/hooks/post-stop-check.sh` が、そのターンで `src/`・`tests/`・`public/`・
`package.json`・`astro.config.mjs`・`tsconfig.json`・`biome.json*` のいずれかに変更が
あった場合のみ `pnpm run lint` / `pnpm run check`（astro check）を実行する。対象ファイルに
変更がなければ何も実行せず終了する（`test:e2e` は実行時間の都合で対象外、CI 側で担保）。
導入の判断根拠は
[keroway/project-hail-mary#146](https://github.com/keroway/project-hail-mary/issues/146)
（[keroway/agent-assets#51](https://github.com/keroway/agent-assets/issues/51) 配下）を参照。
PostToolUse 等その他の hook は未登録。CI (`.github/workflows/ci.yml`) の
lint / typecheck / build / e2e ジョブが最終検証を担っている。

## Agents の役割分担

| Agent | model | 担当領域 |
|---|---|---|
| `hail-mary-fact-checker` | sonnet | 小説『プロジェクト・ヘイルメアリー』（原作・映画、英語/日本語）の記述に対するファクトチェック。章番号・用語訳・原作/映画差分の検証 |
| `science-article-writer` | opus | 物理・化学・生物・数学の記事執筆/リライト。中学2年生〜高校生向けに大学教養レベルの内容を噛み砕く |

両エージェントとも `memory: project`（プロジェクト単位のメモリ、`.claude/agent-memory/<agent>/` に保存・`.gitignore` 対象）。

## Rules の参照階層

このリポジトリに `.claude/rules/` は存在しない。`CLAUDE.md`（リポジトリルート）が
唯一かつ最上位の指示ファイルであり、詳細ルールへの分割はしていない。矛盾時の優先順位を
考える必要がある複数ファイル構成にはなっていない。

## 他環境への移植

- `AGENTS.md`（ルート）は `CLAUDE.md`（ルート）への symlink。Codex / pi など他ハーネスは
  この symlink 経由で同じ内容を読む
- `.claude/settings.local.json`、`.claude/agent-memory/` は `.gitignore` で除外
- 新しい開発者がクローンした場合の追加手順は無し。`gh` の認証と `pnpm install` のみ

