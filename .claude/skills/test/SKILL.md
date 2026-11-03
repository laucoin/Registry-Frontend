---
name: test
description: Write, extend or fix tests for the Registry frontend (Angular, Vitest, signalStore). Use only when the user asks to add, write, complete or fix tests, or right before a commit when new code lacks coverage. Never write tests automatically after an edit.
---

# Write tests — Registry Frontend

Write or extend tests for the code pointed at, following these conventions.

## Stack

Vitest through `@angular/build:unit-test`, Angular `TestBed`, `@vitest/coverage-v8`. Run `pnpm test` (watch) or
`pnpm test:coverage` (single run, enforces the thresholds of `angular.json`); lint with `pnpm lint`.

## Conventions

- Place each spec next to the unit under test: `foo.store.spec.ts`. Match the repository indentation and style.
- **AAA pattern, strictly.** Every test contains exactly these comments, with no additional detail:

  ```typescript
  // Arrange
  // Act
  // Assert
  ```

- Methods ≤ 25 lines, specs included. Descriptive test names.
- **Stores** (`signalStore`): test through `TestBed`, mock the api, assert the state signals after each method; cover
  success and error paths (errors are swallowed inside `rxMethod`, so assert the reported error and that the method
  still works afterwards).
- **Facades and apis:** mock the store or `HttpTestingController` (`provideHttpClientTesting()`); assert URL, method,
  body and DTO → model mapping.
- **Components:** `TestBed` with the standalone component in `imports`, facades mocked; assert rendered output and that
  interactions call the facade. Mock `@jsverse/transloco` where translated strings are rendered.
- **Browser globals:** go through `BrowserService`, so mock it instead of touching `window` or `document`.
- Reuse the shared helpers and fixtures of `shared/helpers/testing/` (excluded from coverage).

## Deliverable

- Cover the happy path, empty/loading states, error branches and signal state transitions.
- Add cases to an existing spec when one exists.
- Run `pnpm test:coverage` and `pnpm lint` and report the result. Never weaken assertions or disable lint rules to pass;
  coverage thresholds only go up.
