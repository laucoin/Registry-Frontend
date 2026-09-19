---
mode: agent
description: Write or extend tests for the Registry frontend (SSR, Angular 22, Vitest)
---

# Write tests — Registry Frontend (SSR)

Write or extend tests for the code I point you at, following this project's conventions.

## Test setup (already configured — don't re-scaffold it)

The `test` architect target (`@angular/build:unit-test`, Vitest under the hood) is wired in `angular.json`, with `vitest` and `jsdom` as devDependencies and `"test": "ng test"` in `package.json`. Just run `pnpm test`.

## Conventions to follow

- Place specs next to the unit under test: `foo.component.spec.ts`, `foo.store.spec.ts`, `foo.api.spec.ts`.
- **2-space indent, single quotes, Prettier defaults. No `any`. Explicit return types and member accessibility.** Lint must pass (`pnpm run lint`).
- **Components** — use `TestBed` with the standalone component in `imports`. Mock the **facade** it depends on (never the store or the api directly — components should never see those either, in tests or in app code); assert rendered output and that user interactions call the right facade methods. Keep components thin, so most logic lives in the store.
- **Stores (`@ngrx/signals` `signalStore`)** — test via `TestBed` with the store provided (it's `{ providedIn: 'root' }`, so `TestBed.inject(FooStore)` works directly): call a method, mock the injected api to return a controlled observable, then read the resulting signal(s). Cover success and error paths — including that an error doesn't leave the store's `rxMethod` unusable for a *subsequent* call (a real bug class here: an uncaught error inside a `rxMethod` pipe permanently kills it).
- **Facades** — thin pass-through layer; a couple of tests confirming delegation to the store/api is enough, don't over-test them.
- **Apis** — test HTTP with `provideHttpClientTesting()` / `HttpTestingController`; assert URL, method, body, and response mapping.
- **SSR-sensitive code** (anything gated by `isPlatformBrowser`) — test both platforms: provide `PLATFORM_ID: 'server'` in one spec and assert the browser-only branch (`window`/`sessionStorage`/etc.) is never reached; provide `'browser'` in another and assert it is.
- Mock `@jsverse/transloco` (or provide `provideTransloco` with a minimal test loader) where components render translated strings.

## Deliverable

- Cover happy path, empty/loading, and error states.
- Add cases to an existing spec when one exists; otherwise create it.
- Run `pnpm test` and `pnpm lint`, and report results. Don't disable lint rules or weaken assertions to make things pass.
