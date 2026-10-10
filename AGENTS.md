# AGENTS.md - Development Guidelines for Angular CSR Project

This document outlines the strict guidelines, architecture rules, and conventions for AI agents and developers working
on this Angular Client-Side Rendering (CSR) project.

---

## 1. Language & Communication

- **User Interaction:** All direct communication, questions, and validations with the user **must** be conducted in
  **French**.
- **Code & Comments:** All source code, variable names, functions, and inline comments **must** be written in **US
  English**.

---

## 2. Tech Stack

- **Framework:** Angular (latest version configured for **Client-Side Rendering - CSR**).
- **Reactivity & State:** Strictly use **Angular Signals** (including `@ngrx/signals` `signalStore`, reactive forms with
  signals, `input()`, `output()`, etc.). Avoid legacy reactive patterns where modern signals are applicable.
- **Design System:** `@sgdf/ui` (Web Awesome based web components) is the target. PrimeNG is the transitional design
  system until the migration; do not introduce new PrimeNG-specific abstractions beyond what the current code needs.
- **Styling:** Tailwind CSS v4 utility classes in templates (default breakpoints), native CSS for the remaining
  component styles. Bootstrap is not used. Beware the spacing scale: Tailwind steps are `n × 0.25rem`.
- **`@sgdf/ui` first:** before building any UI, check what `@sgdf/ui` already provides (`custom-elements.json` and the
  `.d.ts` of `node_modules/@sgdf/ui`): a component for the need (e.g. `sgdf-callout` for a message or an error) and its
  `variant`, `appearance`, slots and CSS properties for the look. Tailwind is for layout and spacing only: never use it
  to recolor an `@sgdf/ui` component or to rebuild one (no `--sgdf-*` tokens in utility classes for colors). If what is
  needed is not possible with `@sgdf/ui`, do not work around it: suggest a change to `@sgdf/ui` when it makes sense
  architecturally, and fall back to a custom implementation only if the developer declines or it is not relevant.

---

## 3. Architecture & Project Structure

The source code is organized into three core directories:

1. **`core/`**: Contains essential application-wide elements. Without this folder, the application cannot run (e.g.,
   configuration, authentication, global theme abstraction).
2. **`pages/`**: Contains all page components, organized strictly by their routing path.
    - _Example:_ `/projects/{id}/movements` must be located in `pages/projects/[:id]/movements/`.
3. **`shared/`**: A structured directory for items that do not belong to `core` or `pages`. It must remain clean and
   organized into subfolders:
    - `directives/`
    - `helpers/`
    - `mappers/`
    - `models/`
    - `ui/`

### Data Flow: api → store → facade

- `<domain>.api.ts` — HTTP calls only, no state.
- `<domain>.store.ts` — an `@ngrx/signals` **`signalStore`** (`withState` + `withMethods`; `patchState` only inside it).
  No NGXS, no hand-rolled `BehaviorSubject` state, no `ComponentStore`.
- `<domain>.facade.ts` — the domain's **sole public entry point**. Components, guards, and interceptors inject only the
  facade, never the store or api directly. The facade exposes state as `Signal`s straight off the store and forwards
  method calls. The facade may call the api directly instead of the store when there's nothing to persist/share (e.g. a
  redirect-only call) — only work whose result must be persisted in state and shared across components belongs in the
  store.
- **Documented exception:** `shared/ui/domain/` holds the cards and forms of the business entities. They read their
  domain facades and models from `pages/`, which is the only accepted `shared` to `pages` dependency (the 29 existing
  imports). They are reworked with the `@sgdf/ui` migration; do not add new `shared` to `pages` imports elsewhere.
