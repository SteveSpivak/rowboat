# Plan

## Scope

Implement two missing repo hygiene surfaces:

- token audit
- reusable task worktree creation

Then run each once for proof.

## Implementation Strategy

### 1. Add repo-root script surfaces

- create `scripts/`
- add a CommonJS `token-audit.js`
- add `create-role-worktree.sh`
- add `remove-role-worktree.sh`

### 2. Use prior working patterns

- copy the token-audit behavior from the user's other repos
- copy the role/task worktree shape from the existing `New AI Base 2` script
- adapt names and paths for Rowboat instead of hard-coding another repo's role list

### 3. Keep worktree creation generic

- allow arbitrary role slugs instead of a fixed role enum
- keep branch format `codex/<role>/<task-id>`
- keep path format `worktrees/<role>/<task-id>`

### 4. Document the workflow

- add a short `docs/worktree-policy.md`
- document what the helper does and what it does not do
- explicitly note that worktrees come from committed state only

### 5. Prove the slice

- run `node scripts/token-audit.js`
- create one worktree using the helper
- verify with `git worktree list`

## Risks

- the repo may already contain raw CSS values that cause the audit to fail immediately
- the current branch is already checked out in the root, so the new worktree must use a new branch
- uncommitted changes in the root will not appear in the new worktree

## Mitigations

- keep audit output specific and line-based
- create the worktree from `HEAD` on a new branch
- report clearly that the worktree reflects committed state only
