# Project Hail Mary — Claude Code ガイド

## プロジェクト概要

小説「プロジェクトへイルメアリー」の科学入門ガイドサイト。
中学2年生の長男が映画鑑賞前に科学的記述を理解するための補助資料。

- **ホスティング**: Cloudflare Pages（静的サイト）
- **フレームワーク**: Astro 6（静的出力）
- **ビルド出力**: `dist/`
- **本番URL**: https://hailmary.keroway.com
- **本番ブランチ**: `main`（PR マージ → GitHub Actions → Cloudflare Pages 自動デプロイ）
- **デプロイ方式**: GitHub Actions（`.github/workflows/deploy.yml`）で `wrangler pages deploy` を実行
- **リポジトリ公開設定**: public（Secret scanning / push protection / CodeQL を無料利用するため）

## リポジトリ構成

```
src/
├── layouts/
│   └── BaseLayout.astro      # 共通レイアウト（ナビ・ViewTransitions・ネタバレスクリプト）
├── components/
│   ├── SpoilerGate.astro     # ネタバレロックコンポーネント
│   └── ScienceDiagram.astro  # SVGベース科学概念図（軌道・振り子・スペクトル等をkindプロップで切替）
├── styles/
│   └── global.css            # 共通CSS（変数・コンポーネントスタイル）
└── pages/
    ├── index.astro            # トップ（読了章設定UI）
    ├── story.astro            # ストーリー順インデックス
    ├── physics.astro          # 物理編
    ├── chemistry.astro        # 化学編
    ├── biology.astro          # 生物編
    └── math.astro             # 数学編
public/
└── _headers                   # Cloudflare セキュリティヘッダー（変更不要）
.github/workflows/
├── ci.yml                     # PR で型チェック・ビルド・プレビューデプロイ（必須チェック）
└── deploy.yml                 # main push（PR マージ）→ Cloudflare Pages デプロイ
```

## よくある作業

### コンテンツを更新する

各 `src/pages/*.astro` を編集し、ブランチを切って PR を作成する。`main` はブランチ保護
ルールセットで保護されており、**直接プッシュは不可**。CI（型チェック・ビルド）通過後に
マージすると Cloudflare Pages が自動ビルド・デプロイする。

```bash
git switch -c update/<変更内容>
git add src/pages/physics.astro
git commit -m "Update: <変更内容>"
git push -u origin HEAD
gh pr create --fill            # PR 作成 → CI 通過
gh pr merge --squash --admin   # 自分の PR は承認なしでマージ（admin バイパス行使）
```

> admin が自分の PR をマージする際は `--admin`（または GitHub UI の「Merge without waiting」）で
> バイパスを明示的に行使する。通常の `gh pr merge` は承認1件要件で弾かれる。

### ローカルで確認する

```bash
npm run dev      # 開発サーバー起動（http://localhost:4321）
npm run build    # 本番ビルド（dist/ に出力）
npm run preview  # ビルド結果をプレビュー
```

### ネタバレ閾値を変更する

各ページの `<SpoilerGate>` の `minChapter` プロップを変更する。

- `minChapter={9}` → 第9章以降に解放（ロッキー登場）
- `minChapter={25}` → 第25章以降に解放（終盤）

## コンテンツ方針

- 読者は中学2年生（科学に興味あり、基礎的な中学理科レベル）
- 小説の科学記述を補助する内容（過度な専門用語は避ける）
- 映画では省略されている小説固有の科学的考察を重視する

## デザイン方針

- 宇宙・深夜をイメージした暗色テーマ（変更しない）
- 各教科にアクセントカラーあり（物理=青、化学=紫、生物=緑、数学=アンバー）
- Astro ClientRouter でページ遷移アニメーション
- ボタン・カードのホバー/アクティブアニメーションは `global.css` で管理

## 注意事項

- `public/_headers` は Cloudflare Pages のセキュリティヘッダー設定。変更不要。
- `main` はブランチ保護ルールセット（`main protection`）で保護。**PR 経由 + CI 通過が必須**、
  force-push / ブランチ削除は禁止、直接プッシュは（admin 含め）不可。
  - レビュー承認は1件必須。ただし admin（リポジトリ管理者）は PR コンテキストの bypass を持ち、
    自分の PR は承認なしでマージ可。admin 以外のコラボレーターの PR は admin の承認が必要。
- GitHub Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` が必要（設定済み）。
  Secret scanning + push protection が有効なため、トークン等を誤コミットするとブロックされる。
- 依存更新は Dependabot（`.github/dependabot.yml`）が npm と GitHub Actions を毎週末チェックし、公開後5日経過したバージョンのみ PR を作成する（major は手動更新、minor/patch はグループ化して 1 PR にまとめる）。
