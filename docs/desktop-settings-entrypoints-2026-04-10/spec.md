# Desktop Settings Entry Points

## Context

The desktop app launches successfully and the `Connected Accounts` settings pane now contains Composio-backed Microsoft entries for Outlook, Teams, and OneDrive. However, the panel is still difficult to prove end to end because there is no native desktop command surface for opening `Settings` or jumping directly to `Connected Accounts`.

## Goal

Add first-class desktop entry points for opening the Settings dialog and selecting the Connected Accounts tab, so the feature is both easier for users to reach and directly automatable for proof.

## Non-goals

- Do not redesign the settings dialog.
- Do not change the Connected Accounts data model.
- Do not add new connection providers in this slice.
- Do not broaden this into a full desktop command palette redesign.

## Owned surfaces

- `apps/x/apps/main/src/main.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`

## Requirements

### R1. Native Settings entry point

The desktop app must expose a native `Settings…` menu item with the standard accelerator.

### R2. Native Connected Accounts entry point

The desktop app must expose a native `Connected Accounts…` menu item that opens the Settings dialog directly to the Connected Accounts tab.

### R3. Renderer handling

The renderer must accept a main-process signal to open Settings and optionally target a specific tab without requiring brittle UI clicking.

### R4. Existing in-app entry points stay intact

The existing sidebar `Settings` and `Connect Accounts` entry points must continue to work.

## Acceptance criteria

1. The desktop app menu shows `Settings…`.
2. The desktop app menu shows `Connected Accounts…`.
3. Triggering either menu item opens the dialog in the expected state.
4. Triggering `Connected Accounts…` selects the Connected Accounts tab.
5. The desktop renderer still builds and the desktop app still launches.

