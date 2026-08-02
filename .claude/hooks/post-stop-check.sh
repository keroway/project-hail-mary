#!/usr/bin/env bash
# Claude Code Stop hook: turn-end validation for changed areas only.
#
# Mirrors the CI lint/typecheck jobs (.github/workflows/ci.yml):
#   lint job      -> pnpm run lint  (biome ci)
#   typecheck job -> pnpm run check (astro check)
#
# test:e2e (Playwright) is intentionally NOT run here: its own webServer
# rebuilds the site and boots a preview server (playwright.config.ts,
# 120s timeout) before a single test runs, which is too slow for a
# turn-end gate. It stays covered by CI's "E2E Smoke Tests" job.
#
# The validation layer blocks on failure (exit 2): unlike a formatter, it must
# not silently pass when it cannot establish its working directory or tools.

set -u

INPUT="$(cat || true)"

# Prevent a blocking hook failure from repeatedly restarting Claude. jq is not
# guaranteed to be installed, so retain this fallback rather than defaulting to
# false when jq is unavailable.
if command -v jq >/dev/null 2>&1; then
  STOP_HOOK_ACTIVE="$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
else
  COMPACT_INPUT="$(printf '%s' "$INPUT" | tr -d ' \t\n\r')"
  case "$COMPACT_INPUT" in
    *'"stop_hook_active":true'*) STOP_HOOK_ACTIVE=true ;;
    *) STOP_HOOK_ACTIVE=false ;;
  esac
fi
[ "$STOP_HOOK_ACTIVE" = true ] && exit 0

if [ "${HAILMARY_SKIP_STOP_HOOK:-}" = 1 ]; then
  exit 0
fi

# Do not silently treat an unknown directory as a successful validation.
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
if ! cd "$PROJECT_DIR" 2>/dev/null; then
  {
    echo "Stop hook: cannot cd to PROJECT_DIR ($PROJECT_DIR); validation was not run."
    echo "  Set HAILMARY_SKIP_STOP_HOOK=1 only to bypass this temporarily."
  } >&2
  exit 2
fi
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  {
    echo "Stop hook: $(pwd) is not a Git repository; changed files cannot be determined."
    echo "  Set HAILMARY_SKIP_STOP_HOOK=1 only to bypass this temporarily."
  } >&2
  exit 2
fi

# Include uncommitted, untracked, and unpushed changes. Do not substitute a
# fixed number of recent commits: that makes unrelated changes run every turn.
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)"
if [ -n "$UPSTREAM" ]; then
  UNPUSHED_RANGE="${UPSTREAM}..HEAD"
elif git rev-parse --verify origin/main >/dev/null 2>&1; then
  UNPUSHED_RANGE="origin/main..HEAD"
else
  UNPUSHED_RANGE=""
fi
CHANGED_FILES="$(
  {
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
    if [ -n "$UNPUSHED_RANGE" ]; then
      git log --name-only --pretty=format: "$UNPUSHED_RANGE" 2>/dev/null || true
    fi
  } | sed '/^$/d' | sort -u
)"
[ -z "$CHANGED_FILES" ] && exit 0

# Scope boundaries match the CI lint/typecheck jobs: both run over the whole
# repo (biome ci / astro check take no path filters), so any tracked source,
# content, or config change is enough to trigger both.
CODE_CHANGED=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  case "$file" in
    src/*|tests/*|public/*|package.json|astro.config.mjs|tsconfig.json|biome.json*) CODE_CHANGED=1 ;;
  esac
done <<EOF
$CHANGED_FILES
EOF
[ "$CODE_CHANGED" -eq 0 ] && exit 0

FAILED=0
REPORT=""
append_report() { REPORT="${REPORT}$1"$'\n'; }
run_step() {
  local label="$1"
  shift
  local output rc=0
  echo "→ [stop-hook] $label" >&2
  output="$("$@" 2>&1)" || rc=$?
  if [ "$rc" -ne 0 ]; then
    FAILED=1
    append_report ""
    append_report "FAIL: $label (rc=$rc)"
    append_report "Command: $*"
    append_report "$output"
  fi
}

if ! command -v pnpm >/dev/null 2>&1; then
  {
    echo "Stop hook: pnpm is unavailable; validation was not run."
    echo "  Set HAILMARY_SKIP_STOP_HOOK=1 only to bypass this temporarily."
  } >&2
  exit 2
fi

run_step "lint" pnpm run --silent lint
run_step "typecheck" pnpm run --silent check

if [ "$FAILED" -eq 1 ]; then
  {
    echo "Stop hook: validation failed; fix the reported failures before completing."
    echo "  To bypass temporarily: HAILMARY_SKIP_STOP_HOOK=1"
    echo "$REPORT"
  } >&2
  exit 2
fi

exit 0
