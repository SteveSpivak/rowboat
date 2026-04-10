# Cloud Publish Wave 4: Tools And Connected Apps Cleanup

## Goal

Publish the next coherent web-app slice that makes the project tools surface local-first and keeps connected apps explicit, optional, and honestly capability-gated.

## Current Truth

- Wave 3 published inventory and local-source baselines.
- The dirty local tree still contains a separate web-only cleanup slice across the project tools modal, project settings, and connected-app triggers.
- That slice is cohesive on its own:
  - terminology cleanup
  - local-first MCP/webhook guidance
  - explicit Composio missing-state handling
  - connected-app wording instead of overloaded toolkit/library wording

## Decision

Wave 4 should publish the web tools and connected-app cleanup as a single branch.

## Requirements

- Keep project `Tools` project-scoped. Do not collapse it into workspace inventory.
- Prefer MCP and webhook for the local-first tool path.
- Keep connected apps optional and clearly Composio-backed.
- Make Composio unconfigured states explicit instead of silently empty.
- Keep connected-app trigger wording consistent across settings and trigger UIs.

## File Groups

### Web

- `apps/rowboat/app/actions/composio.actions.ts`
- `apps/rowboat/app/projects/[projectId]/tools/components/ToolsConfig.tsx`
- `apps/rowboat/app/projects/[projectId]/tools/components/SelectComposioToolkit.tsx`
- `apps/rowboat/app/projects/[projectId]/tools/components/CustomMcpServer.tsx`
- `apps/rowboat/app/projects/[projectId]/tools/components/AddWebhookTool.tsx`
- `apps/rowboat/app/projects/[projectId]/tools/components/WebhookConfig.tsx`
- `apps/rowboat/app/projects/[projectId]/config/components/project.tsx`
- `apps/rowboat/app/projects/[projectId]/manage-triggers/components/triggers-tab.tsx`

### Optional support files if the diff requires them

- `apps/rowboat/app/lib/local-connectors.ts`

## Explicit Exclusions

- `apps/rowboat/app/lib/feature_flags.ts`
  - The dirty local diff only flips `SHOW_DARK_MODE_TOGGLE`, which is unrelated to the tools and connected-app cleanup and must not ship in this wave.

## Success Criteria

1. The tools modal uses local-first wording and ordering.
2. Connected apps are clearly optional and Composio-backed.
3. Unconfigured Composio state is visible in both tool selection and project settings.
4. Connected-app trigger wording is consistent.
5. The wave can be validated with targeted web lint and route-level checks.
