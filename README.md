# project-hail-mary

プロジェクトへイルメアリーに関する科学導入ガイド

中学2年生の長男が映画鑑賞前に小説の科学的記述を理解するための補助資料。
科学的思考（試行）を深めるための手がかりとなることを目的としている。

## ディレクトリ構成

```
project-hail-mary/
├── .claude/
│   └── CLAUDE.md          # Claude Code 向けプロジェクト概要・作業ガイド
├── docs/
│   └── cloudflare-pages-setup.md  # Cloudflare Pages デプロイ手順
├── public/                # Cloudflare Pages の配信ルート
│   ├── index.html         # 学習ガイド本体（HTML）
│   └── _headers           # セキュリティヘッダー設定
├── .gitignore
└── README.md
```

## 開発・運用

- **ホスティング**: Cloudflare Pages（静的サイト、ビルド不要）
- **配信ディレクトリ**: `public/`
- **本番URL**: `https://xxx.pages.dev`（Cloudflare Pages 接続後に確定）
- **デプロイ**: `main` ブランチへのプッシュ/マージで自動デプロイ

## 初期セットアップ

Cloudflare Pages の接続設定は [`docs/cloudflare-pages-setup.md`](docs/cloudflare-pages-setup.md) を参照。

## コンテンツの更新

`public/index.html` を編集して `main` ブランチにプッシュすれば自動デプロイされる。
ローカルでの編集は Claude Code（`claude` コマンド）の利用を推奨。
