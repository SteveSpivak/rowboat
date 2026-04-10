# Token Audit And Worktree Bootstrap

## Goal

Add the missing token-audit command required by the repo instructions and bootstrap a reusable Git worktree workflow for Rowboat using patterns that already worked in the user's other repositories.

## Current Truth

- The repo instructions require `node scripts/token-audit.js` before completion.
- `scripts/token-audit.js` does not exist in this repository today.
- The repository also lacks a local helper for creating role or task scoped Git worktrees.
- The current working tree is already dirty, so any new worktree must be created safely from committed Git state and must not assume a clean root checkout.

## Decisions

1. Add a repo-root `scripts/` directory.
2. Add `scripts/token-audit.js` as a portable Node script that audits CSS-family files for raw values outside token definitions.
3. Add a reusable shell helper to create task-scoped worktrees using the existing `codex/` branch convention.
4. Add a matching remove helper and a short worktree policy doc so other agents can reuse the same flow.
5. Create one initial worktree from committed state to prove the helper works.

## Requirements

### Token audit

- `node scripts/token-audit.js` must run from the repo root.
- The script must recursively scan CSS-family files under the repo while skipping common generated directories.
- It must allow token definitions and `var(...)` usage.
- It must fail on raw CSS values outside allowed keywords.

### Worktree helper

- The helper must create worktrees under `worktrees/<role>/<task-id>/`.
- The helper must create or reuse a branch named `codex/<role>/<task-id>`.
- It must work from the repo root even when the repo is already inside a worktree.
- It must not require a clean working tree in the current checkout.
- It must print the created or reused path.

### Proof

- The token audit must execute successfully or fail with actionable output.
- The worktree helper must be exercised once and the resulting worktree must appear in `git worktree list`.

## Non-Goals

- solving all existing token violations in this change if the repo already contains many
- moving current uncommitted changes into the new worktree
- introducing GitHub API automation or PR automation in this slice

## Success Criteria

1. `scripts/token-audit.js` exists and is runnable from the repo root.
2. `scripts/create-role-worktree.sh` exists and creates task worktrees using the repo's branch convention.
3. A matching removal helper and policy doc exist.
4. One worktree is created successfully as proof.
