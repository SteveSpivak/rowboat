# Plan

## Wave 0: Contract Lock

- Freeze the asymmetric ownership model.
- Record the shared taxonomy used by both apps.
- Treat “same architecture” as “same concepts with different control surfaces,” not identical storage/runtime.

## Wave 1: Runtime and Entry-Point Proof

- Keep desktop as the runtime-backed shell.
- Prove native desktop entry points for settings and connected accounts.
- Keep local bridge defaults aligned and verified.
- Keep the web inventory route working against runtime-backed state where available.

## Wave 2: Shared Discovery Surfaces

- Desktop:
  - keep `Tools & Skills`
  - keep direct entry points to models, folders, MCP, and connected accounts
- Web:
  - keep the project inventory route
  - keep folder import executable
  - keep connector and project-tool visibility explicit

## Wave 3: Cockpit Agent and Automation Structure

- Map the agent types that belong in the web cockpit.
- Make the relationship between:
  - project assistants
  - workflows
  - triggers
  - background agents
  - local schedules
  explicit in docs and UI copy.
- Define which automation surfaces are desktop-owned vs web-owned.

## Wave 4: `n8n` Router Baseline

- Keep `n8n-local` as the preferred local multi-app router.
- Make the route from web webhook tools to local `n8n` explicit.
- Define the minimum proof flow:
  - trigger
  - agent/workflow step
  - tool call or webhook
  - `n8n` handling
  - result visibility

## Wave 5: Microsoft Cowork Helper Baseline

- Keep Microsoft connected-app entries visible in desktop.
- Add the corresponding project-facing guidance and inventory cues in web.
- Defer M365 Copilot packaging.
- Keep Graph MCP read-only.

## Wave 6: End-to-End Proof

- Prove at least one combined desktop+web flow.
- Capture honest evidence for:
  - runtime startup
  - connector visibility
  - connected-account reachability
  - tool routing
  - workflow execution
  - result visibility

## Current Status

- Wave 1 desktop menu proof: implemented
- Wave 2 discovery surfaces: partially implemented
- Waves 3-6: planned, not yet complete
