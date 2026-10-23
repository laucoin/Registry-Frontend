---
name: code-review
description: Review gate for the Registry frontend. Use only when the user asks to review, check or audit a diff, file, branch or change, or right before a commit. Never run it automatically after an edit. Rates 5 perspectives out of 10.
---

# Code review — Registry Frontend

Review the change pointed at (a diff, a file, or the current branch vs `main`). Evaluate it from 5 perspectives, give
each a rating out of 10, and list findings most-severe first with `file:line`. Rules of reference: `AGENTS.md` (§2
stack, §3 architecture, §5 standards, §11 invariants).

## `@sgdf/ui` ownership (applies to every perspective)

`@sgdf/ui` is owned by the developer, who can change it (source: `../sgdf-ui`, installed copy:
`node_modules/@sgdf/ui` with `custom-elements.json` and the `.d.ts`).

- If, architecturally, the right fix belongs in `@sgdf/ui`, report it as a finding ("change `@sgdf/ui`: ...") instead of
  accepting an override or workaround in this project (CSS overrides, Tailwind recoloring, rebuilt component, wrapper
  that patches behavior).
- Before reporting an accessibility gap, check whether `@sgdf/ui` already handles it through the properties passed to
  the component (labels, `aria-*` mappings, roles, focus management, announced states). Do not flag what the library
  provides.
- Conversely, flag any accessibility attribute added in this project that duplicates what `@sgdf/ui` already sets.

## Perspectives

**1. Architecture**
- Directory layout (`core/`, `pages/`, `shared/`) and the documented exceptions only; no new `shared` to `pages` or
  `core` to `pages` imports.
- Data flow `api` → `store` → `facade`: components, guards and interceptors inject facades only; `patchState` only
  inside the store; stores never depend on a facade.
- Runtime configuration decoupled from the bundle; DTO → model mappers on every api; browser globals only through
  `BrowserService`.
- `@sgdf/ui` first: reuse of the library before custom UI, Tailwind for layout and spacing only (see ownership above).

**2. TechLead**
- Clean code: methods ≤ 25 lines (specs included), explicit naming, no dead code, idiomatic signals (`input()`,
  `output()`, `OnPush`).
- RxJS: one operator per line with logic extracted into named methods, errors swallowed inside `rxMethod` pipes
  (`catchError`), no nested subscribes, subscriptions cleaned up.
- Modernity: the code uses the latest idiomatic way of doing things for the versions in `package.json` (Angular,
  `@ngrx/signals`, RxJS, TypeScript). Flag deprecated or superseded APIs and legacy patterns for which a newer standard
  exists (signal-based APIs, built-in control flow, `inject()`, standalone, current router, forms and HTTP APIs). Check
  the official release notes or documentation of the version in use rather than relying on memory, and only recommend
  what the project's versions support.
- Loading state scoped per resource, never global; error strategy as agreed; no hardcoded user-facing strings
  (`@jsverse/transloco`).
- Lazy loading, lint rules, invariants of §11.

**3. QA**
- Public methods, stores and facades have tests (Vitest); AAA pattern with the exact `// Arrange`, `// Act`,
  `// Assert` comments; edge cases, error branches, signal state transitions; coverage thresholds hold.

**4. UI/UX & Accessibility**
- Semantic HTML, keyboard navigation, accessible names, ARIA only where HTML cannot express it, announced
  loading/error states, contrast in both themes, reduced motion. Apply the `@sgdf/ui` rule above before flagging or
  adding anything.
- Visual consistency through `shared/ui/` and the global theme; every action gives feedback (loading, disabled while
  pending, success/error, empty states); user error messages clear and formatted.

**5. SEO**
- Every routed page sets its `Title` and `Meta` (description, robots) through the Angular `Title`/`Meta` services,
  translated with `@jsverse/transloco`, unique per route and updated on language change.
- Public pages (home, privacy, legal) are indexable with a canonical URL and Open Graph/Twitter tags; authenticated or
  user-specific pages carry `noindex`.
- Crawlability of the CSR app: real `<a href>`/`routerLink` navigation (no click-only navigation), one `<h1>` per page
  with a coherent heading hierarchy, `lang` attribute kept in sync with the active language, `robots.txt` and sitemap
  coherent with the routes, no content that depends on user interaction to exist.
- Ranking-relevant performance (Core Web Vitals): image dimensions and `NgOptimizedImage`, no layout shift on async
  content, without duplicating the bundle checks of TechLead.
- Not applicable to a change that touches no page, route, `index.html` or meta handling: rate 10 and mark "n/a".

## Rating scale (fixed, not discretionary)

A rating is **computed** from the findings, never judged by feel. Each finding is attributed to exactly one
perspective (the one it mainly belongs to) and has exactly one severity.

- **Start at 10 per perspective**, then subtract per finding of that perspective: **blocker −4**, **should-fix −1**,
  **nit −0.25** (nits together never cost more than −1). Floor at 0. No rounding.
- No finding means 10. Any finding means below 10. A rating without matching findings is invalid.
- A perspective that does not apply to the change (e.g. UI/UX on a store-only change) is rated 10 and marked "n/a".

**Severity definitions**

- **Blocker:** breaks a §11 invariant, the data flow (`api` → `store` → `facade`), or an `rxMethod` that does not swallow
  its errors; wrong behavior or data loss; a frontend-only security assumption; an environment value compiled into the
  bundle; a failing lint, build or coverage threshold; a usability barrier that prevents a keyboard or
  screen-reader user from completing an action.
- **Should-fix:** breaks a §5 standard or a skill rule without being a blocker: method > 25 lines, new behavior
  (store, facade, api, component) without tests, dead code, missing JSDoc header, deprecated or superseded API,
  global loading flag, hardcoded user-facing string, an override or workaround that belongs in `@sgdf/ui`, an
  accessibility gap not handled by `@sgdf/ui`, or an accessibility attribute duplicating `@sgdf/ui`.
- **Nit:** naming, formatting, wording or ordering with no behavioral effect.

With this scale, one blocker always rejects (≤ 6), three should-fix reject (7), two do not (8). Identical findings
must give identical ratings on a re-review.

## Output

1. Findings grouped by severity (blocker / should-fix / nit), each with an id: location, perspective, problem, why it
   matters, suggested fix. Do not restate unchanged code.
2. Ratings table, one row per perspective: starting 10, the ids of its findings with their deductions, resulting
   rating: Architecture /10, TechLead /10, QA /10, UI/UX & Accessibility /10, SEO /10.
3. Verdict: approved only if **every** rating is ≥ 8/10; otherwise list the refactorings required before re-review.
