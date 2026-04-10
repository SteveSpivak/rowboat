# Agent Update

## Purpose

This report is the handoff for other agents working on local Microsoft data, desktop/web convergence, knowledge ingestion, and efficiency improvements.

Use it to avoid repeating the expensive discovery and import work that already happened on this machine.

## Executive Summary

- The local Microsoft requirement is now implemented as a **local source** lane, not as a cloud connector lane.
- The first working slice is **OneDrive local folder import** into the web app's project sources.
- Desktop and web both now reflect the same taxonomy:
  - local Microsoft data belongs under knowledge sources / local inventory
  - cloud Microsoft auth belongs under connected accounts
- Outlook and Teams local stores are detected, but **local ingestion is not implemented yet**.
- Local embeddings now use **Ollama** by default when no hosted embedding provider is configured.
- The heavy path has already been proven once on this machine. Reuse the existing imported OneDrive sources before attempting another large import.

## What Was Built

### 1. Local Microsoft source inventory in the web app

The web app now exposes local Microsoft sources through a dedicated local-source lane:

- `apps/rowboat/app/lib/local-microsoft-sources.ts`
- `apps/rowboat/app/actions/local-microsoft.actions.ts`
- `apps/rowboat/app/projects/[projectId]/inventory/app.tsx`
- `apps/rowboat/app/projects/[projectId]/sources/components/sources-list.tsx`

Current behavior:

- detect local OneDrive, Outlook, and Teams paths on this machine
- allow **OneDrive** imports into project sources
- show Outlook and Teams as detected but not yet importable

### 2. Local file persistence and retrieval for imported sources

The local-file ingestion path is now wired end to end:

- `apps/rowboat/src/application/services/local-file-path.ts`
- `apps/rowboat/src/infrastructure/services/local.uploads-storage.service.ts`
- `apps/rowboat/app/api/uploads/[fileId]/route.ts`

Current behavior:

- imported docs can point at absolute local file paths
- uploaded/local files can still be served back through the existing app route

### 3. Local extraction path for Office and text files

The RAG worker now has a local-first extraction path:

- `apps/rowboat/app/scripts/rag-worker.ts`

Current behavior:

- `.txt`, `.md`, `.csv`: direct text
- `.docx`: `textutil`
- `.pptx`, `.xlsx`: unzip OOXML and extract XML text
- if a valid Office file yields no body text, a small placeholder string is used so the ingestion pipeline can still complete deterministically

### 4. Local embeddings default

Embedding fallback now uses Ollama when no hosted embedding provider is configured:

- `apps/rowboat/app/lib/embedding.ts`
- `apps/rowboat/app/scripts/setup_qdrant.ts`

Current behavior:

- base URL: `http://127.0.0.1:11434/v1`
- model: `nomic-embed-text`
- vector size fallback: `768`

### 5. Desktop taxonomy correction

Desktop now reflects the correct ownership boundary:

- `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`
- `apps/x/packages/core/src/workspace/external_sources.ts`

Current behavior:

- `Connected Accounts` clearly refers to optional cloud connectors
- local Microsoft folders belong under knowledge sources / local folders
- OneDrive roots are available as default local folder candidates in the desktop knowledge-source settings

## What Is Connected Right Now

### Confirmed local paths on this machine

- OneDrive personal:
  - `/Users/steve.spivak/Library/CloudStorage/OneDrive-Cellebrite`
- OneDrive shared libraries:
  - `/Users/steve.spivak/Library/CloudStorage/OneDrive-SharedLibraries-Cellebrite`
- Outlook local profile:
  - `/Users/steve.spivak/Library/Group Containers/UBF8T346G9.Office/Outlook/Outlook 15 Profiles/Main Profile`
- Teams local container:
  - `/Users/steve.spivak/Library/Containers/com.microsoft.teams2/Data`

### Confirmed working project sources

These were already imported successfully into the local `rowboat` database and are the preferred reuse targets:

- `69d8753af14e58872f267235`
  - `OneDrive - Cellebrite (Local)`
  - final known state: `40 ready`
- `69d871accd79d344064fa675`
  - `OneDrive Shared Libraries - Cellebrite (Local)`
  - final known state: `4 ready`

These IDs are the best current reuse targets for this machine and local database. Do not assume they exist in another environment.

### Existing older debug imports

These were intermediate or stale OneDrive local imports from earlier attempts and should not be treated as the authoritative sources without checking status first:

- `69d86db2cd79d344064fa64c`
- `69d8746bdc00cde4e375ab24`

## How To Use The Existing Work

### For review agents

Read these first:

- `docs/local-microsoft-app-sources-2026-04-10/spec.md`
- `docs/local-microsoft-app-sources-2026-04-10/plan.md`
- `docs/local-microsoft-app-sources-2026-04-10/tasks.md`
- `docs/local-microsoft-app-sources-2026-04-10/review.md`
- this file

Then inspect these implementation entry points:

