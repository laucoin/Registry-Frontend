# Instructions for AI Agents — Spec-Driven Development & Stacked PRs

## 1. Project Context & Documentation Resolution

- **Target Project:** Registry
- **Scope:** Frontend
- **Target Repository:** this repository (Angular, server-side rendered, signal stores). Specifications live in a **separate repository** — the documentation hub (`documentation/registry/`). Spec commits never land here; code commits never land there.
- **Default Documentation URL:** `https://doc.laucoin.fr/registry`

### Agent Rule for Doc Resolution:

Before implementing any feature or reading a specification:

1. Check if a local path (e.g., `documentation/registry`) or specific URL was supplied in the user's prompt.
2. If unspecified, ask the user before proceeding:
   > *"Should I fetch the specification from the default URL (`https://doc.laucoin.fr/registry`) or a local path?"*

### Where the frontend specs live:

| Source                                                      | What it holds                                                                                                                                                                                                    |
|-------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `functional/roles-and-permissions.md`                       | The authorization model the UI **mirrors** — the two permission planes, roles, the access matrices, the per-project option gating that route guards reproduce                                                    |
| `functional/features/*.md`                                  | Per-feature rules + BDD/Gherkin scenarios: `projects`, `project-profiles`, `participants`, `groups`, `movements`, `vehicles`, `activities`, `communications`, `alerts`, `users`, `preferences`, `data-retention` |
| `functional/domain-model.md`, `personas.md`, `workflows.md` | Business vocabulary, actors, end-to-end journeys                                                                                                                                                                 |
| `technical/frontend.md`                                     | The frontend engineering spec — stack, app shape, routing, guards, the component→facade→store→api flow, browser auth, runtime config, a11y/UX conventions, build & delivery                                      |
| `technical/architecture.md`                                 | The frontend section and the end-to-end request flow                                                                                                                                                             |
| `technical/security.md`                                     | What the frontend does and **does not** enforce                                                                                                                                                                  |
| `technical/api-reference.md`                                | Every `/api/v1` endpoint the apis call, with its required permission and the list-query grammar                                                                                                                  |
| `technical/getting-started.md`                              | Running the SSR app locally, including `.env` (see §8)                                                                                                                                                           |
| `technical/adr/`                                            | ADRs **007, 008, 009, 012** govern the frontend (001–006, 011 are backend-scoped — ignore them here)                                                                                                             |

## 2. Communication Style & Behavioral Rules

- **Absolute Conciseness:** Direct, factual, no pleasantries or theoretical ramblings.
- **Simplicity:** No academic or unnecessarily complex jargon. Explain actions in 1–2 simple sentences.
- **Strict Scope:** Address only the requested task. Do not refactor surrounding code or fix unrelated items.
- **Language:** Reply to the user in their language; every file written to the repository (code, comments, commit messages) is **English only**. No user-facing string is ever hardcoded — it goes through `@jsverse/transloco`
  (`en`, `fr`).

## 3. Spec-Driven Development (SDD) Protocol

Strict separation must be maintained between documentation/specs and implementation code — and here they are literally different repositories.

### Phase 1: Specification (VitePress — the documentation hub)

- Create or update specifications in `documentation/registry/` (functional first, then technical — never draft technical before the functional spec and `roles-and-permissions.md` baseline are settled).
- Slice specifications into the **smallest testable features**. For this app that means, per screen / domain area:
  - `Step 1: Models + <domain>.api.ts (HTTP calls only), placed inside the owning feature's own folder — core/<domain>/ is reserved for the app-wide cross-cutting concerns already there (auth, config, i18n, theme), not a default location for new domains` — matched to the `api-reference.md` contract and list-query grammar.
  - `Step 2: <domain>.store.ts (an @ngrx/signals signalStore — state + withMethods, patchState only inside it) + <domain>.facade.ts (the domain's sole public entry point, wired for providedIn: 'root')`.
  - `Step 3: One route + its guard(s) + the page/component (OnPush, signals, lazy-loaded via loadComponent, server-side pagination, debounced search where relevant), every string via @jsverse/transloco with a per-feature provideTranslocoScope`.
  - Each new guard and each reusable `shared/` component is its own step.
- **FORBIDDEN:** Do not touch the frontend source or `.vitepress/config.*` during this phase.

