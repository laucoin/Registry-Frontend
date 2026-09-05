# Instructions for AI Agents — Spec-Driven Development & Stacked PRs

## 1. Project Context & Documentation Resolution

- **Target Project:** Registry
- **Scope:** Frontend
- **Target Repository:** `Registry-Frontend` (Angular 22 SPA). Specifications live in a **separate repository** — the
  documentation hub (`documentation/registry/`). Spec commits never land here; code commits never land there.
- **Default Documentation URL:** `https://doc.laucoin.fr/registry`

### Agent Rule for Doc Resolution:

Before implementing any feature or reading a specification:

1. Check if a local path (e.g., `documentation/registry`) or specific URL was supplied in the user's prompt.
2. If unspecified, ask the user before proceeding:
   > *"Should I fetch the specification from the default URL (`https://doc.laucoin.fr/registry`) or a local path?"*

### Where the frontend specs live:

| Source                                                      | What it holds                                                                                                                                                                                                    |
|-------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `functional/roles-and-permissions.md`                       | The authorization model the UI **mirrors** — the two permission planes, roles, the access matrices, the per-project option gating that the route guards reproduce                                                |
| `functional/features/*.md`                                  | Per-feature rules + BDD/Gherkin scenarios: `projects`, `project-profiles`, `participants`, `groups`, `movements`, `vehicles`, `activities`, `communications`, `alerts`, `users`, `preferences`, `data-retention` |
| `functional/domain-model.md`, `personas.md`, `workflows.md` | Business vocabulary, actors, end-to-end journeys                                                                                                                                                                 |
| `technical/frontend.md`                                     | The frontend engineering spec — stack, app shape, routing, guards, the component→facade→action→state→service flow, browser auth, runtime config, a11y/UX conventions, build & delivery                           |
| `technical/architecture.md`                                 | The frontend section and the end-to-end request flow                                                                                                                                                             |
| `technical/security.md`                                     | What the frontend does and **does not** enforce                                                                                                                                                                  |
| `technical/api-reference.md`                                | Every `/api/v1` endpoint the services call, with its required permission and the list-query grammar                                                                                                              |
| `technical/getting-started.md`                              | Running the SPA locally, including the two `public/settings/` JSON files                                                                                                                                         |
| `technical/adr/`                                            | ADRs **007, 008, 009, 012** govern the frontend (001–006, 011 are backend-scoped — ignore them here)                                                                                                             |

## 2. Communication Style & Behavioral Rules

- **Absolute Conciseness:** Direct, factual, no pleasantries or theoretical ramblings.
- **Simplicity:** No academic or unnecessarily complex jargon. Explain actions in 1–2 simple sentences.
- **Strict Scope:** Address only the requested task. Do not refactor surrounding code or fix unrelated items.
- **Language:** Reply to the user in their language; every file written to the repository (code, comments, commit
  messages) is **English only**. No user-facing string is ever hardcoded — it goes through `@ngx-translate` (`en`,
  `fr`).

## 3. Spec-Driven Development (SDD) Protocol

Strict separation must be maintained between documentation/specs and implementation code — and here they are literally
different repositories.

### Phase 1: Specification (VitePress — the documentation hub)

- Create or update specifications in `documentation/registry/` (functional first, then technical — never draft technical
  before the functional spec and `roles-and-permissions.md` baseline are settled).
- Slice specifications into the **smallest testable features**. For this SPA that means, per screen / domain area:
    - `Step 1: DTOs, view models & enums in shared/util-model + the domain data/ service (HTTP calls)` — matched to the
      `api-reference.md` contract and list-query grammar.
    -
    `Step 2: NGXS state + actions + facade + selectSignal wiring + per-route provider + the profile-switch reset-cascade entry`.
    -
    `Step 3: One route + its guard(s) + the list or form component (OnPush, async pipe, server-side pagination, debounced search), every string via @ngx-translate`.
    - Each option-gated route (`vehicleOptionGuard`, `activityOptionGuard`, `alertOptionGuard`), each new guard, and
      each reusable `shared/util-ui` component is its own step.
- **FORBIDDEN:** Do not touch `Registry-Frontend` source or `.vitepress/config.*` during this phase.

### Phase 2: Implementation via GitHub PR Stacks (`Registry-Frontend`)

- Base implementation **exclusively** on the validated specification step fetched from the resolved documentation
  source.
- Deliver every single implementation step as an isolated GitHub PR stacked on the previous step's branch.
- **FORBIDDEN:** Do not modify documentation files during code implementation steps.

## 4. Git Strategy & GitHub Stacked PRs Execution

Each PR must represent the **smallest testable feature** to ensure fast, hazard-free code reviews. All branch/PR
commands below run inside `Registry-Frontend`.

