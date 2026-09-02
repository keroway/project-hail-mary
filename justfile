# keroway 標準 justfile。中身は既存の package.json scripts への薄い委譲のみ。

default:
    @just --list

build:
    pnpm run build

test:
    pnpm run test:e2e

lint:
    pnpm run lint

format:
    pnpm run format

# lint / typecheck (astro check) / unit test / e2e test をまとめて実行（コミット前の全通し確認）
check:
    pnpm run lint
    pnpm run check
    pnpm run test:unit
    pnpm run test:e2e
