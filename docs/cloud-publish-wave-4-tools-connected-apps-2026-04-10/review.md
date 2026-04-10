# Review

## Scope

Wave 4 publishes the coherent web-only cleanup that keeps project tools local-first, makes connected apps explicit and optional, and records the real proof state without dragging unrelated dirty-tree changes into the branch.

## Included Changes

- `apps/rowboat/app/actions/composio.actions.ts`
  - Adds `getComposioWorkspaceStatus()` so client surfaces can show whether Composio is configured without importing server-only internals.
- `apps/rowboat/app/projects/[projectId]/tools/components/ToolsConfig.tsx`
  - Reorders the project tools tabs around the local-first path: `MCP`, `Webhook`, `Connectors`, then optional `Connected Apps`.
  - Renames tabs away from overloaded `Library` and `CLI Connectors` wording.
  - Shows local connector bridge health and exposed models directly in the tools modal.
- `apps/rowboat/app/projects/[projectId]/tools/components/SelectComposioToolkit.tsx`
  - Adds an explicit unconfigured Composio state.
  - Explains that Composio is optional and that MCP plus webhook plus `n8n` is the local-first path.
- `apps/rowboat/app/projects/[projectId]/tools/components/CustomMcpServer.tsx`
  - Clarifies that this surface is for remote HTTP and SSE MCP servers.
- `apps/rowboat/app/projects/[projectId]/tools/components/AddWebhookTool.tsx`
  - Reframes webhook as the local-first handoff into `n8n` or another router.
- `apps/rowboat/app/projects/[projectId]/tools/components/WebhookConfig.tsx`
  - Renames `Webhook URL` to `Webhook destination` and clarifies routing expectations.
- `apps/rowboat/app/projects/[projectId]/config/components/project.tsx`
  - Renames `Composio Toolkits` to `Connected Apps`.
  - Adds explicit local-first and missing-key states in project settings.
- `apps/rowboat/app/projects/[projectId]/manage-triggers/components/triggers-tab.tsx`
  - Renames external-trigger language to connected-app trigger language.

## Explicit Exclusions

- `apps/rowboat/app/lib/feature_flags.ts`
  - The dirty local diff only flips `SHOW_DARK_MODE_TOGGLE`, which is unrelated to this publish wave and was intentionally excluded.

## Validation

### Targeted lint

- Command:
  - `npm run lint -- --file app/actions/composio.actions.ts --file app/projects/[projectId]/tools/components/ToolsConfig.tsx --file app/projects/[projectId]/tools/components/SelectComposioToolkit.tsx --file app/projects/[projectId]/tools/components/CustomMcpServer.tsx --file app/projects/[projectId]/tools/components/AddWebhookTool.tsx --file app/projects/[projectId]/tools/components/WebhookConfig.tsx --file app/projects/[projectId]/config/components/project.tsx --file app/projects/[projectId]/manage-triggers/components/triggers-tab.tsx`
- Result:
  - Passed with no ESLint errors in the clean publish worktree.

### Route-level proof

- Source checkout dev server started successfully on `http://localhost:3055`.
- `curl -I http://localhost:3055/projects/60a86421-8987-4672-ad9b-8c0bd96cbf83/config`
  - Returned `200 OK`.
- `curl http://localhost:3055/projects/60a86421-8987-4672-ad9b-8c0bd96cbf83/config`
  - Rendered `Connected Apps`.
  - Rendered `This workspace is currently using MCP, webhooks, and CLI-backed flows by default.`
- `curl http://localhost:3055/projects/60a86421-8987-4672-ad9b-8c0bd96cbf83/manage-triggers`
  - Rendered `Connected app triggers are disabled`.
  - Rendered `Use one-time or recurring triggers here, connect webhook tools to n8n, or schedule Codex automations outside the app when you need fully local orchestration.`

## Token Audit

- Command:
  - `node scripts/token-audit.js`
- Result:
  - Failed as expected on the existing raw-CSS backlog outside this wave.
- Representative failures:
  - `apps/rowboat/app/globals.css`
  - `apps/rowboat/app/lib/components/mentions-editor.css`
  - `apps/rowboat/app/styles/quill-mentions.css`

## Outcome

Wave 4 is valid to publish as a coherent web cleanup slice.

The branch truth is:

- project tools stay project-scoped
- local-first tooling is MCP plus webhook plus connectors
- connected apps are optional and explicitly Composio-backed
- missing Composio configuration is no longer silent
- the token audit remains a real repo-level blocker, but not a blocker caused by this wave
