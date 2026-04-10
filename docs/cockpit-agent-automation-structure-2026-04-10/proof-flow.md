# First Combined Proof Flow

## Selected Flow

Use the existing **Tweet Assistant** project card as the first honest combined proof flow:

1. A user opens the **Tweet Assistant** in the web project cockpit.
2. The assistant invokes one of the webhook-backed tools:
   - `Search Web`
   - `Answer Question`
   - `Create a post`
3. Rowboat sends the tool call to the project's configured webhook URL.
4. The project webhook lands in `n8n-local` at:
   - `http://127.0.0.1:5678/webhook/rowboat-tweet-assistant`
5. The local router inspects the tool name and dispatches:
   - `Search Web` -> `http://host.docker.internal:8765/v1/search/web`
   - `Answer Question` -> `http://host.docker.internal:8765/v1/chat/completions`
   - `Create a post` -> guarded setup error branch unless a real X/Twitter step is installed
6. The response returns through the webhook path back into the web assistant.

## Why This Is The Right First Flow

- It already exists in the repo today.
- It uses the project-scoped web cockpit exactly as intended.
- It uses `n8n-local` exactly as intended: as a local router, not as a second product runtime.
- It uses the local bridge on `8765`, which is runtime-backed local execution rather than a hosted fallback.
- It does not require inventing a new orchestration engine or merging web triggers with desktop background schedules.

## Required Preconditions

### Web

- A Rowboat project exists with the Tweet Assistant card available.
- The project webhook URL is set to:
  - `http://127.0.0.1:5678/webhook/rowboat-tweet-assistant`

### Local router

- Docker Desktop or another Docker daemon is running locally.
- `n8n-local` is started with:

```bash
/Users/steve.spivak/agent-workspace/rowboatlabs/scripts/setup-local-n8n.sh
```

### Local runtime

- The local CLI bridge is running on:
  - `http://127.0.0.1:8765/v1`

## Expected Evidence

- Web project settings show the webhook URL configured.
- A webhook-backed Tweet Assistant tool call reaches `n8n-local`.
- `n8n-local` shows an execution for the router workflow.
- The router reaches the local bridge on `8765`.
- The web assistant receives a real answer for `Search Web` or `Answer Question`.
- If `Create a post` is used without the downstream X step, the user receives the explicit guarded setup error instead of a fake success.

## Runtime Ownership Illustrated By This Flow

- Web owns the assistant, tools, and webhook destination.
- `n8n-local` owns the local routing step.
- The local bridge owns the actual search/chat execution.
- Desktop remains the runtime authority for local model execution even though the first proof returns in the web UI.

## Current Blocker

This proof flow is currently blocked by machine state, not by missing repo structure:

- Docker daemon is not running, so `n8n-local` cannot start.
- The local bridge on `http://127.0.0.1:8765/v1` is not running.

See [review.md](/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/docs/cockpit-agent-automation-structure-2026-04-10/review.md) and [BLOCKED-cockpit-agent-automation-proof-2026-04-10.md](/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat/BLOCKED-cockpit-agent-automation-proof-2026-04-10.md) for the exact failed commands and stop condition.
