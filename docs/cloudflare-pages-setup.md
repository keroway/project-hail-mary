# Cloudflare Pages セットアップ手順

## 概要

このサイトは GitHub Actions + `cloudflare/wrangler-action@v3` で Cloudflare Pages に **direct upload** するデプロイ方式を採用している。Cloudflare Pages の Git Integration（Connect to Git）は使わない。

```
main push → GitHub Actions → pnpm run build → wrangler pages deploy dist
```

## 前提条件

- Cloudflare アカウント（無料プランで可）
- GitHub リポジトリ: `keroway/project-hail-mary`
- ローカルで `pnpm run build` が成功すること

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

デプロイは 2 つの workflow に分かれている。

### 本番デプロイ（`.github/workflows/deploy.yml`）

`main` への push（＝ PR のマージ）だけをトリガーとする。

```yaml
- uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    # Cloudflare Pages API は非 ASCII（日本語等）の git コミットメッセージを
    # code:8000111 で弾くため、追跡用に commit SHA を明示指定して自動検出を回避する。
    command: pages deploy dist --project-name=project-hail-mary --commit-hash=${{ github.sha }} --commit-message=${{ github.sha }}
```

### PR プレビューデプロイ（`.github/workflows/ci.yml` の `deploy-preview` job）

`main` 向け PR（`pull_request: branches: [main]`）で起動する CI workflow の一部として実行される。以下をすべて満たす場合のみ動く（必須チェックではないため、スキップされてもマージはブロックされない）:

- `src/**` や `package.json` など「コードとみなすパス」（`changes` job 定義）に変更があること（`docs/**` のみの変更ではスキップされる）
- PR の head が fork ではなく同一リポジトリ（`keroway/project-hail-mary`）からであること（fork には Secrets が渡らないため）
- PR の作成者が `dependabot[bot]` ではないこと

条件を満たすとプレビュー URL を wrangler-action が自動生成し、結果を PR コメントへ投稿する。

| トリガー | ブランチ / イベント | デプロイ先 |
|---|---|---|
| `deploy.yml` | `main` への push（PR マージ） | 本番（`https://hailmary.keroway.com`） |
| `ci.yml` の `deploy-preview` | `main` 向け PR（同一リポジトリ・非 Dependabot・コード変更あり） | Cloudflare Pages のプレビュー URL（wrangler-action が自動生成） |

`main` 以外へのブランチ push 自体は、どちらの workflow のトリガーにもならない。

## セキュリティヘッダーの確認

`public/_headers` は Astro ビルド時に `dist/_headers` へそのままコピーされる。Cloudflare Pages がネイティブで処理するため、ビルド設定は不要。

デプロイ後、DevTools > Network タブでレスポンスヘッダーを確認する:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: no-cache`（HTML ファイル）

## トラブルシューティング

**ページが表示されない**
→ `pnpm run build` がローカルで通るか確認する。`dist/index.html` が生成されていることを確認する。

**Actions の wrangler ステップが失敗する**
→ GitHub Secrets (`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`) が正しく設定されているか確認する。API Token の権限が「Cloudflare Pages — Edit」相当か確認する。Pages プロジェクト名が `project-hail-mary` と一致しているか確認する。日本語コミットメッセージが原因で `code:8000111` エラーが出る場合は、`--commit-hash` / `--commit-message` フラグが正しく設定されているか確認する。

**`_headers` が効いていない**
→ ファイルパスが `public/_headers` であることを確認する。Astro ビルド時に `dist/_headers` へコピーされ、Cloudflare Pages 側で自動認識される。
