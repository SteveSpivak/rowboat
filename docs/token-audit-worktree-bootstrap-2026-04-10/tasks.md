# Tasks

- [x] 1.1 Add `scripts/token-audit.js`.
  Done condition: the required command exists at the repo root and scans CSS-family files with useful failure output.

- [x] 1.2 Add `scripts/create-role-worktree.sh`.
  Done condition: a role/task worktree can be created under `worktrees/<role>/<task-id>/` on a `codex/<role>/<task-id>` branch.

- [x] 1.3 Add `scripts/remove-role-worktree.sh`.
  Done condition: a created worktree can be removed safely by role and task id.

- [x] 1.4 Add `docs/worktree-policy.md`.
  Done condition: other agents have a stable, repo-backed worktree policy to follow.

- [x] 2.1 Run the token audit.
  Done condition: the command executes and the result is captured honestly.

- [x] 2.2 Create one proof worktree.
  Done condition: `git worktree list` shows the new path.