- **Core facades:** `UiFacade` exposes what the shell displays (theme, screen, toasts, global loader and error),
  `SessionFacade` owns the signed-in user and the session (sign-in and sign-out, current user, selected project, theme
  and language preferences, and the choices offered for them), and `UserProfileFacade` owns the user's own project
  profiles and invitations and the commands acting on them. `UserProfileFacade` depends on `SessionFacade`, never the
  other way around. Components, guards and interceptors read the choices and menus to display from a facade or
  service, and leave redundant-call filtering to the facade. Stores never depend on a facade: they report failures
  through `ErrorReporter` (`core/registry/state/error-reporter.ts`).
- **Store methods:** build the repetitive rxMethods with the builders of `shared/helpers/store/paged-store.methods.ts`
  (`pageFetcher`, `paramsUpdater`, `paramsMerger`, `elementFetcher`, `metadataFetcher`, `movementContentsFetcher`)
  and inject dependencies as parameters of `withMethods`, never through a public `withProps`.
- **Placement:** app-wide cross-cutting domains (auth, config, i18n, theme) live in `core/<domain>/`. A domain scoped to
  one routed page's own data lives colocated inside that page's folder under `pages/<page>/`. Reusable presentational
  components with no api/store/facade of their own live in `shared/`.
- Core domain stores are app-wide singletons (`{ providedIn: 'root' }`), not scoped per route by default — evaluate
  route-scoping deliberately if a domain's state must reset on navigation, and raise it with the user first rather than
  defaulting into it.

---

## 4. Abstraction & Environment Configuration

- **Environment Agnostic (CSR):** Configuration must be fetched dynamically at runtime via a static JSON asset file
  (`public/settings/config.json` and `public/settings/env.json`) using `provideAppInitializer()`. Environment-specific parameters **must never** be
  hardcoded or statically compiled into the source code bundle.
- **Backend Abstraction:** Always decouple API responses from domain models. Implement strict DTO-to-Model mappers
  (`DTO -> model`), even if the structures are identical. Response DTOs live in `shared/models/dto/response/`
  (`<name>.response.dto.ts`), mappers in `shared/mappers/` (`<Name>Mapper.toModel`), and every `*.api.ts` pipes its
  response through them. Metadata lists of `SelectItem` and request DTOs are the only responses not mapped.
- **Browser access:** `window`, `document`, `location` and `navigator` are reached only through `BrowserService`
  (`core/browser/browser.service.ts`); storage goes through the storage helpers.

---

## 5. Coding Standards, Quality & Best Practices

- **Formatting & Linting:** Strictly adhere to project linting rules (`ESLint`, Prettier, etc.).
- **Code Quality:** Pay special attention to:
    - **Accessibility (a11y):** Semantic HTML, ARIA attributes, keyboard navigation.
    - **Performance:** CSR optimization, aggressive route lazy loading, minimal initial bundle size, change detection
      efficiency with signals (`OnPush` by default where applicable).
    - **Readability & Maintainability:** Clean code principles, descriptive naming conventions.
    - **Best Practices:** Single Page Application routing, Title & Meta management via Angular `Title`/`Meta` services,
      robust error handling.
    - **Loading State:** Never a single global loading flag. Loading state must be scoped to the specific piece of data
      being fetched (e.g. a signal per resource/section), so the rest of the UI stays interactive and correctly reflects
      what is actually in flight.
    - **Error Handling:** The default strategy is to display a user-friendly frontend message enriched with the
      backend's error message. A feature may instead use log-only (silent to the user, failed widget hidden on the UI),
      but only when this has been **defined with the developer** before implementation.
    - **No Dead Code:** Remove unused code, methods, imports, and variables rather than leaving them in place "just in
      case."
    - **Method Size:** Methods should be **25 lines or fewer**. Split larger methods into smaller, well-named ones.
    - **Naming:** Variable and method names must be explicit and self-descriptive. **Exception — RxJS operator
      callbacks:** inside a reactive (`rxMethod`/pipe) operator's own callback, a **single** parameter may be named with
      just one or two letters (e.g. `it`) instead of a full descriptive name; this exception applies only there and only
      when the callback has no more than one parameter.
    - **RxJS Readability:** In reactive (`rxMethod`/pipe) flows, factor operators and intermediate steps into small,
      well-named private methods so the overall flow stays easy to read at a glance rather than one long chained pipe.
      Ideally, each operator call fits on a **single line**; if an operator's logic needs to spread onto a second line,
      extract it into its own well-named method instead. Exceptions may be granted but **must be defined with the
      developer** case by case, not assumed.

