---
mode: agent
description: Review a change in the Registry frontend (SSR) against project conventions
---

# Code review — Registry Frontend (SSR)

Review the change I point you at (a diff, a file, or the current branch vs `main`). Report findings most-severe first; if nothing is wrong, say so. Prefer concrete comments with `file:line`.

## What to check

**Correctness**
- Component logic, edge cases, null/undefined handling, template bindings.
- RxJS: subscriptions cleaned up (`takeUntilDestroyed`/async pipe), no nested subscribes, correct operators, no memory leaks.
- SSR-safety: no direct `window`/`document`/`sessionStorage`/`localStorage` access outside a browser-only guard (`isPlatformBrowser(inject(PLATFORM_ID))`) — code that touches these unconditionally runs during server render too and will crash there. Watch especially for anything invoked from a route guard or a component's constructor/field initializer, since those run during SSR.

**Architecture (api → store → facade → components, feature-first) — high priority**
- Each domain under `core/<domain>/` (`auth`, `config`, `i18n`, `theme`) follows the layering: `<domain>.api.ts` (HTTP calls only) → `<domain>.store.ts` (`@ngrx/signals` `signalStore`, holds state + methods, `patchState` only inside the store) → `<domain>.facade.ts` (the domain's *only* public entry point). Components, guards, and the interceptor must inject the **facade**, never the store or the api directly.
- Routed pages live in `features/<feature>/` (`login`, `home`, `auth-callback`, `terms`, `privacy`); reusable presentational components in `shared/<component>/` (`header`, `footer`). No business logic or direct HTTP calls in components — that belongs in the store/facade.
- Standalone components only (no NgModules); dependencies declared in `imports`.
- State comes from signals end-to-end (`Signal`/`computed`/`patchState`), not from a manually-managed subject or NGXS-style actions.

**Accessibility — top priority**
- Semantic HTML (real `<button>`/`<a>`/landmarks/ordered headings); no click handlers on `<div>`/`<span>` without a documented reason (e.g. a UI-kit directive that already provides keyboard support and focus, like `nz-menu-item`).
- Keyboard operable: tab order, visible focus, Enter/Space/Esc; focus outlines not removed without replacement.
- Every control has a label/accessible name; icon-only buttons named; ARIA used only where HTML can't express it (ng-zorro-antd a11y props preferred).
- Loading/error state announced; AA contrast in both themes (`data-theme="dark"` and the ng-zorro dark bundle); `prefers-reduced-motion` respected.

**UX / UI**
- Every action gives feedback (loading, disabled-while-pending, success/error, empty states) — no dead clicks or silent failures.
- Reuses `shared/` + ng-zorro-antd patterns for consistency; forms validate inline and preserve input on error; responsive across breakpoints (mobile included, see `login-hero`'s `@media (min-width: 900px)` pattern for hiding decorative content on narrow screens).
- User-facing strings go through `@jsverse/transloco` (`| transloco` pipe, `provideTranslocoScope('<feature>')` per routed feature), never hardcoded.

**Performance**
- Routes/features lazy-loaded (`loadComponent`); no needless initial-bundle bloat.
- `OnPush` + signals/async pipe; no heavy work in templates/getters; `@for` uses `track`; large lists virtualized or server-paginated; inputs debounced.
- Subscriptions cleaned up; no nested subscribes; no over-fetching. `rxMethod` pipes that can error must `catchError` internally (an uncaught error permanently kills that `rxMethod` for every later call).

**Style & lint**
- 2-space indent, single quotes, Prettier defaults (`printWidth: 100`, semicolons). **No `any`**; explicit function return types and member accessibility (`public`/`private`/`protected`) everywhere — `pnpm lint` enforces this (`eslint.config.js`, mirrors `@typescript-eslint/typedef` + `explicit-member-accessibility`). Flag anything ESLint would reject; a targeted `eslint-disable-next-line` with a reason comment is acceptable only for the known `@ngrx/signals` `signalStore()`/`withMethods()` return-type gap, not as a general escape hatch.

**Tests**
- New/changed behavior is covered (or a clear reason it isn't). Test runner is Vitest via `@angular/build:unit-test` (`pnpm test`) — already configured, don't re-scaffold it.

**Docker / delivery**
- Nothing environment-specific gets baked into the image — `server.ts` reads all runtime config from `process.env` (via `readRequiredEnv`/`readOptionalEnv`), and the Dockerfile's build-stage env vars are explicitly placeholder-only (see its comments) for the build tool's internal route-extraction step, never real values.

## Output

Group findings by severity (blocker / should-fix / nit). For each: location, what's wrong, why it matters, and a suggested fix. Don't restate unchanged code as findings.
