# project-hail-mary

小説『プロジェクト・ヘイルメアリー』の科学入門ガイドサイトです。映画鑑賞前に原作の科学的記述を理解しやすくする補助資料として、中学生でも追える粒度で整理しています。

## 技術構成

- `Astro 5`
- 静的出力 (`dist/`)
- Cloudflare Pages 配信

## ディレクトリ構成

```text
project-hail-mary/
├── .claude/
│   └── CLAUDE.md                    # Claude Code 向け作業ガイド
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
├── astro.config.mjs
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

## デプロイ

`main` ブランチへ push すると GitHub Actions (`.github/workflows/deploy.yml`) が自動実行されます。

1. `npm ci` → `npm run build` でビルド
2. `cloudflare/wrangler-action@v3` が `dist/` を Cloudflare Pages に direct upload

Cloudflare Pages 側のビルド設定は不要です（ビルドは Actions 側で行います）。  
必要な GitHub Secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`（設定済み）。

初回プロジェクト作成手順は [docs/cloudflare-pages-setup.md](docs/cloudflare-pages-setup.md) を参照してください。

## コンテンツ更新

- 本文更新は `src/pages/*.astro`
- 共通UIやネタバレ制御は `src/layouts/BaseLayout.astro` と `src/components/SpoilerGate.astro`
- 章読了状態は `localStorage` の `hailmary-chapter` を使って保持
