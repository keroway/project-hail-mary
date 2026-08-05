# project-hail-mary — Claude Code Setup

このディレクトリは Claude Code の共有設定です。トップレベルの指示ファイルは
`CLAUDE.md`（リポジトリルート）ではなく **`.claude/CLAUDE.md`** に置いています。理由は
下記「CLAUDE.md をルートではなく `.claude/` に置く理由」を参照してください。

## 構成

```
.claude/
├── agents/
│   ├── hail-mary-fact-checker.md  # 小説/映画の記述に対するファクトチェック担当
│   └── science-article-writer.md  # 中高生向け科学記事の執筆・リライト担当
├── hooks/
│   └── post-stop-check.sh         # Stop hook 本体（lint / typecheck を検証）
├── CLAUDE.md                      # プロジェクトの最上位指示ファイル（root ではなくここに置く）
├── settings.json                  # 共有設定（有効プラグイン・Stop hook 登録等、コミット対象）
├── settings.local.json            # 個人設定（.gitignore で除外）
└── agent-memory/                  # サブエージェントの観察ログ（.gitignore で除外、machine-generated）
```

`commands/`、`rules/` は現状存在しない。追加したらこの README に役割を記録する。

## CLAUDE.md をルートではなく `.claude/` に置く理由

このリポジトリは、ワークスペース内の他リポジトリ（`astro-blog` など）と異なり
`CLAUDE.md` がリポジトリルートではなく `.claude/CLAUDE.md` にあり、`AGENTS.md` は
ルートから `.claude/CLAUDE.md` への symlink になっている（`ls -la AGENTS.md` で確認可）。

- **意図**: このリポジトリは「小説の科学入門ガイド」という単一目的の小規模サイトで、
  `.claude/rules/` のような詳細ルールへの分割が要らない（実際、`rules/` は存在しない）。
  Claude Code 関連の設定・エージェント定義・指示ファイルを `.claude/` 一箇所に集約し、
  リポジトリルートを `README.md` とアプリケーションコードだけに保つ構成を意図的に採っている。
- **ワークスペース内での位置づけ**: `../../keroway/CLAUDE.md`（ワークスペースルート）の
  リポジトリ索引にある他の全リポジトリは、ルート `CLAUDE.md` + `AGENTS.md` symlink
  という配置に統一されている。`project-hail-mary` は現時点で唯一の例外であり、
  横断作業で `CLAUDE.md` の場所を機械的に決め打ちしない（`find . -name CLAUDE.md` で
  探すか、この README を先に読むこと）。
- **再評価トリガ**: `.claude/rules/` のような詳細ルール分割が必要になった場合、
  または他リポジトリとの配置統一を優先する判断に変わった場合は、ルートへ移動し
  `AGENTS.md` の張り先を `CLAUDE.md`（ルート）に更新する。

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

このリポジトリに `.claude/rules/` は存在しない。`.claude/CLAUDE.md` が唯一かつ最上位の
指示ファイルであり、詳細ルールへの分割はしていない（上記「配置理由」参照）。矛盾時の
優先順位を考える必要がある複数ファイル構成にはなっていない。

## 他環境への移植

- `AGENTS.md`（ルート）は `.claude/CLAUDE.md` への symlink。Codex / pi など他ハーネスは
  この symlink 経由で同じ内容を読む
- `.claude/settings.local.json`、`.claude/agent-memory/` は `.gitignore` で除外
- 新しい開発者がクローンした場合の追加手順は無し。`gh` の認証と `pnpm install` のみ

