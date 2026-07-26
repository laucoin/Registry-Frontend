---
mode: agent
description: Review a change in the Registry frontend against project conventions
---

# Code review — Registry Frontend

Review the change I point you at (a diff, a file, or the current branch vs `main`). Report findings most-severe first;
if nothing is wrong, say so. Prefer concrete comments with `file:line`. The authoritative checklist is `AGENTS.md` — the
sections below summarize it.

## What to check

**Correctness**

- Component/composable logic, edge cases, null/undefined handling, template bindings.
- SSR safety: Pinia state uses the **factory form** (`state: () => ({})`) — a shared object leaks across SSR requests.
  Browser-only APIs gated behind client plugins/`import.meta.client`. `useFetch(..., { key })` for deduped keyed
  fetching.

**Architecture (Pinia direct-use) — high priority**

- Components use stores **directly**: `storeToRefs` for state/getters, actions called on the store. No facade layer.
- All side effects (HTTP, cookies, navigation, i18n) live in **store actions**, never in components. `set*` = pure
  setters (SSR-hydration safe); `update*`/verbs = orchestrators with side effects — don't mix the two.
- Feature stores are code-split with their route and registered in `reset-cascade.ts` when project-scoped.

**Auth / security — top priority**

- Server-side session reads go through `peekSession()`; anonymous visitors must never receive a session cookie; new
  sealed-cookie writes call `assertCookieSizes()`.
- The browser only calls the Nuxt origin (`/api/**` proxy) — never Spring directly; no tokens in client code.
  State-changing proxy calls send `x-csrf-token` (`useSessionStore().csrf`).
- CSP never widened (`style-src 'unsafe-inline'` is the one deliberate exception; scripts stay nonce-strict). Secrets
  only via server-scope `runtimeConfig`, never `runtimeConfig.public`. New public config fields go through the zod
  schema in `shared/utils/registry-config.ts`.

**Accessibility (WCAG 2.2 AA) — top priority**

- Semantic HTML (real `<button>`/`<a>`/landmarks/ordered headings); no click handlers on `<div>`/`<span>`.
- Keyboard operable: tab order, visible focus, Enter/Space/Esc; focus outlines not removed without replacement.
- Every control labeled (AntD `Select` needs an explicit `aria-label`); decorative images `alt="" aria-hidden`; async
  errors announced via `role="alert"`/live regions; AA contrast in **both** theme modes.
- Every new component's test includes an axe assertion.

**UX / UI / responsive**

- Every action gives feedback (loading, disabled-while-pending, success/error, empty states) — no dead clicks or silent
  failures; forms validate inline and preserve input on error.
- Mobile-first down to **320px** — no fixed widths that overflow, long strings wrap (`overflow-wrap`); global responsive
  rules only in `app/assets/css/responsive.css`; key surfaces covered by `responsive.spec.ts`.
- Theme/brand tokens from `useRegistryTheme` / assets from `useRegistryAssets` — never hardcoded colors or asset paths.
- User-facing strings go through `$t()` with keys in `i18n/locales/{fr,en}.json` — no hardcoded text.

**Test hooks (`data-testid`) — E2E contract**

- Every interactive element carries a stable kebab-case `data-testid` (`<scope>-<element>[-<qualifier>]`, per the
  AGENTS.md naming table). In `HeaderNav.vue`-style dual renders, only the desktop instance carries testids (`:hooks`
  gates them) so hooks stay unique.

**Performance**

- Routes/feature stores code-split; no needless initial-bundle bloat; no heavy work in templates/computed re-runs; large
  lists virtualized or server-paginated; inputs debounced; no over-fetching (keyed `useFetch` dedup).

**Style & lint**

- 4-space indent, single quotes, spaces inside brackets. **No `any`**; explicit return types. Flag anything ESLint would
  reject.

**Comments (strict policy — see AGENTS.md)**

- Flag extraneous comments as findings: inline explanations, end-of-line comments, step-by-step narration inside bodies,
  commented-out code, and docstrings that restate the obvious.
- The only allowed comment is an English JSDoc block comment (`/** … */`) directly above a genuinely complex function
  explaining intent/constraints (security invariants, third-party quirks) — flag a `//` block used for documentation,
  and flag any ADR reference in a comment. Tooling directives (`eslint-disable*`, `@ts-expect-error`) are exempt.
- Test structure comments `// Arrange`, `// Act`, `// Assert` are protected — flag any change that deletes or modifies
  them.

**Tests**

- New/changed behavior is covered (or a clear reason it isn't); component tests keep the axe gate.

## Output

Group findings by severity (blocker / should-fix / nit). For each: location, what's wrong, why it matters, and a
suggested fix. Don't restate unchanged code as findings.
