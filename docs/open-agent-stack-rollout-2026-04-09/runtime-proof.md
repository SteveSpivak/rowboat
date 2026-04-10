# Open Agent Stack Runtime Proof

Date: 2026-04-09
Status: Wave 2 and Wave 3 minimums

## Wave 2 Operator Proof Hooks

The goal of this pass is not full observability. It is to surface enough operator truth to decide whether the local-first stack is stable enough to keep as the default.

Current proof hooks:

- `Connectors` tab in the tools modal now shows:
  - the resolved `PROVIDER_BASE_URL`
  - whether the local bridge is reachable
  - which models are currently exposed per connector
  - the hosted fallback instruction when no local bridge models are available
- `Connected Apps` surfaces now show an explicit unavailable state when Composio is enabled in the build but not configured in the workspace.
- `Webhook` surfaces now explicitly point users toward `n8n` or another local router for the local-first orchestration path.
- `MCP` surfaces now explicitly describe the supported transport in this workspace: remote HTTP or SSE MCP endpoints.

## Validation Checklist

Before declaring the local-first path healthy:

1. Verify `/projects` renders and the assistant creation page still loads.
2. Verify at least one live workflow page renders.
3. Open the tools modal and confirm:
   - `MCP` tab loads
   - `Webhook` tab loads
   - `Connectors` tab shows bridge status and model inventory or the fallback message
   - `Connected Apps` shows either the Composio catalog or the explicit unavailable state
4. Confirm the `Connected Apps` section in project settings still renders without crashing when Composio is unconfigured.
5. Confirm the local `n8n` router docs and sample workflow target the same bridge port as the bridge script.

## Local Runtime Stress-Test Runbook

Use this before evaluating any second orchestrator:

### Preconditions

- MongoDB running
- web app running on `http://localhost:3000`
- local CLI bridge running on `http://127.0.0.1:8765/v1`
- `n8n` local stack running if webhook routing is part of the test
- one workflow with:
  - a local connector model
  - at least one MCP tool
  - at least one webhook tool routed through `n8n`

### Run Matrix

1. Run 10 local model-only assistant interactions.
2. Run 10 MCP-backed tool invocations.
3. Run 5 webhook plus `n8n` routed invocations.
4. Run at least 3 trigger-driven flows if connected-app triggers are enabled in this workspace.

### Capture

For each failure, capture:

- route and workflow id
- connector or tool surface involved
- visible UI state
- server log or browser console output
- whether recovery required only retry, page refresh, workflow republish, or code change

### Pass Criteria

- no unrecoverable stuck runs
- no silent failures
- at least 23/25 successful local model/MCP/webhook runs
- any failure mode is diagnosable from surfaced UI state plus normal logs in under 10 minutes

## Harness-Gap Thresholds

Only evaluate Deep Agents or another secondary harness if one or more of these thresholds is crossed after the Wave 1 and Wave 2 cleanup:

1. Durability gap
   - More than 2 unexpected failures in the 25-run stress matrix, or any run that cannot recover without manual data repair.
2. Orchestration gap
   - Two or more representative workflows require capabilities Rowboat still does not provide natively, such as durable step resume across restarts, long-lived pause/resume, or parallel subtask fan-out with a reliable join.
3. Operability gap
   - Two separate incidents where connector, MCP, webhook, or `n8n` failure cannot be diagnosed from surfaced state and ordinary logs within 10 minutes.
4. Maintenance gap
   - The operational cost of keeping local bridge plus webhook plus `n8n` plus auth glue working is demonstrably higher than selectively using a hosted layer such as Composio for the affected workflow class.

## Deep Agents Escape Hatch

If the thresholds above are crossed, the next step is not a full platform rewrite.

The evaluation order should be:

1. Keep Rowboat as cockpit and primary project surface.
2. Keep MCP, webhook, and local knowledge roots unchanged.
3. Trial Deep Agents only as an orchestration-side harness for the failing workflow class.
4. Keep the decision evidence-backed:
   - which threshold failed
   - which workflow class failed
   - what Rowboat could not do cleanly
   - why the added harness solves that specific gap

## Known Blocker

- `node scripts/token-audit.js` is required by workspace rules and the script now exists in this repo. This remains a blocked proof item only because the audit currently fails against the raw-CSS backlog.
