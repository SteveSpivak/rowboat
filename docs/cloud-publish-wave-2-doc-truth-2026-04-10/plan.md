# Plan

## Slice

Publish only the documentation and review state needed to keep the cloud record accurate.

## Files In Scope

- `docs/cloud-sync-project-bootstrap-2026-04-10/*`
- `docs/open-agent-stack-rollout-2026-04-09/plan.md`
- `docs/open-agent-stack-rollout-2026-04-09/review.md`
- `docs/open-agent-stack-rollout-2026-04-09/runtime-proof.md`
- `docs/local-microsoft-app-sources-2026-04-10/agent-update.md`

## Steps

1. Create a clean publish worktree from `HEAD`.
2. Copy only the docs in scope into that worktree.
3. Run the repo token audit and record the real result.
4. Commit the doc-only slice on a new `codex/publisher/...` branch.
5. Push the branch to the fork.
6. Comment on the cloud publish issue with the new branch.
