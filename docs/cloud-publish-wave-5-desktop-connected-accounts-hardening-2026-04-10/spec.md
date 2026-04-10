# Cloud Publish Wave 5: Desktop Connected Accounts And Runtime Hardening

## Goal

Publish the next coherent desktop slice that:

- exposes the remaining Microsoft cloud connector entries in desktop `Connected Accounts`
- generalizes the desktop Composio connection state so those entries actually work
- keeps local Microsoft data separate from cloud connected-account actions
- removes the current desktop proof noise caused by invalid workspace paths and eager Exa config reads

## Current Truth

- Wave 3 already published the desktop menu entry points and Settings dialog targeting.
- The remaining unpublished desktop renderer delta is concentrated in four files:
  - `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
  - `apps/x/apps/renderer/src/hooks/useConnectors.ts`
  - `apps/x/apps/renderer/src/hooks/useAnalyticsIdentity.ts`
  - `apps/x/apps/renderer/src/components/chat-input-with-mentions.tsx`
- This delta is cohesive:
  - Connected Accounts gains Microsoft cloud connector rows for Outlook, Teams, and OneDrive.
  - `useConnectors` stops hard-coding Gmail and Google Calendar assumptions and manages the Microsoft Composio toolkit states through the same desktop flow.
  - the desktop launch path stops emitting avoidable proof noise for `workspace:readdir` and missing `config/exa-search.json`.

## Requirements

### R1. Desktop connected accounts stay honest

Desktop `Connected Accounts` must present Outlook, Teams, and OneDrive as optional Composio-backed cloud connectors, not as local folder or desktop-store integrations.

### R2. Generic Composio state handling

The renderer connector hook must support the full set of desktop-exposed Composio toolkits used in this slice, including Microsoft entries, without duplicating one-off Gmail-only logic.

### R3. Local-vs-cloud boundary remains explicit

Desktop copy must direct local Microsoft file ingestion to Knowledge Sources and reserve `Connected Accounts` for cloud-backed actions.

### R4. Desktop proof loop is quieter

- `workspace:readdir` calls from analytics identity must stay workspace-relative.
- missing `config/exa-search.json` must not create avoidable startup read errors.

### R5. No scope drift

- Do not redesign the settings dialog.
- Do not add new native menu items in this wave.
- Do not change the web app.
- Do not introduce new Microsoft provider types beyond the existing Composio-backed cloud connector model.

## File Groups

### Desktop renderer

- `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
- `apps/x/apps/renderer/src/hooks/useConnectors.ts`
- `apps/x/apps/renderer/src/hooks/useAnalyticsIdentity.ts`
- `apps/x/apps/renderer/src/components/chat-input-with-mentions.tsx`

### Wave docs

- `docs/cloud-publish-wave-5-desktop-connected-accounts-hardening-2026-04-10/spec.md`
- `docs/cloud-publish-wave-5-desktop-connected-accounts-hardening-2026-04-10/plan.md`
- `docs/cloud-publish-wave-5-desktop-connected-accounts-hardening-2026-04-10/tasks.md`
- `docs/cloud-publish-wave-5-desktop-connected-accounts-hardening-2026-04-10/review.md`

## Explicit Exclusions

- `apps/x/apps/main/src/main.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`
- `apps/x/packages/shared/src/ipc.ts`

Those entry-point changes were already published in the earlier desktop convergence wave and must not be re-bundled here.

## Success Criteria

1. Desktop `Connected Accounts` shows Microsoft Outlook, Microsoft Teams, and OneDrive as optional cloud connectors.
2. The desktop Composio flow can target those entries through the shared connector hook.
3. The copy keeps local Microsoft ingestion pointed at Knowledge Sources instead of Connected Accounts.
4. Desktop renderer build passes.
5. A desktop launch proof no longer shows the avoidable `workspace:readdir` and missing Exa config errors caused by the old renderer behavior.
6. `node scripts/token-audit.js` still runs and its real result is recorded.
