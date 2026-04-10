# Plan

## 1. Freeze the desktop slice

- Use the published Wave 4 branch as the comparison baseline.
- Include only the four unpublished desktop renderer files in this wave.
- Exclude already-published desktop menu and dialog entry-point work.

## 2. Publish the desktop connected-account delta

- Move the remaining desktop renderer changes into a clean publish worktree.
- Keep the Microsoft entries explicitly described as optional Composio-backed cloud connectors.
- Preserve the local Microsoft source path as a Knowledge Sources concern.

## 3. Publish the proof-hardening fixes with the same slice

- Keep `workspace:readdir` calls workspace-relative in analytics identity.
- Check for `config/exa-search.json` before attempting to read it.
- Treat these as proof-hardening, not feature expansion.

## 4. Validate honestly

- Build `apps/x/apps/renderer`.
- Launch `apps/x` and inspect the resulting logs for the previously observed `workspace:readdir` and Exa-config noise.
- Run `node scripts/token-audit.js` and record the actual outcome.

## 5. Publish and record

- Commit the slice on a new `codex/publisher/...` branch.
- Push to `SteveSpivak/rowboat`.
- Link the branch and proof summary back to the desktop/runtime issues.
