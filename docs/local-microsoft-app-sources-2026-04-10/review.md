# Review

## Evidence Summary

- OneDrive is a usable local source on this machine.
  - `/Users/steve.spivak/Library/CloudStorage/OneDrive-Cellebrite`
  - `/Users/steve.spivak/Library/CloudStorage/OneDrive-SharedLibraries-Cellebrite`
- Outlook has a real local profile store, but the repo does not yet have a proven local reader for it.
  - `/Users/steve.spivak/Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile`
- Teams has a local container, but the repo does not yet have durable local ingestion proof for it.
  - `/Users/steve.spivak/Library/Containers/com.microsoft.teams2/Data`

## Classification

- OneDrive: usable local source
- Outlook: partial local source
- Teams: provisional local source

## UI / Taxonomy Delta

- `Connected Accounts` must stay reserved for auth-backed cloud connectors.
- Local Microsoft folders and stores belong under `Knowledge Sources` or the web inventory's local-source lane.
- The desktop Microsoft rows in `Connected Accounts` must be described as optional cloud connectors, not local data access.

## First Implementation Target

- OneDrive synced folders are the first executable slice.
- Outlook local ingestion is deferred until a repo-backed reader is proven.
- Teams local ingestion is deferred until durable local artifact access is proven.