1. **Stack Branching:** For step $N$, create branch `feat/<feature>/0N-<step-name>` branching from `0N-1` (or `main` for
   step 1).
2. **Atomic Implementation:** Implement ONLY the scope of the smallest testable feature for step $N$.
3. **MANDATORY Pre-PR Testing & Verification:**
    - There is **no unit-test runner** in this repo (`skipTests` is on, no `test` script). The gates are:
        - `pnpm run lint` — must pass with zero errors (`no-explicit-any` and missing explicit return types are errors).
        - `pnpm run build --configuration=production` — must succeed within the bundle budgets (initial bundle ≤ 500 kB,
          component stylesheet ≤ 2 kB, or the build warns).
        - Manual verification of the feature against a **running backend** (`pnpm start`), following the relevant BDD
          scenario end to end.
    - End-to-end regression coverage is the `Registry-E2E` project's responsibility, not this repo's — flag when a
      change needs an E2E update.
    - Do NOT proceed if lint fails, the production build breaks a budget, or the feature cannot be verified against the
      backend.
4. **GitHub PR Creation:**
    - Open/create the Pull Request targeting base branch `feat/<feature>/0N-1` (using
      `gh pr create --base feat/<feature>/0N-1`).
5. **Confirmation to Continue:** Stop and ask the user for validation before moving to step $N+1$.

## 5. Requirement Validation & Internal Documentation / README Updates

Before marking any task or PR step as complete:

1. **Validation Against Specification:**
    - Explicitly verify the code matches every functional and technical requirement for the feature — the guard (s) and
      option gates match the `roles-and-permissions.md` matrix, the service calls match the `api-reference.md` contract
      (paths, `camelCase` params, `pageNumber`/`pageSize` bounds), errors are surfaced per the interceptor rules, and
      every string is translated.
    - Re-check accessibility (semantic HTML, keyboard + visible focus, accessible names, WCAG AA contrast in both
      themes, `prefers-reduced-motion`) and the UX feedback rules (loading indicator, disabled-while-in-flight,
      success/error toast, empty state).
    - Ensure zero regressions: `pnpm run lint` clean, production build within budget.

2. **README.md & Internal Doc Synchronization:**
    - Update `README.md` and the placeholder `public/settings/*.json` samples whenever a config key, a consumed API, an
      enabled UI action, a route, or a dependency changes.
    - The `README.md` MUST include an exhaustive **"How to install and use it? ⚙️"** section detailing:
        - Prerequisites & runtime versions (Node.js 24 LTS — `^24.15`; pnpm 11).
        - The two runtime config files (`public/settings/env.json`, `public/settings/config.json`) — every key with
          defaults and descriptions.
        - Local setup & installation steps (`pnpm install`, create the settings files, `pnpm start` with the backend
          running).
        - Build, serve, lint, and verification commands.

## 6. Smallest Testable Feature Sizing Limits

- **Scope Rule:** Keep diffs strictly confined to the single testable feature — aim for minimal file changes and under
  **100 lines** where possible, excluding README/doc sync and generated boilerplate. One NGXS slice (state + actions +
  selectors + facade) is a lot of files for a little behaviour — that is expected, but do not fold two slices into one
  step.
- **Atomic Commits:** Format `<type>(<scope>): [Step N] <short summary>`. `type` ∈
  `feat, fix, chore, docs, style, refactor, perf, test`. Commits **must** follow Conventional Commits — semantic-release
  derives the version, changelog, and tag from them (ADR 009); a non-conventional message produces a wrong or missing
  release.
- If a step includes multiple testable behaviors (e.g. a new route **and** a new reusable `util-ui` component), stop
  immediately and split it into separate stacked sub-branches/PRs.
- Style conventions: **4-space indent, single quotes, spaces inside array and object brackets.**

## 7. Adjustments & Error Recovery

- **Misunderstanding / Bug:** Stop immediately. Do not stack patch commits on a broken PR. Explain the issue in 1
  sentence to allow a `git reset`.
- **Scope Change / Unforeseen Case:** Update the specification documentation in the hub FIRST. Do not code until the
  spec commit is created.
- **Cosmetic / UI Tweaks:** Keep modifications localized strictly to the relevant visual component within the active
  branch. A restyle that belongs in the PrimeNG preset goes in `config.json`, not in component SCSS.

## 8. Project Commands

- **Local Specs Preview:** `pnpm dev` — run in the **documentation hub repo**, not in `Registry-Frontend`.
- **Tests:** none configured. `pnpm run lint` is the only in-repo automated gate; regression E2E lives in the
  `Registry-E2E` project.
- **Serve locally:** `pnpm install` then `pnpm start` — `ng serve` on `http://localhost:4200`, requires the backend
  running.
- **Build / Verification:** `pnpm run build --configuration=production` → `dist/browser` (output hashing + bundle
  budgets enforced).
