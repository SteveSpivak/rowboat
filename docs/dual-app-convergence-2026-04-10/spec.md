# Dual-App Convergence

## Goal

Give both Rowboat apps first-class connections to folders, skills, and tools while keeping their runtime responsibilities explicit:

- `apps/x` stays the executable local runtime shell.
- `apps/rowboat` stays the project and workflow cockpit.

## Current Truth

### Desktop (`apps/x`)

- Owns workspace file access, knowledge roots, and local watcher-backed operations.
- Owns runtime-backed model settings, MCP configuration, and connected-account state.
- Already has a built-in skill runtime and skill catalog in `apps/x/packages/core/src/application/assistant/skills/index.ts`.
- Already exposes knowledge-source configuration in `apps/x/apps/renderer/src/components/settings-dialog.tsx`.

### Web (`apps/rowboat`)

- Owns project workflows, per-agent connector choice, project tools, project triggers, and project data sources.
- Already imports local knowledge roots into project data sources through `apps/rowboat/app/actions/local-knowledge.actions.ts` and `apps/rowboat/app/projects/[projectId]/sources/components/sources-list.tsx`.
- Already exposes project tool providers in `apps/rowboat/app/projects/[projectId]/tools/components/ToolsConfig.tsx`.
- Does not yet have a first-class skill inventory or a unified inventory surface for folders, skills, and tools.

## Decisions

1. Both apps must expose a first-class inventory for folders, skills, and tools.
2. Desktop inventory is executable and settings-backed.
3. Web inventory is project-facing and attachment-oriented.
4. Web skill inventory is a catalog plus authoring guidance in this wave, not a new runtime loader.
5. Project `Tools` remains project-scoped configuration. It does not become the global inventory.
6. Folder inventory must consistently show the local roots:
   - `NewVault`
   - `agent-workspace`
   - `dev`
7. Skill inventory must consistently reflect the built-in Rowboat desktop skill set in this wave.
8. Tool inventory must distinguish:
   - local model connectors
   - MCP servers
   - webhook tools
   - connected apps

## Target Surfaces

### Docs

- `docs/dual-app-convergence-2026-04-10/spec.md`
- `docs/dual-app-convergence-2026-04-10/plan.md`
- `docs/dual-app-convergence-2026-04-10/tasks.md`

### Web

- `apps/rowboat/app/lib/builtin-skill-catalog.ts`
- `apps/rowboat/app/projects/[projectId]/inventory/page.tsx`
- `apps/rowboat/app/projects/[projectId]/inventory/app.tsx`
- `apps/rowboat/app/projects/layout/components/sidebar.tsx`

### Desktop

- `apps/x/apps/renderer/src/lib/builtin-skill-catalog.ts`
- `apps/x/apps/renderer/src/components/settings-dialog.tsx`

## Non-Goals

- Converting web workflows into a new skill runtime
- Making desktop and web own identical configuration files
- Implementing Microsoft cowork-helper execution paths in this slice
- Implementing Claude/Codex chat interoperability in this slice

## Success Criteria

- Desktop has a real `Tools & Skills` hub with direct entry points to connectors, MCP, folders, and built-in skills.
- Web has a real `Inventory` page with project-usable folders, skill catalog visibility, and tool/connectors visibility.
- Neither app claims runtime behavior it does not actually own.
- The new surfaces make it easier to answer “what do I have available?” in both apps.
