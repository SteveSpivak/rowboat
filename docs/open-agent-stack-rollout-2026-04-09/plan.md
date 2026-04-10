# Open Agent Stack Rollout Plan

Date: 2026-04-09
Task shape: implementation + architecture hardening
Size: large

## Current Truth

- Tooling language is currently split across `Library`, `Custom MCP Servers`, `CLI Connectors`, `Webhook`, and Composio-specific config views.
- The current local connector bridge still defaults to `http://127.0.0.1:8766/v1` in the web app, which is out of line with the desktop bridge work already done.
- Project MCP entries are minimal and only store server URL.
- Current proof of Rowboat runtime capability is structural, not durability-tested.
- The repo now has `scripts/token-audit.js`, so the workspace-required token audit step is no longer blocked by missing tooling. The remaining blocker is the current raw-CSS backlog revealed by the audit.

## Proposed Change

### Wave 1: Local-first product cleanup

- normalize product vocabulary around:
  - `Models / Connectors`
  - `Tools / Integrations`
  - `Automations / Triggers`
  - `Connected Apps`
- make MCP and webhook the first-class tool-provider path
- keep CLI connectors explicitly scoped per agent
- surface local `n8n` as the recommended multi-app router
- make Composio clearly optional and capability-gated
- align local bridge defaults across web and desktop

### Wave 2: Minimum observability and fallback posture

- add minimum tracing or structured runtime logging hooks so Wave 1 stability can actually be evaluated
- define and document the fallback model path if local connectors or Ollama are unavailable
- keep OpenRouter or equivalent fallback optional, but make the path explicit
- add operator-facing docs for when to use local-only vs fallback mode

### Wave 3: Runtime proof and harness-gap decision

- define measurable thresholds for runtime insufficiency
- define a stress-test runbook for Rowboat’s native runtime
- define the “escape hatch” criteria for evaluating Deep Agents as orchestration-only while Rowboat remains the cockpit

## Target Surfaces

Known files likely in scope:
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/projects/[projectId]/tools/components/ToolsConfig.tsx`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/projects/[projectId]/tools/components/SelectComposioToolkit.tsx`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/projects/[projectId]/config/components/project.tsx`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/projects/[projectId]/manage-triggers/components/triggers-tab.tsx`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/projects/components/build-assistant-section.tsx`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/lib/local-connectors.ts`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/app/lib/local-knowledge-roots.ts`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/src/application/lib/composio/composio.ts`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/src/application/lib/agents-runtime/agents.ts`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/apps/rowboat/src/application/lib/agents-runtime/agent-tools.ts`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/docs/connector-tooling-architecture-2026-04-09/*`
- `/Users/steve.spivak/agent-workspace/rowboatlabs/n8n-local/README.md`

Unknown-target note:
- if there is no existing structured logging hook for runtime durability, a new small helper or doc surface may be needed

## Implementation Steps

### 1. Council and repo map

- run a three-lens council:
  - runtime durability lens
  - observability/fallback lens
  - product-surface and UX lens
- map exact repo surfaces for Wave 1 edits

### 2. Execute Wave 1

- fix product copy and tab labels where misleading
- make Composio states explicit when unconfigured
- align bridge defaults
- promote the local-first path in product surfaces and docs

### 3. Execute Wave 2 minimums

- add minimum tracing/logging or operator-visible proof hooks
- document and surface model fallback behavior
- avoid full observability platform integration if the repo is not ready for it

### 4. Execute Wave 3 gating

- add measurable harness-gap criteria to docs
- add a runtime stress-test checklist or runbook
- document exact conditions under which Deep Agents should be evaluated

### 5. Validate and archive

- verify the affected web surfaces locally
- verify the local-first stack documentation is consistent
- capture what remains deferred and why

## Proof Surfaces

- code proof:
  - UI labels and states match actual behavior
  - local connector defaults are aligned
  - Composio missing-state behavior is explicit
- operator proof:
  - `/projects` and `/workflow` render correctly
  - tools modal reflects the new vocabulary
  - local connector models load
  - local MCP/webhook path remains usable
- architecture proof:
  - a measurable runtime-proof section exists before any Deep Agents adoption

## Contracts And Defaults

### Models / Connectors

- scope: per agent
- default: local CLI connectors and Ollama
- fallback: explicit hosted path only when configured

### Tools / Integrations

- default: remote MCP and signed webhook
- optional: Composio connected apps

### Automations / Triggers

- default: scheduled jobs, recurring jobs, webhook-triggered flows, local `n8n`

### Connected Apps

- default posture: optional, capability-gated

## Tests

- targeted lint on changed TS/TSX files
- local HTTP checks for affected routes
- if UI flow changes are substantial, browser verification on:
  - `/projects`
  - one live workflow page
- explicit note if any proof remains blocked by environment or missing tooling

## Assumptions, Blockers, And Archive Step

Assumptions:
- the immediate value is in product cleanup and proof gates, not a second runtime
- Wave 2 should be minimal and pragmatic, not a full observability rebuild

Known blocker:
- `scripts/token-audit.js` exists in this repo, but the audit still fails against the current CSS backlog

Archive step:
- update the architecture review docs with the final proof gates and runtime decision rules
