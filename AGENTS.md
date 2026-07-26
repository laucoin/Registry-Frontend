# AGENTS.md — Registry Frontend

Vue 3 / Nuxt SSR frontend for the Registry platform — the rewrite replacing the Angular app. This file is the single
source of truth for agents working here — it applies to ALL AI agents (Claude Code, Copilot, Cursor, or any other
assistant) generating or modifying code in this repository, as permanent project policy rather than suggestions. The
governing specs live in the documentation repo; pointers below.

## Stack

- **Nuxt 4** (SSR), **Vue 3.5**, **TypeScript** (strict, no `any`).
- **Ant Design Vue 4** (**pinned exact version** — we import its internal
  `es/_util/cssinjs` path for SSR style extraction).
- **Pinia** stores, consumed **directly** by components (no facade layer).
- **@nuxtjs/i18n** (fr/en, `no_prefix`).
- **openid-client** on the server only — Nuxt is the OIDC client/BFF.
- **pnpm**, **@nuxt/eslint** (tab indent, single quotes, 1tbs braces — mirrors the IntelliJ formatter; see
  `eslint.config.mjs`), **vitest** + axe.

## Commands

```bash
pnpm dev / build / start   # start = run the production build (.output)
pnpm lint                  # always run before finishing
pnpm test                  # vitest, includes the axe a11y gate
```

Local deps: Authentik :9000 (application `registry`, client `registry`), Spring backend :8081. Secrets in `.env` (see
`.env.example`).

## Architecture map (reference instances — replicate these patterns)

| Concern                                                             | Where                                                                             |
|---------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| Runtime config (boot-validated JSON + env)                          | `server/plugins/00.app-config.ts`, `shared/utils/registry-config.ts`              |
| BFF auth: login/callback/logout, sealed two-cookie session, refresh | `server/routes/auth/*`, `server/utils/{session,oidc}.ts`                          |
| API proxy (cookie → Bearer, CSRF, version-agnostic)                 | `server/routes/api/[...path].ts`                                                  |
| CSP + security headers (strict scripts, pragmatic styles — final)   | `server/plugins/security.ts`                                                      |
| AntD SSR style extraction (no FOUC)                                 | `app/plugins/antd-ssr.ts`                                                         |
| Theme: brand seed tokens + dark override + SYSTEM/LIGHT/DARK        | `app/composables/useRegistryTheme.ts`, `app/plugins/theme-hint.client.ts`         |
| Brand assets: defaults + config override                            | `app/composables/useRegistryAssets.ts`, `public/brand/defaults/`                  |
| Pinia stores (direct use; setters vs orchestrators)                 | `app/stores/{session,preferences}.ts`                                             |
| Reset cascade (project-scoped stores)                               | `app/stores/reset-cascade.ts`                                                     |
| Observability seam (web-vitals + errors → BFF)                      | `app/plugins/telemetry.client.ts`, `server/routes/telemetry.post.ts`              |
| Cross-tier correlation id (browser → BFF → Spring)                  | `server/utils/correlation.ts`, `server/routes/api/[...path].ts`                   |
| Shell a11y (skip link, landmarks, focus on route change)            | `app/layouts/default.vue`                                                         |
| Responsive shell (mobile-first, 320px clamp, hamburger nav)         | `app/assets/css/responsive.css`, `app/components/shell/{AppHeader,HeaderNav}.vue` |
| Keyed SSR data fetching via the proxy                               | `app/pages/account.vue`                                                           |

## Rules — treat as review checklist

- **State**: components use stores **directly** —
  `storeToRefs` for state/getters, actions called on the store. All side effects (HTTP, cookies, navigation, i18n) live
  in **store actions**, never in components. Keep the two action kinds separate: `set*` = pure state setters (safe for
  SSR hydration, no side effects); `update*`/verbs = user-action orchestrators (persist + side effects). Store state
  uses the **factory form** (`state: () => ({})`) — a shared object would leak across SSR requests. Feature stores (B2)
  are code-split with their route and register in `reset-cascade.ts` when project-scoped.
