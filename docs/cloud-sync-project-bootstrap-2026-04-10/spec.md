# Cloud Sync Project Bootstrap

## Goal

Make `rowboat` the primary cloud-tracked project on the user's GitHub account by enabling issue tracking, creating a dedicated project surface, and backfilling truthful issue records for the work already completed locally.

## Current Truth

- The main code repository is `/Users/steve.spivak/agent-workspace/rowboatlabs/rowboat`.
- The user's fork already exists at `https://github.com/SteveSpivak/rowboat`.
- GitHub issues are currently disabled on that fork.
- The local repository contains substantial uncommitted work across web, desktop, local-source, and docs surfaces.
- The repo already contains many proof and planning docs under `docs/` that can be used as truthful source material for issue creation.

## Decisions

1. Treat GitHub project plumbing as a separate first execution slice from code publishing.
2. Enable issues on `SteveSpivak/rowboat`.
3. Create a dedicated GitHub project for Rowboat cloud sync and runtime convergence.
4. Backfill a small set of high-signal issues representing the main completed or in-progress workstreams already captured in repo docs.
5. Do not push the current dirty tree until the publish slices are defined and logged.

## Requirements

### GitHub surfaces

- `SteveSpivak/rowboat` must have issues enabled.
- A user-owned GitHub Project must exist for Rowboat.
- The first issue set must be grounded in existing repo docs, not memory or invented completion.

### Logging

- Issues must link back to specific repo docs or proof surfaces where possible.
- Completed versus ongoing work must be clearly distinguished.
- The initial issue set should favor workstreams over micro-tasks.

### Safety

- Do not publish the entire dirty tree in this slice.
- Do not claim code is cloud-synced when only issue/project surfaces were updated.

## Non-Goals

- pushing all local code changes in this slice
- closing every issue immediately
- building a full automation bridge between GitHub and local docs in this slice

## Success Criteria

1. Issues are enabled on `SteveSpivak/rowboat`.
2. A dedicated Rowboat GitHub project exists.
3. A first truthful issue set exists for the major local workstreams already performed.
4. The repo contains a local cloud-sync record describing what was logged remotely.