- `apps/rowboat/app/lib/local-microsoft-sources.ts`
- `apps/rowboat/app/actions/local-microsoft.actions.ts`
- `apps/rowboat/app/projects/[projectId]/inventory/app.tsx`
- `apps/rowboat/app/projects/[projectId]/sources/components/sources-list.tsx`
- `apps/rowboat/app/scripts/rag-worker.ts`
- `apps/rowboat/app/lib/embedding.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`
- `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
- `apps/x/packages/core/src/workspace/external_sources.ts`

### For agents extending the local-source path

Start from the working OneDrive slice. Do not restart from account connectors.

Preferred sequence:

1. Reuse the existing imported OneDrive source IDs if the goal is evaluation, review, retrieval, or proof.
2. Reuse the local Microsoft source inventory UI instead of building a new surface.
3. Reuse the local file and RAG pipeline instead of inventing a Microsoft-specific storage path.
4. Keep Outlook and Teams behind a proof gate until a repo-backed local reader exists.

### For agents checking embeddings or ingestion

Assume:

- local connector bridge is **not** the embedding backend
- direct Ollama is the embedding backend
- Qdrant collection setup is already part of the current local flow

If ingestion fails, inspect:

- local file path validity
- supported extension filtering
- local extraction logic in `rag-worker.ts`
- Ollama availability at `http://127.0.0.1:11434/v1`
- Qdrant collection readiness

## What Not To Re-Do

- Do not treat Composio-backed Outlook, Teams, or OneDrive rows as the solution to the local-data requirement.
- Do not restart from Microsoft Graph or M365 API design for this requirement.
- Do not attempt a blind full-root OneDrive import just to prove the path exists.
- Do not use the local connector bridge for embeddings.
- Do not promise Outlook or Teams ingestion in UI copy before a real local reader is implemented.

## Performance Lessons

This work got heavy on the Mac when the import path was too broad.

Current guardrails already in code:

- import cap: `40` files
- traversal depth cap: `5`
- skip dirs: `.git`, `.next`, `node_modules`, `.Trash`
- supported files only:
  - `.txt`
  - `.md`
  - `.docx`
  - `.pptx`
  - `.xlsx`
  - `.csv`
- Office imports require a valid ZIP signature
- `.pdf` is currently excluded from this local Microsoft import slice

If another agent expands this path, do it deliberately and measure memory/CPU impact first.

## Desired Outcome

Short term:

- keep the existing OneDrive local source path stable and reusable
- let agents and users retrieve from the already imported OneDrive project sources
- avoid unnecessary re-imports or duplicate source creation

Medium term:

- add dedupe / reuse logic so imports by path can resolve to an existing local source when appropriate
- add a cleanup pass for stale debug imports
- decide whether desktop should expose the same import trigger or remain the folder-authority while web remains the import/cockpit UI

Later:

- implement an Outlook local reader only after the local artifact format is proven
- implement a Teams local reader only after durable, useful local artifacts are proven

## Desired Questions For Other Agents

Review agents should focus on these questions:

1. Should local-source imports dedupe by absolute root path before creating a new source?
2. Should the authoritative local-source inventory live in desktop, web, or both with shared backing state?
3. What is the minimum safe Outlook local-reader proof slice?
4. Is Teams local data useful enough to justify a supported ingestion path?
5. Should stale OneDrive debug imports be cleaned automatically or left for manual review?

## Reuse Map

### Reuse these repo surfaces

- local source catalog:
  - `apps/rowboat/app/lib/local-microsoft-sources.ts`
- local source import action:
  - `apps/rowboat/app/actions/local-microsoft.actions.ts`
- web inventory:
  - `apps/rowboat/app/projects/[projectId]/inventory/app.tsx`
- web sources page:
  - `apps/rowboat/app/projects/[projectId]/sources/components/sources-list.tsx`
- desktop knowledge-source defaults:
  - `apps/x/packages/core/src/workspace/external_sources.ts`
- desktop taxonomy and UI:
  - `apps/x/apps/renderer/src/components/settings-dialog.tsx`
  - `apps/x/apps/renderer/src/components/settings/connected-accounts-settings.tsx`
- local extraction:
  - `apps/rowboat/app/scripts/rag-worker.ts`
- local embeddings:
  - `apps/rowboat/app/lib/embedding.ts`

### Reuse these runtime services

- Ollama embedding endpoint:
  - `http://127.0.0.1:11434/v1`
- embedding model:
  - `nomic-embed-text`
- Qdrant collection:
  - `embeddings`

## Known Gaps

- Outlook local ingestion is not implemented.
- Teams local ingestion is not implemented.
- Existing authoritative OneDrive source IDs are machine-and-database specific.
- `scripts/token-audit.js` now exists in this repo, but the normal token-audit completion step still does not pass because the audit reports a large raw-CSS backlog.

## Bottom Line

The requirement correction is complete:

- local Microsoft data is now modeled as local knowledge sources
- cloud Microsoft auth is now clearly a separate optional lane
- OneDrive local ingestion already works and should be reused
- Outlook and Teams should stay behind proof gates until real local readers exist

Any next agent should start from the working OneDrive slice and the existing source IDs above, not from a fresh API-first or re-import-heavy approach.
