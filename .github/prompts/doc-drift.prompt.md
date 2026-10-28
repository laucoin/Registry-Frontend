---
mode: agent
name: doc-drift
description: Compare the Registry frontend codebase against its documentation and surface drift. Use when asked to check the code against the documentation or the specs.
---

# Documentation drift check — Registry Frontend

Find every place where the documentation and the frontend codebase disagree, then help resolve each one. Change nothing
until step 4 tells you which action to take.

## Step 1 — Locate the documentation

Default: `https://doc.laucoin.fr/registry` (functional and technical sections). If a local copy may be fresher (e.g.
`../../Documentations/documentation/registry`), propose it to the user with `AskUserQuestion` instead of asking where
the docs are; a local path is authoritative over the remote default.

Look for an `AGENTS.md` at the documentation root and follow it to navigate. Otherwise use the **Functional** section
(features, roles/permissions, business rules, BDD scenarios) and the **Technical** section (architecture, stack, API
contracts, data model, ADRs). ADRs **007, 008 and 012** are frontend-scoped; the others govern the backend.

## Step 2 — Compare the technical documentation

Compare against what the frontend actually does (`AGENTS.md` is the reference for the intended design):

- Architecture: `api` → `store` (`signalStore`) → `facade` flow, `core/` / `pages/` / `shared/` placement and the
  documented exceptions.
- Angular version and build tooling, standalone components, routing and lazy loading vs `registry.routes.ts`.
- API integration: which backend endpoints and version each `*.api.ts` calls vs the documented contract (`/api/v2`,
  pagination, error keys), and the DTO → model mappers.
- Runtime configuration (`public/settings/config.json`, `env.json`), theming through `@sgdf/ui`, i18n through
  `@jsverse/transloco`, accessibility and UX commitments.
- ADRs: do they still reflect the decision actually implemented?

## Step 3 — Compare feature by feature

Walk the functional documentation's feature list. For each feature, check components, stores, facades and specs:

- Does it still exist, and does the described behavior match the current implementation and UI flow?
- Do documented roles and permissions gate the same screens and actions as the guards and permission-driven UI? (The
  frontend enforces nothing: the backend is the security boundary.)
- Do documented business rules, form validation and edge cases match the facades, stores and validators?
- Do documented BDD scenarios still hold against the current behavior?

## Step 4 — Verdict and action

If nothing surfaced in steps 2 and 3, say so and stop: no change needed.

Otherwise list every discrepancy: what the doc says, what the code does (`file:line`), and the doc section. Then ask,
per discrepancy (or in bulk if the user says so), with `AskUserQuestion` and a recommended option first:

1. **Update the documentation** to match the code.
2. **Update the code** to match the documentation.
3. **Re-explain the feature**: the understanding of the doc or the code was wrong; the user clarifies and the point is
   re-evaluated.

Wait for the decision before touching anything.

## Step 5 — Making the change

Documentation and code are never changed in the same step (`AGENTS.md` §8, Separation).

- **Update the documentation:** a remote URL is read-only. Ask for the local path of the documentation source, then
  edit it there. The documentation repository has its own commits; none land in this repository.
- **Update the code:** follow `AGENTS.md`, then the `test` skill for the changed behavior, and the `code-review` skill
  before the commit.
- **Re-explain:** fold the correction back in and re-check whether the discrepancy still stands.
