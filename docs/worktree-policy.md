# Worktree Policy

## Purpose

Use task-scoped Git worktrees so implementation, review, and orchestration can run in parallel without writing directly into the same checkout.

## Canonical Layout

- Root: `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/worktrees/`
- Role directories:
  - `worktrees/<role>/`
- Task directories:
  - `worktrees/<role>/<task-id>/`

## Branch Naming

- Branch pattern: `codex/<role>/<task-id>`
- Keep the task slug recognizable and tied to the work being done.

## Lifecycle

1. Create a worktree:
   ```bash
   scripts/create-role-worktree.sh reviewer rowboat-local-microsoft-review
   ```
2. Do the assigned work inside that worktree.
3. Validate and record proof in tracked repo paths.
4. Reconcile or merge the branch when ready.
5. Remove the worktree:
   ```bash
   scripts/remove-role-worktree.sh reviewer rowboat-local-microsoft-review
   ```

## Rules

- Worktrees are created from committed Git state only.
- Uncommitted changes in the current checkout do not automatically appear in a new worktree.
- Use a separate worktree when you want clean isolation for review, QA, or a new implementation slice.
- Do not use worktrees as a substitute for source-of-truth docs; keep spec, plan, and tasks in the canonical repo.

## Validation

- `git worktree list` must show the canonical root plus the created worktree.
- The worktree branch must follow the `codex/<role>/<task-id>` format.
