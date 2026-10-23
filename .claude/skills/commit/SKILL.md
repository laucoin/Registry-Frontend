---
name: commit
description: Plan and create commits for the Registry frontend (Conventional Commits, smallest testable increments, build gate). Use whenever asked to commit, split work into commits, or plan commit scopes.
---

# Commit — Registry Frontend

## Format

`<type>(<scope>): <short summary>` in US English, `type` ∈ `feat, fix, chore, docs, style, refactor, perf, test`.
Conventional Commits are mandatory: semantic-release derives the version, changelog and tag from them.

## Breakdown

- Plan the commit scopes with the user **before** development begins.
- One behavior per commit, the smallest functionally testable increment.

## Gates

- Run `pnpm lint`, `pnpm build` and `pnpm test:coverage` first; all must pass (coverage thresholds
  included). Do not commit on failure or on a coverage drop.
- Run the `code-review` skill beforehand; all 6 ratings must be ≥ 8/10. If new code lacks coverage, run the `test`
  skill first.
- Work-in-progress gate: if a complete testable feature is uncommitted, refuse unrelated new work until it is
  committed. Local commits are enough.
- The git remote is read-only: no write action on it (push, creating or editing a pull request, issue or release,
  etc.). The user handles those.
- If a misunderstanding or a bug shows up, stop immediately and never stack patch commits on a broken change. Explain
  the issue in one sentence so the user can `git reset`.
