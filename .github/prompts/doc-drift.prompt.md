---
mode: agent
description: Compare the Registry frontend (SSR) codebase against its documentation and surface drift
---

# Documentation drift check — Registry Frontend (SSR)

Find every place where the documentation and the frontend codebase disagree, then help me resolve each one. Don't change anything until step 4 tells you which action to take.

## Step 1 — Locate the documentation

Ask me where the documentation lives, if I haven't said already. Default: `https://doc.laucoin.fr/registry`. I may instead give a local path (a checkout of the docs source) — treat that as authoritative over the remote default whenever provided.

Once you know the location, look for an `AGENTS.md` at its root (`<location>/AGENTS.md` whether that's a URL or a local path) and follow it for how to navigate the docs. If there isn't one, fall back to the site's own navigation: this documentation set is generally split into a **Functional** section (what the product does, roles/permissions, features with business rules and BDD scenarios) and a **Technical** section (architecture, stack, API contracts, data model, ADRs). Use that split for steps 2 and 3 below. If the real structure differs, adapt to what you actually find.

**Important context for this repo specifically:** this is the SSR rewrite of the frontend (`registry-frontend-ssr` — Angular 22, `@angular/ssr`), meant to eventually replace the CSR app as a breaking major release. The documentation hub may still describe the CSR architecture (NGXS, feature/domain folders, PrimeNG, `@ngx-translate`) if it hasn't caught up yet — don't treat a CSR-shaped doc as automatically correct; flag it as drift like anything else, and note in your report whether a discrepancy looks like "doc describes the old CSR app" rather than "doc and this SSR app genuinely disagree."

## Step 2 — Compare the technical diff

Compare the Technical documentation against what the frontend actually does:

- Architecture (api → store → facade → components, feature-first): each domain under `core/<domain>/` layers as `<domain>.api.ts` (HTTP) → `<domain>.store.ts` (`@ngrx/signals` `signalStore`) → `<domain>.facade.ts` (the domain's sole public entry point — components/guards/the interceptor never inject the store or api directly). Routed pages live in `features/<feature>/`, shared presentational components in `shared/`.
- Angular version/build tooling, standalone components, routing/lazy-loading claims vs actual `app.routes.ts` and per-route render mode in `app.routes.server.ts` (`RenderMode.Server` vs `RenderMode.Client` — note `auth/callback` is intentionally client-only, it touches `sessionStorage`/`location` and has nothing to render server-side).
- Runtime configuration: `server.ts` reads everything (`BACKEND_URL`, `ORGANIZATION_*`, `CREATOR_*`, `HOSTING_*`, `SUPPORT_ISSUES_URL`, `NG_ALLOWED_HOSTS`) from environment variables at process start and serves it to the client via `GET /api/config` — nothing is baked into the build/image. Check the doc's env var list against `.env.example` and `server.ts`'s `readRequiredEnv`/`readOptionalEnv` calls.
- SSR host validation: Angular's built-in SSRF guard rejects any request whose `Host` header isn't in `NG_ALLOWED_HOSTS` — including the app's own same-origin `/api/config` self-fetch on boot. Check the doc mentions this as a required production env var, not just an optional one.
- Delivery: multi-stage `Dockerfile` (build stage compiles with placeholder env vars for the build tool's internal route-extraction step only; runtime is `gcr.io/distroless/nodejs24-debian12:nonroot`, no shell, uid 65532) — vs. the CSR's nginx-static delivery model, if the doc still describes that.
- API integration: which backend endpoints/versions each `*.api.ts` actually calls vs what's documented.
- Accessibility and UX/UI commitments (semantic HTML, keyboard support, i18n via `@jsverse/transloco`, theming via `data-theme` + the ng-zorro dark bundle) vs what the components actually implement.
- Any ADRs — do they still reflect the decision actually implemented, and do they account for the CSR→SSR rewrite where relevant?

## Step 3 — Compare feature by feature

Walk the Functional documentation's feature list. For each documented feature, check against the actual components/store/api and tests:

- Does it still exist, and does the described behavior match the current implementation and UI flow?
- Do documented roles/permissions gate the same screens/actions they gate in code (guards, `@if` on permission checks)? Note: this SSR app currently only has `authGuard`/`guestGuard` (session presence, not roles) — if the doc describes role-based gating already implemented in the CSR app, that's very likely drift (feature not yet ported), not a bug.
- Do documented business rules, form validation, and edge cases match what the store/facade/api actually do?
- Do documented BDD scenarios still hold against current behavior?

## Step 4 — Verdict and action

If nothing surfaced in steps 2 and 3, tell me that and stop — no changes needed.

Otherwise, list every discrepancy point-by-point. For each one give: what the doc says, what the code actually does (with `file:line`), the doc section it came from, and whether it looks like genuine drift or "doc still describes the CSR app." Then ask me, per discrepancy (or in bulk if I say so), to pick one:

1. **Update the documentation** to match the code.
2. **Update the code** to match the documentation.
3. **Re-explain the feature** — my understanding of the doc or the code was wrong; I'll clarify and you re-evaluate that point.

Wait for my decision before touching anything.

## Step 5 — Making the change

- **Update the documentation**: if the location I gave you in step 1 was the remote URL, you can't write to it — ask me for a local path to the documentation source before editing. If I already gave a local path, edit it there directly.
- **Update the code**: follow this repo's conventions (see `code-review.prompt.md`) and update/add tests for the changed behavior.
- **Re-explain**: fold my correction back into your understanding and re-check whether the discrepancy still stands before moving on.
