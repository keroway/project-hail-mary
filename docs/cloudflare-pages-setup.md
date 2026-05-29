# Cloudflare Pages セットアップ手順

## 概要

このサイトは GitHub Actions + `cloudflare/wrangler-action@v3` で Cloudflare Pages に **direct upload** するデプロイ方式を採用している。Cloudflare Pages の Git Integration（Connect to Git）は使わない。

```
main push → GitHub Actions → npm run build → wrangler pages deploy dist
```

## 前提条件

- Cloudflare アカウント（無料プランで可）
- GitHub リポジトリ: `keroway/project-hail-mary`
- ローカルで `npm run build` が成功すること

## 初回セットアップ

### 1. Pages プロジェクトを作成

Cloudflare ダッシュボード (`https://dash.cloudflare.com`) にログインし、以下いずれかの方法でプロジェクトを作成する。

**ダッシュボード経由:**

1. 左サイドバー「Workers & Pages」→「Create」→「Pages タブ」
2. 「Direct Upload」を選択し、プロジェクト名を `project-hail-mary` にする

**wrangler CLI 経由:**

```bash
npx wrangler pages project create project-hail-mary
```

### 2. Account ID を取得

ダッシュボード右サイドバーまたは `https://dash.cloudflare.com/<account-id>` の URL から確認できる。

### 3. API Token を作成

1. ダッシュボード右上のユーザーアイコン →「My Profile」→「API Tokens」→「Create Token」
2. テンプレート「Cloudflare Pages — Edit」を選択
3. 生成されたトークン文字列をコピーする

### 4. GitHub Secrets を登録

リポジトリの Settings → Secrets and variables → Actions → New repository secret で以下を登録:

| Secret 名 | 値 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 手順 3 で作成したトークン |
| `CLOUDFLARE_ACCOUNT_ID` | 手順 2 で確認した Account ID |

## デプロイの仕組み

`.github/workflows/deploy.yml` の内容:

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy dist --project-name=project-hail-mary
```

| ブランチ | デプロイ先 |
|---|---|
| `main` | 本番（`https://hailmary.keroway.com`） |
| その他 | Cloudflare Pages のプレビュー URL（wrangler-action が自動生成） |

`main` へのプッシュまたはマージで自動的に本番デプロイが走る。

## セキュリティヘッダーの確認

`public/_headers` は Astro ビルド時に `dist/_headers` へそのままコピーされる。Cloudflare Pages がネイティブで処理するため、ビルド設定は不要。

デプロイ後、DevTools > Network タブでレスポンスヘッダーを確認する:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-cache`（HTML ファイル）

## トラブルシューティング

**ページが表示されない**
→ `npm run build` がローカルで通るか確認する。`dist/index.html` が生成されていることを確認する。

**Actions の wrangler ステップが失敗する**
→ GitHub Secrets (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`) が正しく設定されているか確認する。API Token の権限が「Cloudflare Pages — Edit」相当か確認する。Pages プロジェクト名が `project-hail-mary` と一致しているか確認する。

**`_headers` が効いていない**
→ ファイルパスが `public/_headers` であることを確認する。Astro ビルド時に `dist/_headers` へコピーされ、Cloudflare Pages 側で自動認識される。
