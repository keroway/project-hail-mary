# Cloudflare Pages セットアップ手順

## 概要

このサイトは Cloudflare Pages の静的ホスティングを使用する。
ビルドステップは不要（純粋な HTML/CSS/JS のみ）。

## 前提条件

- Cloudflare アカウント（無料プランで可）
- GitHub リポジトリ: `keroway-family/project-hail-mary`
- `public/index.html` に学習ガイド HTML が配置済みであること

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
| Framework preset | なし（None） |
| Build command | **（空欄のまま）** |
| Build output directory | `public` |
| Root directory（詳細設定） | **（空欄のまま）** |

> **重要**: Build command を空欄にすることで、Cloudflare Pages が純粋な静的サイトとして扱う。

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
git add public/index.html
git commit -m "Update study guide: <変更内容>"
git push origin main
```

プッシュ後、Cloudflare Pages ダッシュボードでデプロイ状況を確認できる。

## トラブルシューティング

**ページが表示されない**
→ `public/index.html` が存在するか確認。Build output directory が `public` になっているか確認。

**更新が反映されない**
→ ブラウザのキャッシュをクリア（Ctrl+Shift+R）。Cloudflare ダッシュボードでデプロイが完了しているか確認。

**`_headers` が効いていない**
→ ファイルパスが `public/_headers` であることを確認（`public/` の中に入れること）。
