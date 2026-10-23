---
name: code-review
description: Review gate for the Registry frontend. Use only when the user asks to review, check or audit a diff, file, branch or change, or right before a commit. Never run it automatically after an edit. Rates 6 perspectives out of 10 in a single exhaustive pass, so that an approved review means the change is ready to merge.
---

# Code review — Registry Frontend

Review the change pointed at (a diff, a file, or the current branch vs `main`). Evaluate it from 6 perspectives, give
each a rating out of 10, and list findings most-severe first with `file:line`. Rules of reference: `AGENTS.md` (§2
stack, §3 architecture, §5 standards, §11 invariants).

## Contract: one review, merge-ready

The developer asks for **one** review, not a series. The review is therefore exhaustive and convergent:

- **Complete in one pass.** Every finding of every perspective is reported in this single review. Never hold findings
  back for a later round, never report only the "top N". If all findings are fixed (or explicitly declined by the
  developer), the change is ready to merge and a re-review finds nothing new.
- **Nothing sampled.** Read every changed file of the scope. On a large diff, split it by directory, read each part in
  full, and state in the output which parts were read and how. A rating based on a sample is invalid: say "not
  reviewed" for what was not read and do not approve.
- **Run the gate, do not assume it.** Run `pnpm lint`, `pnpm build` and `pnpm test:coverage` (if `pnpm` is blocked by
  the sandbox, call `node_modules/.bin/eslint`, `ng build` and `ng test --watch=false --coverage` directly). A gate
  that could not run is reported as "unverified" and blocks approval until it has run.
- **Actionable findings.** Each finding states the exact fix (the change to make, not "consider improving"), so that
  applying it needs no further decision. A finding that needs a decision of the developer says so explicitly and
  offers the options.
- **Stable on re-review.** A re-review verifies the previous findings and the code changed since. It reports a new
  finding on unchanged code only if the earlier review missed a defect of a kind it was required to look for, and it
  says so. Identical code gets identical findings and ratings.
- **No invented work.** No finding without a rule (AGENTS.md, this skill, a verified API or security fact) or a
  concrete failure scenario. Personal taste is not a finding.

## Mandatory checks (run before rating)

Each is mechanical: do it, do not rely on impressions. Report violations as findings of the perspective noted.

1. **Scope and history** (TechLead): list the commits (`git log main..HEAD`); each message follows Conventional Commits
   and each commit is a functionally testable increment; no unrelated change mixed in; no leftover `console.log`,
   `debugger`, `fdescribe`/`fit`/`.only`/`.skip`, commented-out code, or `TODO` not marked `// TODO:`.
2. **Dead and unused code** (TechLead): unused exports, files, i18n keys, inputs/outputs, imports, providers.
3. **Layering** (Architecture): grep the imports of the scope for `core` → `pages`, `shared` → `pages` (compare with the
   count documented in AGENTS.md §3), components/guards/interceptors importing a store or an api, `patchState`
   outside stores, stores importing a facade, browser globals outside `BrowserService`.
4. **Translations** (TechLead): every key used in templates and code exists in `public/i18n/` for every language
   shipped; no key left unused; no hardcoded user-facing string.
5. **Tests quality** (QA): beyond existence, the assertions check behavior (not only "is created"), error and empty
   branches are exercised, no test depends on timers or order, each spec method ≤ 25 lines.
6. **Docs coherence** (TechLead): AGENTS.md, README and the documentation hub agree with the change (use `doc-drift`
   when the change touches documented behavior); never edit documentation during the review.

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
- Performance of the build: read the `ng build` output (initial and lazy chunk sizes, budgets, warnings); flag a new
  heavy dependency or an eagerly loaded feature that could be lazy; `OnPush`/signals for change detection, no
  per-change-detection method calls in templates, `track` on every `@for`.

**3. QA**
- Public methods, stores and facades have tests (Vitest); AAA pattern with the exact `// Arrange`, `// Act`,
  `// Assert` comments; edge cases, error branches, signal state transitions; coverage thresholds hold.
- Every new or changed behavior is covered by a test that would fail without it (check the assertions, not only the
  coverage number); the full suite is green.

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

**6. Security & Dependencies**
- Remember AGENTS.md §11: the frontend enforces nothing, so a guard or hidden control is never a security boundary.
- Injection: no `[innerHTML]` with unsanitized data, no `bypassSecurityTrust*`, no `eval`/`new Function`, no dynamic
  script or style injection, no user-controlled URL in `href`, `src`, `window.open` or a redirect (open redirect);
  `target="_blank"` carries `rel="noopener"`.
- Secrets and data: no secret, token, credential or environment value in the source, `public/`, `console.*` or error
  messages; no sensitive data in `localStorage`/`sessionStorage`, URLs or query parameters; personal data is not logged.
- Transport and headers: all backend calls go through the single interceptor (CSRF header, `withCredentials`, refresh
  exclusion preserved); `nginx.conf` hardening headers and CSP stay as strict as before (no `unsafe-eval`, any
  loosening justified).
- Dependencies: run `pnpm audit` (or `pnpm audit --prod`) and report every high or critical advisory reachable from
  the change; for each added or upgraded package in `package.json`/`pnpm-lock.yaml`, check it is needed, maintained,
  license-compatible, compatible with the Angular version in use, and not duplicating an existing dependency; the
  lockfile is committed and consistent with `package.json`. If the audit cannot run (network), report it as
  "unverified" and block approval.
- Not applicable only if the change touches no code, dependency, header or configuration: rate 10 and mark "n/a".

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
  bundle; a high or critical vulnerability in a dependency reachable from the change, an injection or open-redirect
  path, a committed secret; a failing lint, build or coverage threshold; a usability barrier that prevents a keyboard or
  screen-reader user from completing an action.
- **Should-fix:** breaks a §5 standard or a skill rule without being a blocker: method > 25 lines, new behavior
  (store, facade, api, component) without tests, dead code, missing JSDoc header, deprecated or superseded API,
  global loading flag, hardcoded user-facing string, an override or workaround that belongs in `@sgdf/ui`, an
  accessibility gap not handled by `@sgdf/ui`, an accessibility attribute duplicating `@sgdf/ui`, a moderate
  advisory, an unneeded or unmaintained new dependency, a leftover `console.*`/`.only`/commented-out code, an unused
  i18n key, or a commit message that is not Conventional Commits.
- **Nit:** naming, formatting, wording or ordering with no behavioral effect.

With this scale, one blocker always rejects (≤ 6), three should-fix reject (7), two do not (8). Identical findings
must give identical ratings on a re-review.

## Output

0. Scope read: the files and commits reviewed, how the diff was read, and the result of each gate command
   (`lint`, `build`, `test:coverage`, `audit`) as passed / failed / unverified.
1. Findings grouped by severity (blocker / should-fix / nit), each with an id: location, perspective, problem, why it
   matters, suggested fix. Do not restate unchanged code.
2. Ratings table, one row per perspective: starting 10, the ids of its findings with their deductions, resulting
   rating: Architecture /10, TechLead /10, QA /10, UI/UX & Accessibility /10, SEO /10, Security & Dependencies /10.
3. Verdict: approved only if there is **no blocker**, **every** rating is ≥ 8/10, every gate has run and passed, and
   the whole scope was read. Approval does not discard the remaining findings: they are listed anyway and must be
   fixed or explicitly declined by the developer before merge. Otherwise list the refactorings required, complete, so
   that one round of fixes leads to approval.