---

## 6. Multi-Agent Review Process (Mandatory Gate)

Before any code modification or new feature is finalized or committed, it **must pass a mandatory multi-agent review**
conducted by 4 distinct virtual agent perspectives.

Each reviewing agent must evaluate the proposed changes, provide feedback if needed, and assign a **formal rating out of
10** for their specific category:

1. **Architecture Agent (`/10`):**
    - Verifies strict adherence to directory layout (`core/`, `pages/`, `shared/`).
    - Ensures strict data flow enforcement (`api` → `store` → `facade`). Components must only talk to facades.
    - Validates that CSR runtime configuration is properly decoupled and not baked into build artifacts.

2. **TechLead Agent (`/10`):**
    - Enforces clean code rules, method size limits (<= 25 lines), and explicit naming conventions.
    - Validates RxJS readability, operator inline abstraction, error swallowing in `rxMethod` pipes (`catchError`), and
      signal usage.
    - Checks bundle budget compliance, absence of dead code, and adherence to security / non-negotiable invariants.

3. **Testeur / QA Agent (`/10`):**
    - Ensures all public methods and facades have associated unit tests (using Jest or Vitest).
    - Validates strict compliance with the **AAA pattern** and required section comments (`// Arrange`, `// Act`,
      `// Assert`).
    - Verifies test coverage for edge cases, error handling branches, and signal state transitions.

4. **UI/UX & Accessibility (a11y) Designer Agent (`/10`):**
    - Checks semantic HTML structure, keyboard navigation, ARIA roles, and accessibility standards.
    - Ensures visual consistency through `shared/ui/` components and global theme application.
    - Validates that user loading states are scoped per widget/section rather than global full-page blocking overlays.
    - Verifies user error message formatting and clarity.

*Review Gate Validation Criteria:*

- A minimum score of **8/10** is required for every individual category.
- If any score falls below **8/10**, the review is rejected and required refactorings must be completed before
  re-evaluation.
- Development is complete only when all 4 agents deliver their rating and give explicit approval.

---

## 7. Testing Guidelines

- **Framework:** Jest or Vitest.
- **Coverage:** `pnpm test:coverage` measures the whole `src/app` and enforces the thresholds of `angular.json`.
  Thresholds only go up: raise them whenever the measured coverage rises.
- **Fixtures:** shared test data and helpers live in `shared/helpers/testing/` and are excluded from coverage.
- **Method size:** the 25-line rule applies to specs as well.
- **Pattern:** Strictly use the **AAA pattern** (`// Arrange`, `// Act`, `// Assert`).
- **Comments:** Every test must explicitly include these exact section comments with **no additional detail**:
  ```typescript
  // Arrange
  // ...

  // Act
  // ...

  // Assert
  // ...
  ```

## 8. Documentation (doc.laucoin.fr)

- Reference: https://doc.laucoin.fr/registry
- Rule: The agent must always ask the user if documentation updates are relevant for any given feature or change, and
  where the documentation is located before attempting any updates.
- Conflict/Missing: If a user request, or a specification fetched from the documentation hub during spec-driven
  development, would require violating a rule in this document, stop before implementing it. Do not silently comply with
  the request, and do not silently ignore the spec. Propose one of two paths to the user: update this document to
  reflect the new rule, or adjust the request/spec to fit the existing rule. Proceed only once the user has picked one.

## 9. Comments Policy