- **Lint:** `pnpm run lint` (ESLint + angular-eslint).

### Runtime configuration (never compiled in, never committed — placeholders only)

| File                          | Holds                                                                                                                                                                                                                                                                           |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `public/settings/env.json`    | `production` flag; `backend.url`; `backend.noAuthPaths` (the four `/api/v1/authentication/*` paths that skip the token)                                                                                                                                                         |
| `public/settings/config.json` | `defaultLanguage` + `languages` (`en`, `fr`); the full PrimeNG preset passed to `definePreset(Lara, …)` — semantic palette, separate light & dark schemes, per-component overrides; logo paths per theme and size; enabled element actions; per-severity notification durations |

Both files are fetched (cache-busted) **before Angular bootstraps** and mounted into the nginx container per
environment. A missing or malformed file is logged and the app continues with whatever loaded — startup is not blocked
(ADR 007).

## 9. Project Invariants

Non-negotiable constraints from the ADRs and the "accepted risks" notes — a change must not silently violate any of
these:

- **The frontend enforces nothing.** Guards (`authGuard`, `selectedProfileGuard`, `vehicleOptionGuard`,
  `activityOptionGuard`, `alertOptionGuard`) and any permission-driven UI exist for usability only — the backend
  re-checks every condition on every request. Never treat a guard, a hidden button, or a client-side role check as a
  security control. (`technical/security.md`, `technical/frontend.md`)
- **Standalone components only** — no `NgModule`. Angular 22.
- **The facade is the only surface components touch.** Component → Facade → `dispatch(Action)` → `@Action` handler →
  Service (HTTP); state read back as Signals via `selectSignal`. Components do no HTTP, no business logic, and no state
  mutation outside an `@Action` handler. (ADR 008)
- **Feature state is provided per route**, code-split with its lazy subtree — never registered globally. Adding a
  feature state means wiring it into the **profile-switch reset cascade**; a forgotten dependency is a stale-state bug.
  The root `RegistryState` owns only the cross-cutting concerns (token, current user, selected project, theme, network
  status, screen width, global loader/error, notification queue). (ADR 008)
- **No environment value is compiled into the bundle.** Backend URL, production flag, theme, logos, languages, enabled
  actions and notification durations all come from runtime `settings/env.json` + `settings/config.json`; the repo ships
  **placeholders only** and those concrete files are never committed. (ADR 007)
- **Theming is data, not code.** The entire PrimeNG preset lives in `config.json`; re-skinning a deployment is a JSON
  change, never a rebuild. Light and dark palettes are defined **separately**; dark mode is selected by a `.dark-mod`
  class from the user's stored `SYSTEM`/`LIGHT`/`DARK` preference, not a media query. (ADR 012)
- **Bootstrap is contract-first with the backend for auth**, but the backend brokers the OIDC exchanges — the SPA only
  orchestrates redirects and holds the result. Tokens live in **session storage** (per-tab, cleared on tab close), never
  `localStorage`.
- **One HTTP interceptor** owns everything that touches the backend and ignores every other host: it attaches the
  `Bearer` token and `Accept-Language`, refreshes once on `401` and replays transparently (or starts login with no
  token), turns `0 / 502 / 503` into a full-page "service unavailable" state, and everything else into a typed
  `ErrorModel` toast. Do not scatter this logic into services.
- **No user-facing string outside `@ngx-translate`.** New reusable UI belongs in `shared/util-ui`, not reinvented per
  screen.
- **TypeScript strictness is enforced as errors** — `no-explicit-any` and missing explicit return types fail the lint
  gate.
- **The production build enforces bundle budgets** — an initial bundle over 500 kB or a component stylesheet over 2 kB
  is a budget violation, not a nuisance.
- **The nginx image runs unprivileged on port 8080** and ships **no `Content-Security-Policy` header** — a known,
  accepted gap. Do not assume CSP protects the app; do not add inline-script patterns that would only be safe under a
  CSP.
- **`pnpm run lint` is the only in-repo automated gate.** There is no unit-test runner; end-to-end coverage is the
  separate `Registry-E2E` project. A change that needs regression coverage needs an E2E ticket, not a new test here.
- **PrimeNG 22 is pinned to Angular 22.** The library's release cadence dictates the frontend's; styling goes through
  the preset's override structure — a design that fights the library is expensive. Bootstrap contributes **its grid
  only**, no Bootstrap components.
- **semantic-release → GHCR, retain last 5**, driven by Conventional Commits. (ADR 009)

## 10. Developer Instructions (Manual — Preserved on Regeneration)

Ad hoc rules a developer has added directly to this file — process or behavioral preferences with no spec page to derive
them from. On regeneration, copy this section verbatim; never rewrite, prune, or re-derive its contents.

- [None yet]