- **Auth/session**: all session reads on the server go through
  `peekSession()` — anonymous visitors must never receive a session cookie. Any new sealed-cookie write must call
  `assertCookieSizes()` (the 4 KB ceiling is a hard error; see SPIKE-FINDINGS in `Registry-Spike/`).
  `peekSession()` also enforces the **two-tier lifetime**: an absolute cap (`session.maxAge`, from
  `createdAt`) and a sliding idle-timeout (`session.idleMaxAge`, from `lastActivity`, touched throttled on activity).
  The pure check is `isSessionExpired()` (unit-tested).
- **Security**: never widen the CSP (`style-src 'unsafe-inline'` is the deliberate, spike-verified exception; scripts
  stay nonce-strict). All state-changing calls through the proxy need the `x-csrf-token` header —
  `useSessionStore().csrf`.
- **API**: the browser only ever calls the Nuxt origin (`/api/**` proxy). Never call Spring directly; never put tokens
  in client code. New pages fetch with `useFetch(..., { key })` for dedup. Domain work (B2) targets **API v2**
  once stable — v1 usage is limited to the auth/current-user endpoint.
- **i18n**: every user-facing string goes through `$t()` with keys in
  `i18n/locales/{fr,en}.json` — no hardcoded text.
- **♿ Accessibility (WCAG 2.2 AA)**: semantic HTML first; labels or
  `aria-label` on every control (AntD `Select` needs an explicit
  `aria-label`); decorative images `alt="" aria-hidden`; keyboard operability and visible focus everywhere;
  `role="alert"`/live regions for async errors; AA contrast in **both** modes (per-mode token overrides exist for this).
  Every new component gets an axe assertion in its test (see
  `tests/components/skip-link.test.ts`).
- **📱 Responsive (mobile-first, down to 320px)**: the layout must stay usable and free of **horizontal** overflow from
  320px up (below 320 it scrolls; the shell is `min-width: 320px`). Global rules live in `app/assets/css/responsive.css`
  (the only global stylesheet — it targets AntD's portal nodes that scoped styles can't reach: full-width drawers and
  stacked list rows on small screens). The header collapses into a hamburger + menu `Drawer` below 768px; the
  nav/controls live in `HeaderNav.vue`, rendered twice (desktop bar + drawer) — **only the desktop instance carries
  `data-testid`s** (`:hooks`
  gates them) so hooks stay unique. New pages/components must not introduce fixed widths that overflow 320px; long
  unbreakable strings wrap (`overflow-wrap`). The `responsive.spec.ts` E2E asserts no horizontal overflow at a 320px
  viewport on the key surfaces — add pages there.
- **Theme/brand**: never hardcode brand colors or asset paths in components — tokens come from `useRegistryTheme`,
  assets from `useRegistryAssets`.
- **Config**: new public config fields go into the zod schema in
  `shared/utils/registry-config.ts` (strict — unknown keys fail the boot validation) and into `config/config.json`
  placeholders.
- **Server code**: dev-only behaviour gates on `import.meta.dev`; secrets only via `runtimeConfig` (server scope), never
  `runtimeConfig.public`.
- **Test hooks (`data-testid`)**: every **interactive** element (link, button, native/AntD input · select · textarea ·
  radio, date picker, menu item, row action trigger) carries a stable `data-testid`. It is a contract with the E2E
  suite — resilient to i18n/text/layout — so tests select by
  `page.getByTestId(...)`, never brittle text/CSS. **Naming** is kebab-case
  `<scope>-<element>[-<qualifier>]`:
    - shell — `nav-{home|projects|users|account}`, `header-{brand|user|logout|login}`,
      `theme-select`, `language-select`, `skip-link`;
    - global pages — `<page>-<element>` (`projects-create`, `home-create-first-project`, `users-search`);
    - project shell — `project-tab-<domain>`, `project-breadcrumb`;
    - project domains (prefix = singular key ∈ participant · group · movement · vehicle · activity · communication ·
      alert): toolbar `<domain>-create`; list chrome `<domain>-{list|search|refresh}`; each row `<domain>-row`; row menu
      `<domain>-row-actions` and items `<domain>-action-<verb>`
      (disable/enable/delete/resolve/cancel/reopen); create-form fields
      `<domain>-form-<field>` (…-type, -datetime, -submit, -cancel, …).
    - Generic `DomainList`/`DomainRowActions` take a `testid` prop (the domain prefix) and apply the chrome/menu ids
      from it. Address a specific dynamic row by appending its entity id (`movement-content-<participantId>-vehicle`)
      or, for list rows, filter by text — don't invent per-id list testids.
    - `data-testid` falls through most AntD components (Button · Select · Input · Textarea · RadioGroup · Switch · Tag ·
      NuxtLink) to their root DOM node. **Exception — `DatePicker` (and `TimePicker`) silently DROP `data-testid`**:
      put the id on the field's wrapping `<div>` instead (tests then
      `getByTestId(id).locator('input')`). **`Drawer` drops it too** — put the id on the drawer's inner content wrapper
      (see `CommunicationThread.vue`). For
      `Tabs`, the id goes on the `#tab` slot span, not the `TabPane`. Treat ids as an API: **stable**, renamed only with
      the tests.

