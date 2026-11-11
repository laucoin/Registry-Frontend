---
name: architecture-review
description: Evaluates macro-level architectural compliance and performance for the Registry frontend (Angular >= 22). Enforces the three-pillar layout (core, pages, shared), the strict unidirectional api -> store -> facade data flow (@ngrx/signals), modern reactivity (Signals, Signal Forms, OnPush/Zoneless), deferred loading (@defer), memory hygiene (RxJS leak prevention), and Core Web Vitals impact.
---

# Architecture & Performance Review (Macro Perspective)

Review the change (diff, files, or current branch) against the architectural invariants and performance standards of the
Registry frontend. Only files touched by the change are scored; gaps in untouched existing code are listed as debt
without deduction. Start with a baseline score of **100 points** and deduct points based on findings: **blocker −40**,
**should-fix −10**, **nit −2.5** (floor at 0).

---

## Evaluation Criteria

### 1. Project Structure & Directory Isolation

- **Three Core Pillars:**
  - **`core/`**: Essential cross-cutting elements required for the app to run, one folder per domain
    (`authentication/`, `browser/`, `config/`, `language/`, `layout/`, `registry/`, `routing/`, `seo/`).
  - **`pages/`**: Page components strictly organized by their routing path (e.g., `/projects/{id}/movements` ->
    `pages/projects/[:id]/movements/`).
  - **`shared/`**: Structured directory for reusable items not belonging to `core` or `pages`, strictly organized into
    subfolders: `directives/`, `helpers/`, `mappers/`, `models/`, `ui/`.
- **Dependency & Isolation Rules:**
  - **`shared` -> `pages` Imports:** Prohibited, with the sole documented exception of business entity cards and forms
    in `shared/ui/domain/` that read domain facades and models from `pages/`. No other `shared` -> `pages` imports are
    permitted.
  - **`core` -> `pages` Imports:** Prohibited, with the sole documented exception of
    `core/routing/registry-route.enum.ts` (route URL composition) and `core/routing/registry.routes.ts` (lazy
    loading). Stores, facades, APIs, and models in `core` never import from `pages/`. Shared models belong in
    `shared/models/`.
  - **Placement:** an app-wide cross-cutting domain (auth, config, i18n, theme) lives in `core/<domain>/`. A domain
    scoped to one routed page's own data is colocated in that page's folder under `pages/<page>/`.
  - **Core Facades:** `UiFacade` exposes what the shell displays (theme, screen, toasts and global error);
    `SessionFacade` owns the signed-in user and the session (sign-in and sign-out, current user, selected project,
    theme and language preferences, and the choices offered for them); `UserProfileFacade` owns the user's own project
    profiles and invitations and the commands acting on them. Components, guards and interceptors read the choices and
    menus to display from a facade or service.
  - **Core Facades Hierarchy:** `UserProfileFacade` depends on `SessionFacade`, never the other way around.
  - **Shared Presentational Components:** Reusable presentational components with no API, store, or facade of their
    own live in `shared/ui/`.

### 2. Unidirectional Data Flow: API → Store → Facade

- **`<domain>.api.ts` (HTTP Only):**
  - Handles HTTP requests exclusively via `HttpClient`.
  - Strictly stateless (no signals, `BehaviorSubject`, or local state caching).
  - API responses are decoupled from domain models: every `*.api.ts` pipes its response through a mapper
    (`DTO -> model`), even when the structures are identical. Response DTOs live in `shared/models/dto/response/`
    (`<name>.response.dto.ts`); mappers live in `shared/mappers/` (`<Name>Mapper`, an `as const` object exposing
    `toModel`) and only map between objects (DTO to model, model to DTO). Calculations belong to helpers
    (`shared/helpers/`), not to mappers. Metadata lists of `SelectItem` and request DTOs are the only responses not
    mapped.
