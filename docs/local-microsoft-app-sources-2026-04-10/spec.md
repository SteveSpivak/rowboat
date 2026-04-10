# Local Microsoft App Sources

## Goal

Integrate Microsoft Outlook, Teams, and OneDrive/SharePoint through locally available app data and local machine access, not through cloud connector APIs as the primary path.

## Requirement Correction

The target is **not**:

- Composio-backed Microsoft actions
- Graph/M365 API-first integration
- cloud auth as the required setup path

The target **is**:

- detect and use locally installed Microsoft apps and their locally available data
- make that data available to Rowboat as local sources where feasible
- only use cloud APIs as a fallback or later extension, not the baseline requirement

## Current Truth

### Confirmed in repo

- Desktop Microsoft entries currently exist only as Composio-backed connected apps.
- Web Microsoft planning docs currently assume connector/API-style integration.
- There is no confirmed local-source bridge for Outlook, Teams, or OneDrive in the repo today.

### Unknowns that matter

- which local Microsoft app data is actually readable on this machine
- whether the installed apps expose durable local files vs transient caches
- whether Teams local data is useful enough to treat as a supported source
- whether OneDrive local files should be treated simply as folder roots rather than a special connector

## Decisions

1. Local Microsoft app data is a separate integration class from connected accounts.
2. Outlook, Teams, and OneDrive must not be presented as “connected accounts” if the real target is local-source access.
3. OneDrive local sync folders likely belong under folder/knowledge-root inventory first.
4. Outlook and Teams local ingestion must be proven against actual local artifacts before any UI promise is shipped.
5. API-backed Microsoft connectors can remain an optional later lane, but they do not satisfy this requirement by themselves.

## Required Outcome

- The repo must distinguish:
  - local app sources
  - connected cloud accounts
  - optional API-backed connectors
- The next proof slice must determine what local Outlook, Teams, and OneDrive data is actually available on this machine.
- UI copy must stop implying that Composio-backed Microsoft rows satisfy the local-data requirement.

## Non-Goals

- building Microsoft Graph as the primary baseline
- claiming Teams/Outlook local ingestion works before the local artifact paths are proven
- forcing OneDrive into a custom connector if local synced folders are already enough

## Success Criteria

1. The repo has a clear spec separating local Microsoft sources from cloud Microsoft connectors.
2. A proof plan exists for local Outlook, Teams, and OneDrive discovery on macOS.
3. Future implementation can remove or relabel misleading Microsoft connected-account surfaces.
