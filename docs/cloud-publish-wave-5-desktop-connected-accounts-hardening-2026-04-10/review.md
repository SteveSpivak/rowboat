# Review

## Scope

Wave 5 publishes the remaining desktop renderer slice that completes the Microsoft cloud connector entries in `Connected Accounts` and carries the proof-hardening fixes needed for a cleaner `apps/x` launch.

## Included Changes

- `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
  - Adds Microsoft Outlook, Microsoft Teams, and OneDrive rows to desktop `Connected Accounts`.
  - Keeps those entries explicitly described as optional Composio-backed cloud connectors.
  - Directs local Microsoft folder and desktop-store ingestion to Knowledge Sources instead of Connected Accounts.
- `apps/x/apps/renderer/src/hooks/useConnectors.ts`
  - Reworks the desktop Composio state handling so Gmail, Google Calendar, Outlook, Teams, and OneDrive all flow through the same connector logic.
  - Removes the old Gmail-only assumptions from the desktop connector state model.
- `apps/x/apps/renderer/src/hooks/useAnalyticsIdentity.ts`
  - Fixes `workspace:readdir` calls to use workspace-relative paths instead of absolute-style paths.
- `apps/x/apps/renderer/src/components/chat-input-with-mentions.tsx`
  - Checks whether `config/exa-search.json` exists before attempting to read it, so missing optional config no longer creates avoidable startup file-read noise.

## Explicit Exclusions

- `apps/x/apps/main/src/main.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`
- `apps/x/packages/shared/src/ipc.ts`

Those desktop entry-point changes were already published in an earlier wave and were intentionally excluded from this branch.

## Validation

### Targeted lint

- Command:
  - `npx eslint src/components/chat-input-with-mentions.tsx src/components/settings/connected-accounts-settings.tsx src/hooks/useAnalyticsIdentity.ts src/hooks/useConnectors.ts`
- Working directory:
  - `apps/x/apps/renderer`
- Result:
  - Passed in the clean Wave 5 publish worktree.

### Renderer build

- Command:
  - `npm run build`
- Working directory:
  - `apps/x/apps/renderer`
- Result:
  - Passed in the clean Wave 5 publish worktree.

### Desktop launch proof

- Command:
  - `npm run dev`
- Working directory:
  - `apps/x`
- Result:
  - Shared, core, preload, renderer, and main all built successfully in the clean Wave 5 publish worktree.
  - Electron launched successfully from the worktree.
  - The captured startup logs did not show the old renderer-side proof blockers:
    - no `Absolute paths are not allowed`
    - no avoidable `config/exa-search.json` read failure from startup feature detection

### Remaining runtime noise

The desktop launch is cleaner, but not fully silent. Existing unrelated environment/runtime noise still appears, including:

- missing Google OAuth scopes for Gmail and Calendar
- missing `Voice Memos` directory for the graph builder
- Fireflies auth/client availability noise

Those pre-existing runtime conditions are outside the Wave 5 file set.

## Token Audit

- Command:
  - `node scripts/token-audit.js`
- Result:
  - Failed on the existing repo-wide raw-CSS backlog outside this desktop slice.
- Representative failures:
  - `apps/rowboat/app/globals.css`
  - `apps/rowboat/app/lib/components/mentions-editor.css`
  - `apps/rowboat/app/styles/quill-mentions.css`
  - `apps/rowboatx/components/json-editor.css`

## Outcome

Wave 5 is valid to publish as the next coherent desktop slice.

The branch truth is:

- desktop Connected Accounts now exposes the Microsoft cloud connector rows through the shared Composio flow
- local Microsoft ingestion remains a Knowledge Sources concern, not a Connected Accounts claim
- the two targeted desktop proof blockers are fixed
- the token audit is still a real repo-wide blocker, but not one introduced by this wave
