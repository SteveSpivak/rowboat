# Plan

## Stage 1: Contract Lock

- Record the changed requirement that both apps need proper connections to folders, skills, and tools.
- Freeze the boundary:
  - desktop is runtime-backed
  - web is project-backed
- Keep project `Tools` scoped to project providers and add a separate inventory surface.

## Stage 2: Web Inventory Slice

- Add a project-level `Inventory` route in the web app.
- Show:
  - local folder roots with import actions
  - local connector health
  - built-in skill catalog
  - project tool-provider summary
- Make the limitations explicit where web is catalog-only rather than runtime-backed.

## Stage 3: Desktop Hub Slice

- Upgrade desktop `Tools Library` into `Tools & Skills`.
- Add direct entry points to:
  - Models / Connectors
  - Knowledge Sources
  - MCP Servers
  - Connected Accounts
- Add a built-in skill catalog section.

## Stage 4: Validation

- Verify the new web route renders and loads project data.
- Verify folder import still works from the new inventory route.
- Verify desktop settings navigation and new hub sections render.
- Run targeted lint on changed surfaces.
- Run `node scripts/token-audit.js` and report the actual result.

## Deferred Follow-Up

- Unify skill catalog metadata behind one shared manifest instead of mirrored app-local copies.
- Add Microsoft inventory and auth surfaces.
- Add automation inventory and full end-to-end proof flows.