### Phase 2: Implementation via GitHub PR Stacks

- Base implementation **exclusively** on the validated specification step fetched from the resolved documentation source.
- Deliver every single implementation step as an isolated GitHub PR stacked on the previous step's branch.
- **FORBIDDEN:** Do not modify documentation files during code implementation steps.

## 4. Git Strategy & GitHub Stacked PRs Execution

Each PR must represent the **smallest testable feature** to ensure fast, hazard-free code reviews. All branch/PR commands below run inside this repository.

1. **Stack Branching:** For step $N$, create branch `feat/<feature>/0N-<step-name>` branching from `0N-1` (or `main` for step 1).
2. **Atomic Implementation:** Implement ONLY the scope of the smallest testable feature for step $N$.
3. **MANDATORY Pre-PR Testing & Verification:**
  - The gates are:
    - `pnpm run lint` — must pass with zero errors (`no-explicit-any`, missing explicit return types, and missing explicit member accessibility are all errors — see `eslint.config.js`).
    - `pnpm test` — Vitest (`@angular/build:unit-test`). New store methods, guards, and interceptor branches need coverage; see `.github/prompts/test.prompt.md` for conventions, including the SSR-platform-branch pattern.
    - `pnpm run build` — must succeed within the bundle budgets (`angular.json`: initial bundle ≤ 500 kB warning / 1 MB error, component stylesheet ≤ 4 kB warning / 8 kB error). The initial bundle currently exceeds 500 kB (ng-zorro-antd's full stylesheet import) — a known, accepted warning, not yet a hard failure; don't let a new change push it past the 1 MB error threshold.
    - Manual verification of the feature against a **running backend** (`pnpm start`, with `.env` set — see §8), following the relevant BDD scenario end to end. For anything auth-related, verify with a real IdP round-trip (Authentik locally), not just a mocked facade — this flow has non-obvious failure modes (see §9's interceptor note).
  - End-to-end regression coverage is the `Registry-E2E` project's responsibility, not this repo's — flag when a change needs an E2E update.
  - Do NOT proceed if lint fails, tests fail, the production build breaks a budget, or the feature cannot be verified against the backend.
4. **GitHub PR Creation:**
  - Open/create the Pull Request targeting base branch `feat/<feature>/0N-1` (using
    `gh pr create --base feat/<feature>/0N-1`).
5. **Confirmation to Continue:** Stop and ask the user for validation before moving to step $N+1$.

## 5. Requirement Validation & Internal Documentation / README Updates

Before marking any task or PR step as complete:

1. **Validation Against Specification:**
  - Explicitly verify the code matches every functional and technical requirement for the feature — the guard (s)
    match the `roles-and-permissions.md` matrix (once role/permission guards exist beyond session-presence), the api calls match the `api-reference.md` contract (paths, `camelCase` params, `pageNumber`/`pageSize` bounds), errors are surfaced per the interceptor rules, and every string is translated.
  - Re-check accessibility (semantic HTML, keyboard + visible focus, accessible names, WCAG AA contrast in both themes, `prefers-reduced-motion`) and the UX feedback rules (loading indicator, disabled-while-in-flight, success/error feedback, empty state).
  - Ensure zero regressions: `pnpm run lint` clean, `pnpm test` clean, production build within budget.

2. **README.md & Internal Doc Synchronization:**
  - Update `README.md` and `.env.example` whenever a config key, a consumed API, an enabled UI action, a route, or a dependency changes.
  - The `README.md` MUST include an exhaustive **"How to install and use it? ⚙️"** section detailing:
    - Prerequisites & runtime versions (Node.js — match `Dockerfile`'s `node:24-slim`/distroless `nodejs24`; pnpm, version pinned via `packageManager` in `package.json`, no separate install needed — `corepack enable` handles it).
    - Every `.env` key (see §8's table) with defaults and descriptions, kept in sync with `.env.example`.
    - Local setup & installation steps (`pnpm install`, copy `.env.example` to `.env` and fill it in, `pnpm start`
      with the backend running).
    - Build, serve, lint, test, and Docker verification commands.

## 6. Smallest Testable Feature Sizing Limits

- **Scope Rule:** Keep diffs strictly confined to the single testable feature — aim for minimal file changes and under **100 lines** where possible, excluding README/doc sync and generated boilerplate. One signal-store slice (api + store + facade) is three files for a little behaviour — that is expected, but do not fold two slices into one step.
- **Atomic Commits:** Format `<type>(<scope>): [Step N] <short summary>`. `type` ∈
  `feat, fix, chore, docs, style, refactor, perf, test`. Commits **must** follow Conventional Commits — semantic-release derives the version, changelog, and tag from them (ADR 009); a non-conventional message produces a wrong or missing release.
- If a step includes multiple testable behaviors (e.g. a new route **and** a new reusable `shared/` component), stop immediately and split it into separate stacked sub-branches/PRs.
- Style conventions: **tabs, single quotes** (`printWidth: 100`; see `.prettierrc`/`.editorconfig`). JSON, YAML and Markdown stay space-indented (`.prettierrc`'s override, `.editorconfig`'s per-extension blocks).

## 7. Adjustments & Error Recovery

- **Misunderstanding / Bug:** Stop immediately. Do not stack patch commits on a broken PR. Explain the issue in 1 sentence to allow a `git reset`.
- **Scope Change / Unforeseen Case:** Update the specification documentation in the hub FIRST. Do not code until the spec commit is created.
- **Cosmetic / UI Tweaks:** Keep modifications localized strictly to the relevant visual component within the active branch. A palette/spacing change belongs in `theme.less`/`theme-dark.less`, not scattered across component stylesheets.

## 8. Project Commands

- **Local Specs Preview:** `pnpm dev` — run in the **documentation hub repo**, not here.
- **Tests:** `pnpm test` — Vitest via `@angular/build:unit-test`, already configured (`vitest`/`jsdom` devDependencies,
  `test` architect target in `angular.json`). Don't re-scaffold it.
- **Serve locally:** `pnpm install`, copy `.env.example` to `.env` and fill it in, then `pnpm start` — `ng serve` on
  `http://localhost:4200`, requires the backend running and `NG_ALLOWED_HOSTS` set (see below — without it every request 400s, including the app's own boot).
- **Build / Verification:** `pnpm run build` → `dist/registry-frontend/{browser,server}` (output hashing + bundle budgets enforced; the `server` output is `server.mjs`, the Express/Angular-SSR entry point).
- **Lint:** `pnpm run lint` (ESLint + angular-eslint).
- **Docker:** `docker build .` — multi-stage (`node:24-slim` builder → `gcr.io/distroless/nodejs24-debian12:nonroot`
  runtime, uid 65532, no shell). The build stage sets placeholder env vars purely so `ng build`'s internal route-extraction step (which briefly boots `server.ts`) doesn't abort on a missing required var — see the Dockerfile's own comments. Real config is supplied at `docker run` time.

### Runtime configuration (never compiled in, never committed — placeholders only)

Runtime config is **environment variables read by `server.ts` at process start**, served to the client over
`GET /api/config`, and blocking the first render via `provideAppInitializer` in `app.config.ts` (so every consumer —
`AuthApi`, the interceptor, the legal pages — can read `ConfigFacade`'s signal synchronously once bootstrap completes).

| Variable                                             | Required?                  | Holds                                                                                                                                                                                                                                                  |
|------------------------------------------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BACKEND_URL`                                        | Yes                        | Base URL of the Spring API                                                                                                                                                                                                                             |
| `ORGANIZATION_NAME` / `ORGANIZATION_WEBSITE`         | Name yes, website no       | The organization this deployment is for — Registry is multi-tenant SaaS, SGDF is only the origin case                                                                                                                                                  |
| `CREATOR_NAME` / `CREATOR_EMAIL` / `CREATOR_WEBSITE` | Name+email yes, website no | Footer/legal-page attribution                                                                                                                                                                                                                          |
| `HOSTING_PROVIDER_NAME` / `HOSTING_PROVIDER_ADDRESS` | No                         | `/terms` and `/privacy` hébergeur clause; missing just shows a fallback message, doesn't block anything                                                                                                                                                |
| `SUPPORT_ISSUES_URL`                                 | No                         | Footer "Support" link; hidden when unset                                                                                                                                                                                                               |
| `NG_ALLOWED_HOSTS`                                   | Yes, in practice           | Angular's built-in SSRF guard — comma-separated hostnames (no port/scheme) the server accepts a `Host` header for. Empty/unset rejects **every** request, including the app's own same-origin `/api/config` self-fetch on boot. No permissive default. |

A missing *required* variable crashes `server.ts` loudly at startup (`readRequiredEnv`) rather than silently booting misconfigured.

## 9. Project Invariants

Non-negotiable constraints — a change must not silently violate any of these:

- **The frontend enforces nothing.** Guards (`authGuard`, `guestGuard`, and any future permission-driven ones) and any permission-driven UI exist for usability only — the backend re-checks every condition on every request. Never treat a guard, a hidden button, or a client-side check as a security control. (`technical/security.md`,
  `technical/frontend.md`)
- **Standalone components only** — no `NgModule`. Angular 22.
- **Architecture is api → store → facade → everything else**, regardless of where the domain's files live:
  - `<domain>.api.ts` — HTTP calls only, no state.
  - `<domain>.store.ts` — an `@ngrx/signals` **`signalStore`** (`withState` + `withMethods`; `patchState` only inside it). **Stores must be signal stores** — no NGXS, no hand-rolled `BehaviorSubject` state, no `ComponentStore`.
  - `<domain>.facade.ts` — the domain's **sole public entry point**. Components, guards, and the interceptor inject **only the facade**, never the store or the api directly. The facade exposes state as `Signal`s straight off the store and forwards method calls — no dispatch/action indirection. The facade itself, though, is free to call the `<domain>.api.ts` directly instead of the store: only work whose result must be **persisted in state and shared across components** belongs in the store (e.g. `AuthFacade.currentUser`, updated after login/logout/refresh); a call with nothing to keep in state (e.g. `AuthFacade.login()`'s redirect to the IdP, `AuthFacade.refreshToken()`) calls the api directly.
  - **Placement:** `core/<domain>/` is reserved for the app-wide, cross-cutting singleton concerns already there
    (`auth`, `config`, `i18n`, `theme`) — it is not a default location for new domains. A domain scoped to a routed
    feature keeps its api/store/facade inside that feature's own folder under `features/<feature>/`. Reusable
    presentational components (no api/store/facade of their own) live in `shared/`. Components do no HTTP, no
    business logic, and no state mutation outside a store method.
  - **Components/pages are UI only.** Rendering and wiring user interaction is their entire job — manipulating
    data, the DOM (`document`, `window`, direct style/attribute mutation), or any other side effect is never a
    component's own responsibility. A component may only *ask* for that behavior by injecting a `*.service.ts`
    (or a facade, for domain data) that does the actual work — it never performs the mutation inline in its own
    class body. E.g. `DocumentLangService` (`core/i18n/`) owns keeping `document.documentElement.lang` in sync
    with `TranslocoService.activeLang()`; the root `App` component doesn't inject or reference it at all — it's
    wired once at the composition root (`provideAppInitializer` in `app.config.ts`), the same pattern
    `ConfigFacade.load()` uses.
- **`rxMethod` pipes must swallow their own errors** (`catchError` inside, before the error reaches the pipe's outer subject). An uncaught error inside a `rxMethod`'s source permanently kills that method for every later call, not just the failing one.
- **SSR-safety: no unconditional `window`/`document`/`sessionStorage`/`localStorage` access.** Route guards, component/facade constructors/field initializers, and anything a `signalStore`'s `withMethods` factory runs eagerly execute during server render too. Guard browser-only code with `isPlatformBrowser(inject(PLATFORM_ID))` (see `authGuard`,
  `guestGuard`, `AuthFacade.login`, `auth.store.ts`'s `logout`). Getting this wrong doesn't always crash loudly — it can also leave the app "stuck": an HTTP request issued from inside another request's still-unwinding interceptor stack can deadlock Angular zoneless change detection's `PendingTasks` tracking.
- **Core domain stores are app-wide singletons (`{ providedIn: 'root' }`), not scoped per route.** If a domain's state needs to reset when navigating between contexts (e.g. switching projects), evaluate per-route scoping deliberately and raise the design with the user first — don't default into it.
- **No environment value is compiled into the bundle.** Everything in §8's table comes from `server.ts` reading
  `process.env` at runtime and serving it over `GET /api/config`; the repo ships `.env.example` (placeholders) only —
  `.env` itself is gitignored and never committed. The Dockerfile's build-stage env values are explicitly throwaway-placeholder, documented inline as such — never mistake them for real config.
- **Theming is two compiled LESS bundles, not runtime data.** `styles.less` (always-on, light) and `theme-dark.less`
  (a separate CSS bundle, `inject: false` in `angular.json`, toggled at runtime by flipping a `disabled` `<link>` via
  `ThemeToggleService`) are both **built at compile time** — re-skinning this app requires a rebuild, not a config change. If that constraint needs to be lifted, that's a design decision to raise with the user, not something to silently work around.
- **Bootstrap is contract-first with the backend for auth**, but the backend brokers the OIDC exchange — the frontend only orchestrates redirects and holds the result. **The session lives in an HttpOnly cookie the frontend never reads.** `sessionStorage` holds only the post-login redirect target (`REDIRECT_URI_KEY`, cleared once consumed) — never the token itself, never `localStorage`.
- **One HTTP interceptor** (`auth.interceptor.ts`) owns everything that touches the backend (scoped to
  `ConfigFacade`'s runtime `backend.url`, ignores every other host): attaches `withCredentials` + the CSRF header, refreshes once on `401` and replays transparently, turns `0 / 502 / 503` into a generic "service unavailable" error, and redirects to `/login` on an unrecoverable `401`. **The token-refresh endpoint itself is explicitly excluded from the refresh-and-retry branch** (`NO_AUTH_PATHS`) — without that exclusion, a `401` on `/token/refresh` re-enters the same case and waits on the very `refreshTokenInProgress$` observable it's part of, forever. Do not "simplify" that exclusion away. Do not scatter interceptor logic into services.
- **No user-facing string outside `@jsverse/transloco`.** Each routed feature declares its own scope (`provideTranslocoScope('<feature>')`); new reusable UI belongs in `shared/`, not reinvented per screen.
- **TypeScript strictness is enforced as errors** — `no-explicit-any`, missing explicit return types, and missing explicit member accessibility (`public`/`private`/`protected`) all fail the lint gate (`eslint.config.js`). The one accepted relaxation is the `**/*.store.ts` override in `eslint.config.js`, which turns off `@typescript-eslint/typedef`'s `arrowParameter` and `variableDeclaration` checks — a `signalStore(...)`/`withMethods((store) => ...)` declaration's generic return type genuinely can't be spelled out by hand. No inline `eslint-disable` comments for this; everything else in `typedef` (and every other rule) stays enforced in store files too. Don't widen that override anywhere else.
- **The production build enforces bundle budgets** (`angular.json`) — see §8. An initial bundle past 1 MB or a component stylesheet past 8 kB is a hard failure, not a nuisance.
- **The Docker image is distroless and rootless** (`gcr.io/distroless/nodejs24-debian12:nonroot`, uid 65532, no shell, no package manager). Production `node_modules` come from a dedicated `pnpm install --prod` stage, never pruned from the dev install. Do not add anything to the runtime stage that needs a shell to work.
- **No CSP or other hardening headers are currently set** by `server.ts` (no `Content-Security-Policy`,
  `X-Frame-Options`, HSTS, etc.). This is a known, accepted gap, not a decision to quietly reverse — flag it rather than either assuming protection that isn't there or unilaterally adding headers/middleware without checking with the user first.
- **`pnpm run lint` and `pnpm test` are both real, required gates.** End-to-end coverage remains the separate
  `Registry-E2E` project's responsibility.
- **ng-zorro-antd 22 is pinned to Angular 22.** The library's release cadence dictates the frontend's; styling goes through `theme.less`/`theme-dark.less` LESS variable overrides, not component-level overrides. No Bootstrap/PrimeNG dependency in this app.
- **semantic-release → GHCR, retain last 5**, driven by Conventional Commits. (ADR 009)

## 10. Developer Instructions (Manual — Preserved on Regeneration)

Ad hoc rules a developer has added directly to this file — process or behavioral preferences with no spec page to derive them from. On regeneration, copy this section verbatim; never rewrite, prune, or re-derive its contents.

- **Comments:** never add a code comment on your own judgment. If you believe one is genuinely warranted, stop and ask the user for explicit approval before adding it — every single time, not just the first time. Every comment that does get added, like the code itself, is written in English.
