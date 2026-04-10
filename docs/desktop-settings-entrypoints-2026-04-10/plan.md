# Plan

## Decision

Use a native Electron application menu plus a renderer event bridge.

## Reasoning

- The accessibility tree for the custom renderer UI is too shallow for reliable UI scripting.
- A native menu is good product behavior on macOS and creates a stable automation surface.
- The renderer already has an internal `rowboat:open-settings` event contract, so the smallest change is to let the main process invoke that behavior directly.

## Steps

1. Add a native application menu in the main process.
2. Add `Settings…` and `Connected Accounts…` menu items with accelerators.
3. Send a renderer signal from the main process when those menu items are invoked.
4. Update the renderer to translate the main-process signal into the existing settings-open behavior.
5. Launch the desktop app and verify the menu-driven flow visually.

## Proof targets

- Menu items exist.
- `Settings…` opens the dialog.
- `Connected Accounts…` opens the dialog to the correct tab.