- **`<domain>.store.ts` (SignalStore `@ngrx/signals`):**
  - Must be implemented using `@ngrx/signals` with `signalStore(withState(...), withMethods(...))`.
  - No NGXS, no `ComponentStore`, no hand-rolled `BehaviorSubject` state.
  - State mutations via `patchState` are strictly encapsulated inside the store.
  - Reusable asynchronous methods must use the builders from `shared/helpers/store/paged-store.methods.ts`
    (`pageFetcher`, `paramsUpdater`, `paramsMerger`, `elementFetcher`, `metadataFetcher`, `movementContentsFetcher`).
    Inject dependencies as parameters of `withMethods`, never via a public `withProps`.
  - Stores never depend on facades; they report failures through `ErrorReporter`
    (`core/registry/state/error-reporter.ts`).
  - Core domain stores are singletons (`{ providedIn: 'root' }`); scoping a core store per route is a deliberate
    choice, raised with the user first rather than adopted by default. Page stores are route-scoped via page route
    providers.
  - Every `rxMethod` pipe swallows its own errors (`catchError` inside the pipe, before the error reaches the outer
    subject): an uncaught error permanently kills the method for every later call.
- **`<domain>.facade.ts` (Sole Public Entry Point):**
  - Components, guards, and interceptors must inject **only the facade**, never the store or API directly.
  - Exposes state as `Signal`s derived straight from the store and forwards method calls.
  - May bypass the store to call the API directly only when nothing needs to be persisted or shared across components
    (e.g., redirect-only action).
  - Handles redundant call filtering before invoking store or API methods.
- **HTTP Interceptor (Single Owner of Backend Concerns):** One interceptor owns everything that touches the backend:
  CSRF header and `withCredentials`, one-shot refresh-and-replay on `401`, mapping `0`/`502`/`503` to a generic
  unavailable error, redirect to `/login` on an unrecoverable `401`. The token-refresh endpoint stays explicitly
  excluded from the refresh-and-retry branch (self-referential deadlock): never simplify that exclusion away, and never
  scatter interceptor logic into services.

### 3. Modern Angular

Strictly align with modern Angular primitives (refer to [Angular Migrations](https://angular.dev/reference/migrations)).
Avoid legacy APIs (e.g., `NgModule`, `*ngIf`, `*ngFor`, `BehaviorSubject`, `ComponentStore`).

- **Reactivity & Inputs:** Use `signal()`, `computed()`, and signal-based queries/bindings (`input()`, `output()`,
  `model()`, `viewChild()`). Prohibit mutating signals inside `effect()`.
- **Forms:** Prefer Signal Forms over legacy Reactive Forms; ensure form state and controls are exposed reactively
  without manual sync side-effects.
- **Dependency Injection:** Use `inject()` function exclusively; avoid constructor injection.
- **RxJS Boundary & Cleanup:** Limit RxJS to complex asynchronous pipelines; convert to signals at boundaries via
  `toSignal()`. Protect every persistent subscription with `takeUntilDestroyed()`.
- **Control Flow:** Enforce `@if`, `@for` (with unique `track <key>`), and `@switch`.

### 4. Runtime Performance, Rendering Strategy & Budgets

- **Change Detection:** `ChangeDetectionStrategy.OnPush`, that the default in Angular. So avoid overriding it to
  `Default` unless explicitly justified.
- **Zoneless Rendering:** `zone.js` is disabled in production builds. Avoid `NgZone.run()` or `runOutsideAngular()`
  unless explicitly justified.
- **Deferred Loading (`@defer`):**
  - Use `@defer` (`on viewport`, `on idle`, `on interaction`) for heavy or below-the-fold components.
  - Mandatory inclusion of `@placeholder`, `@loading`, and `@error` blocks.
- **Route Lazy-Loading:** Routes must be lazy-loaded using `loadComponent` or `loadChildren`. Route URLs must align with
  `core/routing/registry-route.enum.ts`.
- **Core Web Vitals & Assets:**
  - LCP: Mandatory usage of `NgOptimizedImage` for image assets with `priority` on the critical image.
  - CLS: Explicit dimensions (`width`/`height` or aspect-ratio) on containers and asynchronous UI slots.
  - INP: Prevent blocking synchronous tasks in computed signals or template expressions.
- **Resource Cleanup:** Register teardown of DOM listeners, observers, and timers using `DestroyRef`.

---

## Output Format

- **Partial Score:** Start at 100, apply deductions (**blocker −40**, **should-fix −10**, **nit −2.5**), and output the
  resulting score (e.g., `Architecture & Performance: 90/100`).
- **Findings List:** Grouped by severity with precise locations (`file:line`), explanations, and exact fixes.
- **Technical Debt:** Untouched existing code issues reported informatively (no score deduction).
