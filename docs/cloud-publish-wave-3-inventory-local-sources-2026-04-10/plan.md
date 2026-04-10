# Plan

## Slice

Publish the next coherent code branch for:

- dual-app inventory visibility
- local folder roots
- local Microsoft source discovery
- OneDrive local import baseline

## Base Branch

Start from:

- `codex/publisher/rowboat-cloud-publish-wave-2-doc-truth-2026-04-10`

This keeps the published docs truthful about `scripts/token-audit.js` and the CSS backlog.

## Steps

1. Create a clean publish worktree from the Wave 2 branch.
2. Copy the in-scope code and docs from the dirty local tree into the clean worktree.
3. Run targeted validation:
   - web lint for the inventory/local-source files
   - desktop renderer build
   - browser verification for the inventory route if the local dev server is available
   - honest token-audit run
4. Commit and push the branch.
5. Link the branch back to the relevant GitHub issues and record any proof gaps.

## Deferred Work

- Outlook local reader implementation
- Teams local reader implementation
- broad connected-account/cloud-connector cleanup
- desktop-proof-hardening fixes not required by this slice
