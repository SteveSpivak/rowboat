# Ownership Table

| Concept | Primary owner | Source of truth | Operator surface | Notes |
| --- | --- | --- | --- | --- |
| Workflow agents | Web (`apps/rowboat`) | Project workflow data | Workflow editor and project cockpit | Project-scoped assistant and multi-agent design belongs in the web app. |
| Project triggers | Web (`apps/rowboat`) | Project trigger configuration | `Manage Triggers` | Connected-app triggers, one-time triggers, and recurring project rules belong to the project layer. |
| Webhook tool routing | Web project config + `n8n-local` | Project `webhookUrl` plus local router workflow | Project settings, tools modal, local `n8n` | Web owns the project webhook target; `n8n-local` owns downstream local routing. |
| Background agents | Desktop (`apps/x`) | `~/.rowboat/config/agent-schedule.json` | Desktop runtime and settings guidance | Background agents are runtime-managed local schedules, not project workflow records. |
| Local schedules | Desktop (`apps/x`) | `agent-schedule.json` and `agent-schedule-state.json` | Desktop runtime | The runner and state repo live in desktop runtime packages and IPC. |
| Local bridge / model execution | Desktop runtime + local bridge process | Desktop model config and `http://127.0.0.1:8765/v1` | Desktop runtime, web inventory visibility | Web may display connector health, but desktop remains the runtime authority. |
| Connected Accounts | Desktop (`apps/x`) for local operator control; web for project-attached Composio references | Desktop auth/config state and project-connected-app references | Desktop `Connected Accounts`, web `Connected Apps` | Desktop owns account connection operations; web only reflects project usage of connected-app tools. |
| Knowledge roots / local folders | Desktop (`apps/x`) | Local workspace roots | Desktop `Knowledge Sources`; web project import surfaces | Local folder ownership stays desktop-first even when the web app imports those folders into a project. |
| Skill catalog visibility | Both apps | Built-in skill catalogs | Desktop `Tools & Skills`, web inventory | Catalog visibility exists in both apps, but runtime behavior still follows the owning app. |
| `n8n-local` local router | Workspace-local sidecar (`/Users/steve.spivak/agent-workspace/rowboatlabs/n8n-local`) | Local `n8n` workflow + Docker stack | Local `n8n` editor and webhook endpoint | This is the supported local router for webhook-style multi-app flows. |

## Boundary Rules

- Web owns project structure.
- Desktop owns runtime-backed local execution.
- `n8n-local` bridges webhook-style project tool calls into local orchestration.
- Do not collapse desktop schedules into project triggers.
- Do not pretend Connected Accounts are the same thing as local folder or knowledge-root access.
