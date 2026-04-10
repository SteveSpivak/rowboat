# Open Agent Stack Rollout Review

Date: 2026-04-09
Status: Wave 1 executed, Wave 2 and Wave 3 minimums documented

## Wave 1

Implemented:

- Tools modal defaults back to the local-first path:
  - `MCP`
  - `Webhook`
  - `Connectors`
  - `Connected Apps`
- `Connected Apps` is now the product term for the optional Composio-backed surface.
- Composio unconfigured state is explicit in:
  - connected-app selection
  - project settings
- `Webhook` copy now points users toward `n8n` or another local router.
- `MCP` copy now clarifies that this workspace supports remote HTTP or SSE MCP endpoints.
- Local connector base URL now resolves to `http://127.0.0.1:8765/v1` by default in the web app.
- Local `n8n` docs and sample workflow now target the same bridge port.

## Wave 2 Minimums

Added:

- operator-visible connector status in the tools modal
- explicit hosted fallback instruction when the local bridge exposes no models
- explicit Composio unavailable states instead of silent empty lists

Deferred:

- full tracing stack
- full Langfuse integration
- broad runtime instrumentation across the entire agents runtime

## Wave 3 Proof Gates

Documented in [runtime-proof.md](/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/docs/open-agent-stack-rollout-2026-04-09/runtime-proof.md):

- a local runtime stress-test runbook
- measurable harness-gap thresholds
- Deep Agents escape-hatch criteria

## Blocked Proof

- `node scripts/token-audit.js` now exists and runs. The remaining blocker is the current raw-CSS backlog reported by the audit.
- Runtime durability is still not proven until the stress matrix is executed against a live local stack.