- No Superfluous Comments: Keep comments synthetic, modern, and state-of-the-art.
- Prohibitions: Do not write comments about migrations, past states, or changelogs.
- Future Actions: Any comment referring to future tasks or technical debt must be explicitly marked as // TODO:.
- Permission Required: The agent must always ask the user for permission before adding any comment to the code.
- Pre-approved exception — file-level header: For every class, interface, or other non-trivial unit that is not
  passive/self-evident by nature (i.e. anything outside models/, dtos, and mappers/), add a JSDoc block directly above
  its declaration, with exactly these three lines and no others:

```typescript
/**
 * Purpose: <what it does, one to two sentences, no per-method detail>
 * Scope: <what it owns / is responsible for>
 * Limits: <what it deliberately does not do, or its known boundaries>
 */
```

This exception is standing and does not require asking the user each time — every other comment still does.

## 10. Git & Version Control

- Commits: The agent is authorized to make commits.
- Pushing Prohibited: The agent must never perform a git push.
- Commit Breakdown: Commit scopes must be strictly planned and agreed upon with the user before development begins,
  breaking work down into the smallest functionally testable increments.
- Work-in-progress gate: If a feature already implemented locally covers a complete testable functional scope but hasn't
  been committed, the agent refuses to start any new, unrelated feature. Only fixes, review feedback, or adjustments to
  that pending feature are allowed until it is committed. Local commits on the current branch are enough: the developer
  decides when to push and open the PR, and may ask the agent to keep working on the same branch meanwhile.

## 11. Non-Negotiable Technical Invariants

- The frontend enforces nothing. Guards and permission-driven UI exist for usability only — the backend re-checks every
  condition on every request. Never treat a guard or a hidden control as a security boundary.
- Pure Client-Side Execution (CSR): Direct access to window, document, localStorage, and sessionStorage is permitted in
  browser contexts, but must remain encapsulated within services or guarded helpers to allow clean unit testing.
- rxMethod pipes must swallow their own errors (catchError inside, before the error reaches the pipe's outer subject) —
  an uncaught error permanently kills that method for every later call, not just the failing one.
- One HTTP interceptor owns everything that touches the backend: CSRF header + withCredentials, one-shot
  refresh-and-replay on 401, mapping 0/502/503 to a generic unavailable error, redirect to /login on an unrecoverable
  `401`. The token-refresh endpoint is explicitly excluded from the refresh-and-retry branch to avoid a self-referential
  deadlock — don't simplify that exclusion away, don't scatter interceptor logic into services.
- No environment value is compiled into the bundle. Runtime config is loaded from public/settings/config.json and
  public/settings/env.json via provideAppInitializer() prior to application bootstrap.
- Theming: `@sgdf/ui` owns the theme. The mode (`light`, `dark`, or no attribute for the system) is set on `<html>` as the `data-theme`
  attribute, always via `BrowserService`; the `@sgdf/ui` entry point is never imported for it (it would pull the whole library). The SGDF tokens (`--sgdf-*`) belong to `@sgdf/ui`:
  no theme key is added to `config.json`. PrimeNG ships without theme (`theme: 'none'`) until it is removed. Raise any
  change to this mechanism with the user rather than working around it silently.
- The production build enforces bundle budgets — an initial bundle past 1 MB or a component stylesheet past 8 kB is a
  hard failure, not a nuisance.
- Static Web Serving (CSR): Production output is hosted as pure static assets (e.g. NGINX / Caddy). Ensure web server
  fallback rules (URL rewriting to index.html) are configured for HTML5 client-side routing.
- Hardening headers (including a CSP) are set in `nginx.conf`. The CSP must stay as strict as the app allows: no
  `unsafe-eval`, and any loosening must be justified and agreed with the user first. `@sgdf/ui` needs none: its fonts
  and icons are served from the application origin.
- semantic-release drives versioning/changelog/tags from Conventional Commits — a non-conventional commit message
  produces a wrong or missing release.
- Pagination is lazy-loading based, not page-numbered. Lists fetch and append the next batch as the user
  scrolls/triggers loading more; there is no real page 1/2/3 concept (no page-number query params, no page-index UI).
  Don't design or implement list pagination around discrete page numbers.
