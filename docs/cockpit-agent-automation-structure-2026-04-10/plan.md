# Plan

## Stage 1: Ownership Lock

- Write the explicit ownership table:
  - web workflow agents
  - web project triggers
  - desktop background agents
  - desktop local schedules
  - `n8n-local` routing

## Stage 2: User-Facing Terminology

- Keep the user-facing taxonomy stable:
  - workflow agents
  - connected app triggers
  - background agents
  - automations
  - local router

## Stage 3: Proof Flow Selection

- Pick one proof path that requires all three layers:
  - web cockpit
  - `n8n-local`
  - desktop/runtime

Suggested first flow:

1. a project tool or trigger in web fires
2. webhook lands in `n8n-local`
3. `n8n-local` calls the local bridge or writes to a visible result path
4. the operator can verify the result in desktop and/or project state

## Stage 4: Execution Slice

- Implement the minimum code or config needed for the proof flow.
- Capture runtime evidence instead of assuming parity.
