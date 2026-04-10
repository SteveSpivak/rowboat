# Dual-App Runtime Cockpit Rollout

## Goal

Make the Rowboat desktop app and web app work together as one coherent operator experience without pretending they are identical applications.

The desktop app must remain the local runtime shell.
The web app must remain the workflow and project cockpit.
Both apps must expose first-class access to folders, skills, tools, connectors, and connected accounts in the ways they actually own.

## Current Truth

### Shared concepts

Both apps already model the same conceptual layers:

- folders and knowledge roots
- connectors and model providers
- MCP-backed tools
- connected accounts
- assistant and workflow configuration

### Desktop (`apps/x`)

- owns local workspace access and knowledge roots
- owns runtime-backed connector and model state
- owns local MCP/runtime-backed settings
- owns background runtime services and schedules
- now exposes native `Settings…` and `Connected Accounts…` entry points

### Web (`apps/rowboat`)

- owns project workflows, assistants, triggers, and project-scoped tool providers
- owns project-facing inventory and attachment flows
- can import local folder roots into project data sources
- does not own the desktop runtime, even when it reflects runtime-backed state

## Core Decisions

1. The two apps share concepts, not storage ownership.
2. Desktop remains the source of truth for runtime-backed local behavior.
3. Web remains the source of truth for project-scoped orchestration.
4. Both apps must expose usable connections to:
   - folders
   - skills
   - tools
   - connectors
   - connected accounts
5. `n8n-local` is the preferred local multi-app router for webhook-style tool orchestration.
6. Web `Tools` stays project-scoped. It does not become the whole workspace inventory.
7. Skills are cataloged in both apps now; a shared manifest can come later.
8. Microsoft baseline means:
   - Outlook
   - Teams
   - OneDrive / SharePoint
   - Graph MCP as a read-only insight layer
9. Chat interoperability between Claude/Codex remains deferred until runtime proof exists.

## Product Taxonomy

- `Folders / Knowledge Roots`
  - local roots such as `NewVault`, `agent-workspace`, and `dev`
- `Skills`
  - guidance, capability packaging, and attach helpers
- `Connectors / Models`
  - Codex CLI, Claude CLI, Gemini CLI, Ollama, hosted providers
- `Tools / Integrations`
  - MCP servers, webhook tools, `n8n` routes, connected-app actions
- `Connected Accounts`
  - auth state for Google, Microsoft, and other SaaS integrations
- `Automations / Triggers`
  - schedules, background agents, recurring jobs, and external triggers

## Required Outcome

### Both apps

- must expose a clear way to discover what is available
- must expose folder, skill, tool, and connector surfaces without conflating them
- must make connected-account state visible and actionable

### Desktop

- must be the trusted operator surface for runtime-backed settings
- must have direct native entry points for settings and connected accounts
- must keep local automation and runtime ownership explicit

### Web

- must be the cockpit for assistants, workflows, project tools, and triggers
- must show project-usable inventory sourced from real runtime-backed state where possible
- must surface agent and automation configuration in ways that match the actual workflow model

## Non-Goals

- forcing desktop and web into the same configuration files
- introducing a second runtime authority in the web app
- implementing Claude/Codex chat bridge work in this rollout
- replacing `n8n` with a new local orchestration system

## Success Criteria

1. Desktop and web can both answer “what folders, skills, tools, connectors, and accounts do I have?”
2. Desktop connected accounts visibly include Microsoft entries and remain reachable through native entry points.
3. Web inventory visibly reflects usable folders, skill catalog, connectors, and project tool providers.
4. The operator can understand where automations live and how `n8n` fits into execution.
5. At least one end-to-end proof flow across desktop runtime + web cockpit + tool routing is defined and executable.
