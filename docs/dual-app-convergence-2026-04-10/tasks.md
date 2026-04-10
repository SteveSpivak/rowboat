# Tasks

- [x] 0.1 Write the convergence spec, plan, and task files for the revised dual-surface requirement.

- [x] 1.1 Add a web-local built-in skill catalog for inventory rendering.
  Done condition: the web app has a typed skill catalog source with titles and summaries.

- [x] 1.2 Add a project-level `Inventory` route to the web app.
  Done condition: `/projects/[projectId]/inventory` renders folders, skills, connector health, and project tool summaries.

- [x] 1.3 Add the new `Inventory` route to the project sidebar.
  Done condition: project navigation links to the inventory surface.

- [x] 1.4 Keep folder import executable from the web inventory.
  Done condition: a user can import `NewVault`, `agent-workspace`, or `dev` from the inventory page.

- [x] 2.1 Add a desktop-local built-in skill catalog for renderer use.
  Done condition: the desktop renderer can show a built-in skill list without relying on chat copy.

- [x] 2.2 Upgrade desktop `Tools Library` to `Tools & Skills`.
  Done condition: the tab label and description reflect the broader hub responsibility.

- [x] 2.3 Add desktop hub entry points for connectors, folders, MCP, and connected accounts.
  Done condition: a user can navigate from the hub to the runtime-backed settings tabs directly.

- [x] 2.4 Add a built-in skill catalog section to the desktop hub.
  Done condition: built-in skills are visible with names and summaries in settings.

- [x] 3.1 Validate the web inventory route, desktop settings hub, and folder import flow.
  Proof surface: browser verification plus targeted lint output.

- [x] 3.2 Run `node scripts/token-audit.js`.
  Proof surface: command output recorded honestly, including missing-script failure if still absent.
