# Project Hail Mary — Claude Code ガイド

## プロジェクト概要

小説「プロジェクトへイルメアリー」の科学入門ガイドサイト。
中学2年生の長男が映画鑑賞前に科学的記述を理解するための補助資料。

- **ホスティング**: Cloudflare Pages（静的サイト）
- **配信ディレクトリ**: `public/`
- **本番ブランチ**: `main`（プッシュで自動デプロイ）

## リポジトリ構成

```
public/
├── index.html     # 学習ガイド本体（編集メインのファイル）
└── _headers       # Cloudflare Pages セキュリティヘッダー（通常は変更不要）
docs/
└── cloudflare-pages-setup.md  # Cloudflare 初回設定手順
```

## よくある作業

### 学習ガイドの内容を更新する

`public/index.html` を編集して `main` にプッシュするだけでデプロイされる。

```bash
git add public/index.html
git commit -m "Update: <変更内容>"
git push origin main
```

### 新しいページを追加する

`public/` 以下に HTML ファイルを追加する。例: `public/chapter2.html`

### Cloudflare Pages の設定変更

`docs/cloudflare-pages-setup.md` を参照。

## コンテンツ方針

- 読者は中学2年生（科学に興味あり、基礎的な中学理科レベル）
- 小説の科学記述を補助する内容（過度な専門用語は避ける）
- 映画では省略されている小説固有の科学的考察を重視する
- HTML/CSS のみのシンプルな構成を維持する（フレームワーク不使用）

## Cloudflare Pages デプロイ状況

初回セットアップが必要な場合は `docs/cloudflare-pages-setup.md` を参照。
セットアップ済みの場合、`main` へのプッシュで自動デプロイされる。

## 注意事項

- `public/_headers` は Cloudflare Pages の設定ファイル。通常は変更不要。
- `main` ブランチへの直接プッシュ可（小規模プロジェクトのため）。
- 大きな変更はフィーチャーブランチ → PR → マージの手順を推奨。
