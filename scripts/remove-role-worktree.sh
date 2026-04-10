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
DELETE_BRANCH="${3:-}"

if [[ -z "$ROLE" || -z "$TASK_ID" ]]; then
  echo "usage: scripts/remove-role-worktree.sh <role> <task-id> [--delete-branch]" >&2
  exit 1
fi

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//'
}

ROLE_SLUG="$(slugify "$ROLE")"
TASK_SLUG="$(slugify "$TASK_ID")"
WORKTREE_PATH="$ROOT_DIR/worktrees/$ROLE_SLUG/$TASK_SLUG"
BRANCH_NAME="codex/$ROLE_SLUG/$TASK_SLUG"

cd "$ROOT_DIR"

if [[ ! -d "$WORKTREE_PATH" ]]; then
  echo "worktree does not exist: $WORKTREE_PATH" >&2
  exit 1
fi

git worktree remove "$WORKTREE_PATH"
git worktree prune

if [[ "$DELETE_BRANCH" == "--delete-branch" ]]; then
  git branch -D "$BRANCH_NAME"
fi

echo "$WORKTREE_PATH"
