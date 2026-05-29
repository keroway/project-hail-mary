# Project Hail Mary 科学ガイド

[![Deploy](https://github.com/keroway/project-hail-mary/actions/workflows/deploy.yml/badge.svg)](https://github.com/keroway/project-hail-mary/actions/workflows/deploy.yml)
[![CI](https://github.com/keroway/project-hail-mary/actions/workflows/ci.yml/badge.svg)](https://github.com/keroway/project-hail-mary/actions/workflows/ci.yml)
[![Astro](https://img.shields.io/badge/Astro-6-BC52EE?logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-lightgrey)](#ライセンス)

小説『プロジェクト・ヘイルメアリー』の科学入門ガイドサイトです。映画鑑賞前に原作の科学的記述を理解しやすくする補助資料として、中学生でも追える粒度で整理しています。

**公開サイト**: <https://hailmary.keroway.com>

物理・化学・生物・数学の各編に分かれており、読了した章に応じてネタバレを段階的に解放する仕組み（`SpoilerGate`）を備えています。

## 技術構成

- `Astro 6` — 静的サイトジェネレーター（`dist/` へ静的出力）
- `TypeScript` — `astro check` による型チェック
- `@astrojs/sitemap` — ビルド時に `sitemap-index.xml` を生成
- `Cloudflare Pages` — 静的配信（GitHub Actions から `wrangler` で direct upload）
- `Node.js` `>=22`

## ディレクトリ構成

```text
project-hail-mary/
├── .claude/
│   └── CLAUDE.md                    # Claude Code 向け作業ガイド
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                  # PR 時の型チェック・ビルド・プレビューデプロイ
│   │   └── deploy.yml              # main push 時の本番デプロイ
│   └── dependabot.yml              # 依存更新設定（npm / GitHub Actions）
├── AGENTS.md                        # Codex 等エージェント向け（CLAUDE.md のシンボリックリンク）
├── docs/
│   └── cloudflare-pages-setup.md   # Cloudflare Pages 初回セットアップ手順
├── public/
│   └── _headers                    # Cloudflare セキュリティヘッダー
├── src/
│   ├── components/
│   │   ├── SpoilerGate.astro       # 読了章ベースのネタバレ制御
│   │   └── ScienceDiagram.astro    # SVGベース科学概念図コンポーネント
│   ├── layouts/
│   │   └── BaseLayout.astro        # 共通レイアウトと章状態スクリプト
│   ├── pages/
│   │   ├── index.astro             # トップページ
│   │   ├── story.astro             # ストーリー順インデックス
│   │   ├── physics.astro
│   │   ├── chemistry.astro
│   │   ├── biology.astro
│   │   └── math.astro
│   └── styles/
│       └── global.css              # 共通スタイル
├── astro.config.mjs                 # Astro 設定（@astrojs/sitemap 統合）
├── package.json
└── README.md
```

## ローカル開発

```bash
npm install
npm run dev
```

- 開発サーバー: `http://localhost:4321`
- 本番ビルド: `npm run build`
- ビルド確認: `npm run preview`

## CI / PR チェック

`main` 向けの Pull Request を作成すると `.github/workflows/ci.yml` が実行されます。

1. `npm ci`
2. `npm run check`（`astro check` による型チェック）
3. `npm run build`
4. `cloudflare/wrangler-action@v3` による Cloudflare Pages へのプレビューデプロイ（プレビュー URL を PR にコメント）

> Dependabot の PR にはリポジトリ Secrets が渡らないため、プレビューデプロイ手順はスキップされます（型チェック・ビルドは実行されます）。

## デプロイ

`main` ブランチへ push すると GitHub Actions (`.github/workflows/deploy.yml`) が自動実行されます。

1. `npm ci` → `npm run build` でビルド
2. `cloudflare/wrangler-action@v3` が `dist/` を Cloudflare Pages に direct upload

Cloudflare Pages 側のビルド設定は不要です（ビルドは Actions 側で行います）。  
必要な GitHub Secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（設定済み）。

初回プロジェクト作成手順は [docs/cloudflare-pages-setup.md](docs/cloudflare-pages-setup.md) を参照してください。

## 依存更新

`.github/dependabot.yml` により Dependabot が依存を管理します。

- 対象: npm（`package.json`）と GitHub Actions（`.github/workflows/*.yml`）
- スケジュール: 毎週土曜にチェック
- `minor` / `patch` のみ自動 PR を作成（`major` は手動で取り込む）
- 公開後 5 日未満のバージョンは cooldown で見送る

## コンテンツ更新

- 本文更新は `src/pages/*.astro`
- 共通UIやネタバレ制御は `src/layouts/BaseLayout.astro` と `src/components/SpoilerGate.astro`
- 章読了状態は `localStorage` の `hailmary-chapter` を使って保持

## ライセンス

**All Rights Reserved（無断転載・再配布禁止）**

本リポジトリは個人用途・閲覧目的で公開しています。OSS ライセンスは付与していません。

- 解説本文・図版は小説『プロジェクト・ヘイルメアリー』（Andy Weir 著）に基づく二次的な解説であり、原作の著作権は権利者に帰属します。
- ソースコードを含め、本リポジトリの内容について許諾なく複製・改変・再配布することはできません。

> 本サイトは非公式のファン制作物であり、原作者・出版社・映画製作者とは関係ありません。
