---
mode: agent
description: Write or extend tests for the Registry frontend (Angular 22, NGXS)
---

# Write tests — Registry Frontend

Write or extend tests for the code I point you at, following this project's conventions.

## First: test setup

This project does **not** yet have a unit-test runner configured (`skipTests` is on in `angular.json`, there is no `test` script, and no `*.spec.ts` files exist). Before writing tests:

1. If a runner is already present when you look, use it.
2. Otherwise, set one up with the Angular CLI defaults — `ng add @angular/build` unit-test support (Vitest) or Karma+Jasmine — add the `test` script to `package.json`, and confirm `pnpm run test` runs. Ask me first if you're unsure which runner I want.

## Conventions to follow

- Place specs next to the unit under test: `foo.component.spec.ts`, `foo.state.spec.ts`.
- **4-space indent, single quotes, spaces inside brackets. No `any`. Explicit return types.** Lint must pass (`pnpm run lint`).
- **Components** — use `TestBed` with the standalone component in `imports`. Mock the facade/services it depends on; assert rendered output and that user interactions dispatch the right calls. Keep components thin, so most logic lives in state/services.
- **NGXS state** — test via `TestBed` + `provideStore([FeatureState])` and `Store`: dispatch an action, mock the injected service (HTTP) to return a controlled observable, then read the resulting `store.selectSnapshot(...)`. Cover success and error paths.
- **Services** — test HTTP with `provideHttpClientTesting()` / `HttpTestingController`; assert URL, method, body, and response mapping.
- Mock `@ngx-translate` where components render translated strings.

## Deliverable

- Cover happy path, empty/loading, and error states.
- Add cases to an existing spec when one exists; otherwise create it.
- Run the test command and `pnpm run lint`, and report results. Don't disable lint rules or weaken assertions to make things pass.
