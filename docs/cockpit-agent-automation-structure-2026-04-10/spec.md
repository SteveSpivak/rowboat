# Cockpit Agent And Automation Structure

## Goal

Define how assistants, workflow agents, background agents, schedules, project triggers, and `n8n-local` fit together across the desktop app and web app.

## Current Truth

### Web (`apps/rowboat`)

- owns workflow agents in `apps/rowboat/app/lib/types/workflow_types.ts`
- owns project tools and project triggers
- currently exposes Composio-backed external triggers in `apps/rowboat/app/projects/[projectId]/manage-triggers/components/triggers-tab.tsx`
- is the right place for project-scoped multi-agent workflow design

### Desktop (`apps/x`)

- owns runtime-backed background agents through `agent-schedule`
- exposes background task state through `agent-schedule:getConfig` and `agent-schedule:getState`
- uses local runtime services and knowledge-backed execution
- is the right place for local recurring execution and runtime-backed schedules

## Decisions

1. Web assistants and workflow agents are cockpit-managed project structures.
2. Desktop background agents are runtime-managed local schedules.
3. External triggers belong to the web project layer.
4. Local recurring schedules belong to the desktop runtime layer.
5. `n8n-local` is the bridge for local multi-app routing when web tools need durable external orchestration.
6. The product must explain these boundaries instead of making the user infer them.

## Required Outcome

- The repo must clearly separate:
  - project workflow agents
  - project triggers
  - desktop background agents
  - local schedules
  - webhook / `n8n` routing
- The next implementation slice must pick one proof flow that spans:
  - web cockpit trigger or tool initiation
  - local routing via `n8n`
  - desktop/runtime-backed execution or result visibility

## Non-Goals

- merging desktop `agent-schedule` into web workflow storage
- replacing project triggers with desktop schedules
- building a new local orchestration engine alongside `n8n`

## Success Criteria

1. Users can tell where to create project triggers versus local recurring agents.
2. The repo contains an explicit proof plan for a combined web + desktop + `n8n` execution flow.
3. Future UI work can attach to this ownership model without renaming the same concepts again.
