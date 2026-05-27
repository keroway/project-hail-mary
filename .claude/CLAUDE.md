# Project Hail Mary — Claude Code ガイド

## プロジェクト概要

小説「プロジェクトへイルメアリー」の科学入門ガイドサイト。
中学2年生の長男が映画鑑賞前に科学的記述を理解するための補助資料。

- **ホスティング**: Cloudflare Pages（静的サイト）
- **フレームワーク**: Astro 5（静的出力）
- **ビルド出力**: `dist/`
- **本番URL**: https://hailmary.keroway.com
- **本番ブランチ**: `main`（プッシュ → GitHub Actions → Cloudflare Pages 自動デプロイ）
- **デプロイ方式**: GitHub Actions（`.github/workflows/deploy.yml`）で `wrangler pages deploy` を実行

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
└── deploy.yml                 # main push → Cloudflare Pages デプロイ
```

## よくある作業

### コンテンツを更新する

各 `src/pages/*.astro` を編集してプッシュ。Cloudflare Pages が自動ビルド・デプロイする。

```bash
git add src/pages/physics.astro
git commit -m "Update: <変更内容>"
git push origin main
```

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
- `main` ブランチへの直接プッシュ可（小規模プロジェクトのため）。
- GitHub Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` が必要（設定済み）。
- 依存更新は Dependabot（`.github/dependabot.yml`）が npm と GitHub Actions を毎週末チェックし、公開後5日経過したバージョンのみ PR を作成する（major は手動更新）。
