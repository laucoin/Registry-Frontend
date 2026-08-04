---
mode: agent
description: Write or extend tests for the Registry frontend (Nuxt 4, Pinia, Vitest)
---

# Write tests — Registry Frontend

Write or extend tests for the code I point you at, following this project's conventions.

## Test setup (already in place)

**Vitest** with `happy-dom`, `@vue/test-utils`, and `axe-core`. Run with `pnpm test`. Tests live under `tests/`, grouped
by kind and picked up via `tests/**/*.test.ts`:

- `tests/stores/` — Pinia stores (reference: `tests/stores/preferences.test.ts`)
- `tests/server/` — server utils / BFF logic (reference: `tests/server/session.test.ts`)
- `tests/components/` — components, each with an axe gate (reference: `tests/components/skip-link.test.ts`)

## Conventions to follow

- **4-space indent, single quotes, spaces inside brackets. No `any`. Explicit return types.** Lint must pass
  (`pnpm lint`).
- **Stores (ADR 014)** — `setActivePinia(createPinia())` in a `beforeEach` for a fresh store per test; exercise the
  store through its public API (actions in, state/getters out). Keep the two action kinds in mind: `set*` actions are
  pure setters; `update*`/verb actions orchestrate side effects — mock those side effects (HTTP, cookies, navigation)
  and assert both the state change and the call.
- **Components** — `mount` from `@vue/test-utils` (use `attachTo: document.body` when asserting focus/anchors). Assert
  rendered semantics and user interactions. **Every component test includes an axe assertion** (ADR 015):
  `const results = await axe.run(wrapper.element as HTMLElement)` then expect the mapped `violations` list to equal
  `[]`. Unmount when attached to the body.
- **Server code (BFF)** — test the pure logic directly (e.g. `isSessionExpired()`); mock H3 event/cookie plumbing rather
  than spinning up Nitro. Cover the security invariants: no session cookie for anonymous visitors, cookie-size ceiling,
  two-tier session lifetime.
- **i18n** — where components render translated strings, stub `$t` (or mock `@nuxtjs/i18n`) rather than asserting on
  hardcoded text.
- **Comments (strict policy — see AGENTS.md)** — no narrative or inline comments in test code. The only permitted
  in-body comments are the structure markers `// Arrange`, `// Act`, `// Assert` — **never delete or modify these**
  where they exist. Non-obvious setup rationale goes in an English block comment directly above the test or `describe`,
  nowhere else.

## Deliverable

- Cover happy path, empty/loading, and error states.
- Add cases to an existing spec when one exists; otherwise create it in the matching `tests/` subfolder.
- Run `pnpm test` and `pnpm lint`, and report results. Don't disable lint rules, skip the axe gate, or weaken assertions
  to make things pass.
