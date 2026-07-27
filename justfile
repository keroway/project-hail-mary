# keroway 標準 justfile。中身は既存の package.json scripts への薄い委譲のみ。
# このリポジトリは npm（ワークスペース標準は pnpm。移行コストが高いため justfile で
# インタフェースだけ揃える）。

default:
    @just --list

build:
    npm run build

test:
    npm run test:e2e

lint:
    npm run lint

format:
    npm run format

# lint / typecheck (astro check) / e2e test をまとめて実行（コミット前の全通し確認）
check:
    npm run lint
    npm run check
    npm run test:e2e
