# Cloud Publish Wave 2: Doc Truth And Cloud Sync Record

## Goal

Publish the next safe `rowboat` slice by pushing only the cloud-sync docs and stale blocker corrections that make the repo and GitHub issue record truthful.

## Current Truth

- The first safe code slice is already on the fork:
  - `codex/publisher/rowboat-token-audit-worktree-bootstrap-2026-04-10`
- The repo now has GitHub issues and a project on `SteveSpivak/rowboat`.
- Several active docs still carry stale text claiming `scripts/token-audit.js` is missing, which is no longer true.
- The broader web, desktop, and local-source code changes are still too mixed for a safe publish wave.

## Decision

Wave 2 should publish docs only:

- the cloud-sync bootstrap docs
- the local review/log of the remote GitHub setup
- stale blocker corrections in active docs

## Requirements

- Do not include mixed implementation code in this wave.
- Do include the local review record for the GitHub project/issue setup.
- Do correct active docs that still claim the token-audit script is missing.
- Push this wave from a clean worktree on its own branch.

## Success Criteria

1. The repo’s active docs no longer falsely claim `scripts/token-audit.js` is missing.
2. The cloud-sync bootstrap docs are published to the fork.
3. The published branch is linked back to the GitHub tracking issue.
