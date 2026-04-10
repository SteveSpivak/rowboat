#!/bin/zsh
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${0}")/.." && pwd)"

if GIT_COMMON_DIR="$(git -C "$SCRIPT_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)"; then
  ROOT_DIR="$(cd "$(dirname "$GIT_COMMON_DIR")" && pwd)"
else
  ROOT_DIR="$SCRIPT_ROOT"
fi

ROLE="${1:-}"
TASK_ID="${2:-}"
BASE_REF="${3:-HEAD}"

if [[ -z "$ROLE" || -z "$TASK_ID" ]]; then
  echo "usage: scripts/create-role-worktree.sh <role> <task-id> [base-ref]" >&2
  exit 1
fi

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//'
}

ROLE_SLUG="$(slugify "$ROLE")"
TASK_SLUG="$(slugify "$TASK_ID")"

if [[ -z "$ROLE_SLUG" || -z "$TASK_SLUG" ]]; then
  echo "role and task-id must resolve to non-empty slugs" >&2
  exit 1
fi

WORKTREE_PATH="$ROOT_DIR/worktrees/$ROLE_SLUG/$TASK_SLUG"
BRANCH_NAME="codex/$ROLE_SLUG/$TASK_SLUG"

mkdir -p "$(dirname "$WORKTREE_PATH")"

cd "$ROOT_DIR"

if [[ -d "$WORKTREE_PATH/.git" || -f "$WORKTREE_PATH/.git" ]]; then
  echo "$WORKTREE_PATH"
  exit 0
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_REF"
fi

echo "$WORKTREE_PATH"
