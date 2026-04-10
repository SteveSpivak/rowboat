# Plan

## Slice

Publish only the remaining web-app tools and connected-app cleanup, separate from Wave 3 inventory/local-sources work.

## Base Branch

Start from:

- `codex/publisher/rowboat-cloud-publish-wave-3-inventory-local-sources-2026-04-10`

## Steps

1. Create a clean publish worktree from the Wave 3 branch.
2. Copy only the web tools/connected-app files in scope.
3. Run targeted web validation:
   - lint on the touched files
   - route-level proof for tools, settings, and triggers surfaces if the app is reachable
   - honest token-audit run
4. Commit and push the branch.
5. Link the branch back to the cloud publish and feature issues.

## Deferred Work

- desktop runtime-hardening leftovers
- Outlook and Teams local readers
- broader connector/account model refactors outside this surface
