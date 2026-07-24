# AGENTS.md — Registry Frontend

Angular SPA for the Registry platform. This file is the single source of truth for agents working here.

## Stack

- **Angular 22** (standalone components, no NgModules), **TypeScript 6**.
- **PrimeNG 22** + `@primeuix/themes` + Bootstrap 5 for UI.
- **NGXS 22** for state management.
- **@ngx-translate** for i18n.
- **pnpm** (`pnpm@11`), **ESLint** (angular-eslint).
- Served behind **nginx** in production; runtime config from `public/settings/*.json`.

## Commands

```bash
pnpm install
pnpm start        # ng serve — dev server (needs backend running)
pnpm run build    # ng build (add --configuration=production for prod)
pnpm run lint     # ng lint (eslint)
```

## Architecture

Root: `src/app`

- `domains/<domain>/` — feature areas (`user`, `project`). Each holds feature components (`users-list`, `user-form`, …) and a `data/` folder with **NGXS state** (`data/state/*.state.ts`, `*.service.ts`, `*.action.ts`, `*.facade.ts`) and view models (`data/model/*.model.ts`). Routing via `<domain>.routes.ts` + `<domain>-routes.enum.ts`.
- `shell/` — app frame: `navbar`, `auth-callback`, shared shell `data`.
- `shared/util-*/` — cross-cutting: `util-ui` (reusable components), `util-model`, `util-common`, `util-tool`, `util-config`, `util-authentication`.

**State flow (NGXS):** component → **facade** → dispatch **action** → **state** handles it → calls **service** (HTTP). Keep components thin; put logic in state/services. Never mutate state outside NGXS handlers.

---

## ♿ Accessibility — non-negotiable, check every UI change

- **Semantic HTML first**: real `<button>`, `<a>`, `<nav>`, `<main>`, headings in order. Don't put click handlers on `<div>`/`<span>`.
- **Keyboard**: everything usable without a mouse — logical tab order, visible focus states, Enter/Space activation, Esc to close overlays. Never remove focus outlines without an equivalent replacement.
- **Labels & ARIA**: every form control has a `<label>` (or `aria-label`); icon-only buttons get an accessible name; use `aria-*` and roles only when semantics can't be expressed with HTML. Use PrimeNG's built-in a11y props (`ariaLabel`, etc.) rather than reinventing.
- **Announce state**: loading/errors/toasts reach assistive tech (`aria-live`, PrimeNG message/toast components).
- **Contrast & motion**: meet WCAG AA contrast in both themes; respect `prefers-reduced-motion`.
- **Images/icons**: meaningful ones have `alt`/labels; decorative ones are hidden from AT.

## ✨ UX / UI

- **Consistency**: reuse `shared/util-ui` components and PrimeNG patterns instead of one-off UI. New reusable UI belongs in `shared/util-ui`.
- **Feedback for every action**: loading indicators, disabled states during in-flight requests, success/error toasts, empty states — no dead clicks or silent failures.
- **Form UX**: inline validation with clear messages, sensible defaults, don't block submit without saying why, preserve user input on error.
- **i18n**: all user-facing text goes through `@ngx-translate` (never hardcoded); keep translation keys organized and account for text length variance across locales.
- **Responsive**: layouts work across breakpoints (Bootstrap grid / PrimeNG responsive utilities).
- Match existing look, spacing, and interaction patterns — the app should feel like one product.

## ⚡ Performance

- **Lazy-load routes/features** (`loadComponent`/`loadChildren`) so domains ship as separate chunks; keep the initial bundle lean. Watch `pnpm run build` output for chunk-size regressions.
- **Change detection**: prefer `OnPush`, use the **async pipe** over manual `subscribe`, and lean on signals where they fit. Avoid heavy work in templates/getters called on every CD cycle.
- **Unsubscribe**: use `takeUntilDestroyed()` or the async pipe — no leaking subscriptions; never nest subscribes.
- **Rendering**: `@for` with `track`, virtual scrolling / server-side pagination for large lists (don't render thousands of rows). Debounce search/filter inputs.
- **Assets & data**: optimize images, avoid over-fetching, cache in NGXS state rather than refetching on every navigation.

---

## Conventions

- **4-space indent**, single quotes, spaces inside array/object brackets (`[ 'x' ]`) — match `eslint.config.js`.
- **No `any`** (`@typescript-eslint/no-explicit-any` is an error). **Explicit return types** on functions (error). Always run `pnpm run lint` before finishing.
- Standalone components; feature-first layout; dependencies declared in `imports`.
- Use `pnpm` (not npm/yarn).

## Testing

See `.github/prompts/test.prompt.md`. Note: unit tests are **not yet configured** (`skipTests` is on, no runner/`test` script). The prompt covers adding a runner and the component/state test patterns to follow — including accessibility assertions (roles, labels) for UI.

## Reusable prompts

- [`.github/prompts/test.prompt.md`](.github/prompts/test.prompt.md) — write/extend tests.
- [`.github/prompts/code-review.prompt.md`](.github/prompts/code-review.prompt.md) — review a change.
