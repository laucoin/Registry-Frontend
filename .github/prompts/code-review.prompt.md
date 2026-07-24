---
mode: agent
description: Review a change in the Registry frontend against project conventions
---

# Code review — Registry Frontend

Review the change I point you at (a diff, a file, or the current branch vs `main`). Report findings most-severe first; if nothing is wrong, say so. Prefer concrete comments with `file:line`.

## What to check

**Correctness**
- Component logic, edge cases, null/undefined handling, template bindings.
- RxJS: subscriptions cleaned up (`takeUntilDestroyed`/async pipe), no nested subscribes, correct operators, no memory leaks.

**Architecture (NGXS + feature-first) — high priority**
- State flows component → facade → action → state → service. Components stay thin; no business logic or direct HTTP in components.
- State is mutated **only** inside NGXS handlers (immutably) — never elsewhere.
- Code lives in the right place: `domains/<domain>/` (with `data/state` + `data/model`), `shell/`, or `shared/util-*`.
- Standalone components (no NgModules); dependencies declared in `imports`.

**Accessibility — top priority (see AGENTS.md § Accessibility)**
- Semantic HTML (real `<button>`/`<a>`/landmarks/ordered headings); no click handlers on `<div>`/`<span>`.
- Keyboard operable: tab order, visible focus, Enter/Space/Esc; focus outlines not removed without replacement.
- Every control has a label/accessible name; icon-only buttons named; ARIA used only where HTML can't express it (PrimeNG a11y props preferred).
- Loading/error/toast state announced (`aria-live`/PrimeNG messages); AA contrast in both themes; `prefers-reduced-motion` respected.

**UX / UI (see AGENTS.md § UX/UI)**
- Every action gives feedback (loading, disabled-while-pending, success/error, empty states) — no dead clicks or silent failures.
- Reuses `shared/util-ui` + PrimeNG patterns for consistency; forms validate inline and preserve input on error; responsive across breakpoints.
- User-facing strings go through `@ngx-translate`, not hardcoded.

**Performance (see AGENTS.md § Performance)**
- Routes/features lazy-loaded; no needless initial-bundle bloat.
- `OnPush` + async pipe; no heavy work in templates/getters; `@for` uses `track`; large lists virtualized or server-paginated; inputs debounced.
- Subscriptions cleaned up (`takeUntilDestroyed`/async pipe); no nested subscribes; no over-fetching.

**Style & lint**
- 4-space indent, single quotes, spaces inside brackets. **No `any`**; explicit function return types. Flag anything ESLint would reject.

**Tests**
- New/changed behavior is covered (or a clear reason it isn't).

## Output

Group findings by severity (blocker / should-fix / nit). For each: location, what's wrong, why it matters, and a suggested fix. Don't restate unchanged code as findings.