## Comment policy — strict, applies to all generated and edited code

Only three kinds of comment may exist in this repository. Everything else is removed on sight.

1. **Test structure markers** — `// Arrange`, `// Act`, `// Assert` (including combined forms such as `// Act + Assert`)
   must never be deleted, reworded or moved.
2. **One JSDoc block (`/** … */`) directly above a genuinely complex function, composable or method**, explaining its
   intent, its high-level logic or a constraint the code cannot express (a backend rule, an a11y requirement, an AntD or
   browser quirk). A component `<script setup>` preamble or a store gets one only when the complexity is *global* to it
   — never as a summary of its members. Never use a `//` block for documentation.
3. **Functional directives** (`eslint-disable*`, `@ts-expect-error`, triple-slash references, coverage-ignore markers) —
   not comments under this policy; keep them where the tooling needs them.

Forbidden, without exception:

- Inline explanations and end-of-line comments inside a function body — the test markers above are the only in-body
  comments allowed anywhere.
- Step-by-step narration of what the next lines do, section dividers, commented-out code.
- Any comment that restates a name, a signature, a type or an obvious `ref` / `computed`.
- Comments on props, plain constants, interfaces and type aliases that carry no logic.
- In `<template>`, an `<!-- … -->` comment unless the markup directly below it encodes a real constraint (a framework
  bug workaround, an a11y requirement) — never as a label or narration. In `<style>` / `design.css`, a `/* … */`
  comment only directly above a rule whose intent cannot be read from the selector and the declarations.
- **References to an ADR or to any decision-record number.** Rationale worth keeping is stated in the code's own terms;
  the ADR set lives in the Documentations repository and is never cited from source.
- Obvious, self-explanatory declarations get no comment at all.

### Rule for future code generation (binding)

When generating, refactoring or reviewing ANY code in this repository — as Claude Code, Copilot, Cursor or any other
assistant:

1. The default for any line of code is NO comment.
2. Strictly preserve `// Arrange`, `// Act`, `// Assert` wherever they appear; never delete, reword or move them.
3. Document only genuinely complex functions, with a single JSDoc block directly above the declaration.
4. Never write an ADR reference into a comment.
5. When you touch a file, bring the comments in the code you touched up to this standard.

## Workflow

The migration plan's **working agreement** applies: implement each *new*
pattern once as a reference instance and present it for validation before replicating it. B2 domain slices follow the
map above.

## Reported bugs — check the documentation before fixing

When the user reports a bug, or disputes behaviour a test asserts, treat the documentation as part of the investigation
rather than as background reading.

1. **Find what the docs claim** about the behaviour — the feature page, the roles/permissions matrix, the API reference,
   and the journey scenarios in `critical-scenarios.md`.
2. **Decide which side is wrong.** The reported behaviour, the code, and the docs are three independent claims; a
   disagreement between them is itself the finding. Where a page names an authoritative source (for example,
   roles-and-permissions.md defers to the seed migrations for the permission matrix), that source wins over the prose.
3. **Fix the documentation in the same change as the code.** A bug fix that leaves the docs asserting the old, wrong
   behaviour just moves the defect. If the docs were right and the code was wrong, say so explicitly in the change; if
   the docs were wrong, correct them and keep the scenario list in step.
4. **Never silently loosen a test to match observed behaviour.** Establish which behaviour is correct first, then align
   the test with that — citing the authority you relied on.
5. **Report contradictions you cannot resolve** instead of picking a side; they usually mean a decision is owed.
