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
├── docs/
│   └── cloudflare-pages-setup.md   # Cloudflare Pages 設定手順
├── public/
│   └── _headers                    # Cloudflare セキュリティヘッダー
├── src/
│   ├── components/
│   │   └── SpoilerGate.astro       # 読了章ベースのネタバレ制御
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
├── tmp/                            # 旧HTML版の退避
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

Cloudflare Pages 側では Astro ビルド前提の設定が必要です。

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

詳細は [docs/cloudflare-pages-setup.md](docs/cloudflare-pages-setup.md) を参照してください。

## コンテンツ更新

- 本文更新は `src/pages/*.astro`
- 共通UIやネタバレ制御は `src/layouts/BaseLayout.astro` と `src/components/SpoilerGate.astro`
- 章読了状態は `localStorage` の `hailmary-chapter` を使って保持
