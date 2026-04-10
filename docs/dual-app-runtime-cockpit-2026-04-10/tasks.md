# Tasks

- [x] 0.1 Write the runtime-cockpit spec, plan, and task files.
  Done condition: the repo has a clear combined rollout document for the desktop+web convergence program.

- [x] 1.1 Keep desktop runtime ownership explicit.
  Done condition: docs and implementation do not move runtime-backed settings into the web app.

- [x] 1.2 Add native desktop `Settings…` and `Connected Accounts…` entry points.
  Done condition: the application menu exposes both entries and they open the settings dialog.

- [x] 1.3 Prove the desktop connected-accounts path visually.
  Done condition: there is live evidence that `Connected Accounts…` opens the connected-accounts pane with Microsoft rows visible.

- [x] 2.1 Add a project inventory route in the web app.
  Done condition: `/projects/[projectId]/inventory` renders folders, skill catalog, connector health, and project tool providers.

- [x] 2.2 Add a desktop `Tools & Skills` hub.
  Done condition: the desktop settings surface exposes runtime-backed entry points and built-in skill visibility.

- [x] 3.1 Write the cockpit agent structure slice.
  Done condition: the repo has a spec/plan/tasks set for agent types, assistant roles, workflow ownership, and trigger/automation boundaries.

- [x] 3.2 Define automation ownership across desktop and web.
  Done condition: the repo states where schedules, background agents, and project triggers live and how they connect.

- [x] 4.1 Write the `n8n-local` router proof slice.
  Done condition: the repo defines one executable end-to-end local tool-routing proof using web tools and `n8n`.

- [ ] 4.2 Verify the `n8n-local` default URLs and handoff copy across both apps.
  Done condition: no stale local routing or bridge defaults remain on the proof path.

- [ ] 5.1 Add the Microsoft cowork-helper baseline slice.
  Done condition: desktop + web expose Outlook, Teams, and OneDrive/SharePoint guidance consistently, with Graph MCP clearly marked read-only.

- [ ] 6.1 Run one honest end-to-end combined proof.
  Done condition: there is evidence for one full flow across desktop runtime, web cockpit, tool routing, and result visibility.

- [ ] 6.2 Run `node scripts/token-audit.js`.
  Done condition: the command output is recorded honestly, including failure if the script is still missing.
