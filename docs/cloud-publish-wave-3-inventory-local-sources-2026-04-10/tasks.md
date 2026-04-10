# Tasks

- [x] 1.1 Create a clean publish worktree from the Wave 2 branch.
  Done condition: a new `codex/publisher/...` worktree exists for the inventory/local-sources wave.

- [x] 1.2 Copy the in-scope inventory and local-source files into the clean worktree.
  Done condition: the clean worktree contains only the coherent slice needed for this wave.

- [x] 1.3 Run targeted validation for the web inventory and desktop settings surfaces.
  Done condition: lint/build/browser checks are recorded honestly, including anything still unproven.

- [x] 1.4 Run `node scripts/token-audit.js`.
  Done condition: the real audit result is captured as tooling truth, not guessed.

- [x] 1.5 Commit and push the wave branch to `SteveSpivak/rowboat`.
  Done condition: the branch exists on the fork.

- [x] 1.6 Link the published branch back to the cloud tracking issues.
  Done condition: GitHub issue history records the slice and any remaining proof gaps.
