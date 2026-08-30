---
mode: agent
description: Compare the Registry frontend codebase against its documentation and surface drift
---

# Documentation drift check — Registry Frontend

Find every place where the documentation and the frontend codebase disagree, then help me resolve each one. Don't change anything until step 4 tells you which action to take.

## Step 1 — Locate the documentation

Ask me where the documentation lives, if I haven't said already. Default: `https://doc.laucoin.fr/registry`. I may instead give a local path (a checkout of the docs source) — treat that as authoritative over the remote default whenever provided.

Once you know the location, look for an `AGENTS.md` at its root (`<location>/AGENTS.md` whether that's a URL or a local path) and follow it for how to navigate the docs. If there isn't one, fall back to the site's own navigation: this documentation set is generally split into a **Functional** section (what the product does, roles/permissions, features with business rules and BDD scenarios) and a **Technical** section (architecture, stack, API contracts, data model, ADRs). Use that split for steps 2 and 3 below. If the real structure differs, adapt to what you actually find.

## Step 2 — Compare the technical diff

Compare the Technical documentation against what the frontend actually does:

- Architecture (NGXS + feature-first): state flow component → facade → action → state → service, and where documented feature code is supposed to live (`domains/<domain>/`, `shell/`, `shared/util-*`).
- Angular version/build tooling, standalone components, routing/lazy-loading claims vs actual `app.routes.ts`.
- API integration: which backend endpoints/versions each service actually calls vs what's documented.
- Accessibility and UX/UI commitments (semantic HTML, keyboard support, i18n via `@ngx-translate`, theming) vs what the components actually implement.
- Any ADRs — do they still reflect the decision actually implemented?

## Step 3 — Compare feature by feature

Walk the Functional documentation's feature list. For each documented feature, check against the actual components/state/services and tests:

- Does it still exist, and does the described behavior match the current implementation and UI flow?
- Do documented roles/permissions gate the same screens/actions they gate in code (guards, `*ngIf`/`@if` on permission checks)?
- Do documented business rules, form validation, and edge cases match what the facades/state/validators actually do?
- Do documented BDD scenarios still hold against current behavior?

## Step 4 — Verdict and action

If nothing surfaced in steps 2 and 3, tell me that and stop — no changes needed.

Otherwise, list every discrepancy point-by-point. For each one give: what the doc says, what the code actually does (with `file:line`), and the doc section it came from. Then ask me, per discrepancy (or in bulk if I say so), to pick one:

1. **Update the documentation** to match the code.
2. **Update the code** to match the documentation.
3. **Re-explain the feature** — my understanding of the doc or the code was wrong; I'll clarify and you re-evaluate that point.

Wait for my decision before touching anything.

## Step 5 — Making the change

- **Update the documentation**: if the location I gave you in step 1 was the remote URL, you can't write to it — ask me for a local path to the documentation source before editing. If I already gave a local path, edit it there directly.
- **Update the code**: follow this repo's conventions (`AGENTS.md`, and the checks in `code-review.prompt.md`) and update/add tests for the changed behavior.
- **Re-explain**: fold my correction back into your understanding and re-check whether the discrepancy still stands before moving on.
