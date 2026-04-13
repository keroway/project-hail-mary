# Cloudflare Pages セットアップ手順

## 概要

このサイトは Cloudflare Pages の静的ホスティングを使用する。
Astro でビルドした `dist/` を配信する。

## 前提条件

- Cloudflare アカウント（無料プランで可）
- GitHub リポジトリ: `keroway-family/project-hail-mary`
- ローカルで `npm run build` が成功すること

## 初回セットアップ

### 1. Cloudflare ダッシュボードにログイン

`https://dash.cloudflare.com` にアクセスしてログイン。
アカウント未作成の場合は無料プランで作成する。

### 2. Pages プロジェクトを作成

1. 左サイドバー「Workers & Pages」をクリック
2. 「Create」→「Pages タブ」→「Connect to Git」を選択
3. GitHub 認証（初回のみ）後、リポジトリ一覧から `keroway-family/project-hail-mary` を選択

### 3. ビルド設定

以下のとおりに設定する：

| 項目 | 設定値 |
|---|---|
| Production branch | `main` |
| Framework preset | `Astro` または `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory（詳細設定） | **（空欄のまま）** |

> `public/` は配信ルートではなく、主に `_headers` などの静的アセット配置に使う。実際のHTMLは Astro が `dist/` に出力する。

### 4. デプロイ実行

「Save and Deploy」をクリック。初回デプロイは 30〜60 秒で完了する。
完了すると `https://xxx.pages.dev` 形式の URL が発行される。

## デプロイの仕組み

| ブランチ | デプロイ先 |
|---|---|
| `main` | 本番（`https://xxx.pages.dev`） |
| その他のブランチ | プレビュー（`https://<branch-name>.xxx.pages.dev`） |

`main` へのプッシュまたはマージで自動的に本番デプロイが走る。
フィーチャーブランチでの作業中は、そのブランチ専用のプレビュー URL で確認できる。

## セキュリティヘッダーの確認

デプロイ後、ブラウザの DevTools > Network タブでレスポンスヘッダーを確認する：

- `X-Frame-Options: DENY` — クリックジャッキング対策
- `X-Content-Type-Options: nosniff` — MIME タイプスニッフィング対策
- `Referrer-Policy: strict-origin-when-cross-origin` — リファラー制御
- `Cache-Control: no-cache`（HTML ファイル）— 更新が即時反映される

`_headers` ファイルは Cloudflare Pages がネイティブで処理する。ビルド設定不要。

## コンテンツ更新の手順

```bash
# ローカルで編集後
git add src/pages public/_headers
git commit -m "Update study guide: <変更内容>"
git push origin main
```

プッシュ後、Cloudflare Pages ダッシュボードでデプロイ状況を確認できる。

## トラブルシューティング

**ページが表示されない**
→ `npm run build` が通るか確認。Cloudflare Pages の Build output directory が `dist` になっているか確認。

**更新が反映されない**
→ ブラウザのキャッシュをクリア（Ctrl+Shift+R）。Cloudflare ダッシュボードでデプロイが完了しているか確認。

**`_headers` が効いていない**
→ ファイルパスが `public/_headers` であることを確認。Astro ビルド時にそのまま `dist/_headers` へコピーされる。
