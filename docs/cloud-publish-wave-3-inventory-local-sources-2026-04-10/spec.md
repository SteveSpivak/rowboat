# Cloud Publish Wave 3: Inventory And Local Sources Baseline

## Goal

Publish the next coherent `rowboat` code slice by pushing the dual-app inventory surfaces and the local-source baseline that already exist in the local tree.

## Current Truth

- Wave 1 tooling and Wave 2 doc-truth branches are already published.
- The local tree now contains a working inventory direction across both apps:
  - web project inventory
  - desktop `Tools & Skills` hub
  - local folder roots
  - local Microsoft source discovery with OneDrive import as the first executable lane
- These changes are coupled across desktop and web. Trying to split them into fake micro-branches would require backing out working dependencies from `settings-dialog.tsx`, the inventory route, and the local file/RAG path.

## Decision

Wave 3 should publish a single inventory/local-sources baseline:

- web inventory route and sidebar entry
- web skill catalog and connector health view
- local Microsoft source discovery and OneDrive import path
- local file-path resolution and local extraction support
- desktop `Tools & Skills` hub, local folder roots, and skill catalog
- desktop settings/menu entrypoints only where required by the shipped hub behavior

## Requirements

- Keep `Connected Accounts` distinct from local folders and local Microsoft sources.
- Keep Outlook and Teams explicitly non-importable until a real local reader exists.
- Keep OneDrive as the first supported local Microsoft import path.
- Keep desktop as runtime-backed authority and web as project-facing inventory/cockpit.
- Do not bundle unrelated cloud-connector or general UI churn into this wave.

## Likely File Groups

### Docs

- `docs/dual-app-convergence-2026-04-10/*`
- `docs/local-microsoft-app-sources-2026-04-10/*`
- `docs/desktop-settings-entrypoints-2026-04-10/*`

### Web

- `apps/rowboat/app/actions/local-connectors.actions.ts`
- `apps/rowboat/app/actions/local-microsoft.actions.ts`
- `apps/rowboat/app/lib/builtin-skill-catalog.ts`
- `apps/rowboat/app/lib/local-microsoft-sources.ts`
- `apps/rowboat/app/projects/[projectId]/inventory/*`
- `apps/rowboat/app/projects/layout/components/sidebar.tsx`
- `apps/rowboat/app/projects/[projectId]/sources/components/sources-list.tsx`
- `apps/rowboat/app/api/uploads/[fileId]/route.ts`
- `apps/rowboat/src/application/services/local-file-path.ts`
- `apps/rowboat/src/infrastructure/services/local.uploads-storage.service.ts`
- `apps/rowboat/app/scripts/rag-worker.ts`
- `apps/rowboat/app/lib/embedding.ts`
- `apps/rowboat/app/scripts/setup_qdrant.ts`

### Desktop

- `apps/x/apps/main/src/main.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`
- `apps/x/apps/renderer/src/lib/builtin-skill-catalog.ts`
- `apps/x/packages/core/src/workspace/external_sources.ts`
- `apps/x/packages/shared/src/ipc.ts`

## Success Criteria

1. `/projects/[projectId]/inventory` renders in the web app and shows folders, local Microsoft sources, skill catalog, connector health, and project tool summaries.
2. The desktop app exposes `Tools & Skills` with folder roots, quick links, and skill catalog visibility.
3. OneDrive local folders are importable through the supported path.
4. Outlook and Teams remain honestly labeled as not yet importable.
5. The wave is pushed from a clean worktree and linked back to GitHub tracking.
