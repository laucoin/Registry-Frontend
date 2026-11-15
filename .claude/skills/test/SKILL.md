---
name: test
description: Generates comprehensive, robust, and non-flaky frontend tests for Angular (>= 22) under Vitest (facades, signalStores, components via Component Harnesses, interceptors via HttpTestingController). The quality rules live in qa-review; this skill adds the generation procedure, the coverage thresholds (80% global minimum, 100% on conditional branches) and the parameterized-test policy.
---

# Test Writer (Frontend Test Generation under Vitest)

Generate robust, deterministic, and comprehensive tests for modern Angular (>= 22) frontend code.

## Source of truth

The quality rules are defined once, in `qa-review`. This skill does not repeat them: the tests it generates must satisfy
them, and a rule change is made there only.

| Topic                                                             | Rule in `qa-review` |
| ----------------------------------------------------------------- | ------------------- |
| Tested scope, Vitest-only APIs, Component Harnesses, HTTP mocking | §1                  |
| AAA structure, behavioral assertions, test integrity              | §2                  |
| The 4 UI states, forms and validation, edge values                | §3                  |
| `data-test-id` on interactive elements                            | §4                  |
| Guards and permission-based rendering (RBAC, negative tests)      | §5                  |
| No arbitrary timeouts, fake timers, test isolation                | §6                  |

## Rules specific to this skill

### 1. What to test, by target

- **Component:** drive it through its Component Harness, never through `querySelector`; cover the states and
  interactions of `qa-review` §3.
- **Facade & SignalStore (`@ngrx/signals`):** validate state signals, `computed` derivations and `rxMethod` routines.
  Facades expose clean signals, deduplicate redundant emissions and leak no unmanaged state.
- **API adapter & HTTP interceptor:** `provideHttpClient()` paired with `provideHttpClientTesting()`; assert the
  outgoing request (URL, method, headers, body) and simulate nominal and error responses with `req.flush()`.
- **Guard:** granted access vs. redirection or block, per `qa-review` §5.

### 2. Coverage thresholds

The thresholds below are the ones enforced by `angular.json`; `qa-review` §1 checks that they are met.

- **Global:** minimum **80%** on lines, functions and statements.
- **Branches:** **100%** of the conditional branches (`if`, `@if`, `switch`, `@switch`, ternaries, `??`, `?.`). Every
  alternative path has an explicit case.

### 3. Destructive actions

- Test the confirmation behavior required by `designer-review` §1 (confirmation dialog, and for a critical multi-scope
  action the confirm button `disabled` until the required keyword is typed identically).

### 4. Parameterized tests first

Duplicated test patterns and several scenarios folded into a single `it` are both forbidden. Favor parameterized tests.

- **One scenario, one case:** a test checks one behavior. Never chain several unrelated scenarios, or several
  inputs/outputs, in one `it` body.
- **Same pattern, different data:** when several tests share the same Arrange/Act/Assert and differ only by input and
  expected value (boundary values, invalid inputs, branches of a mapper or helper, roles, UI states, error codes), write
  **one** `it.each` (or `describe.each` when the case also changes the setup) instead of copying the test.
- **Readable cases:** a table of objects, each with a `name` that is interpolated in the title (`$name`), then the
  input and the expected value. The title states the behavior, not the index.
- **AAA preserved:** the `// Arrange`, `// Act` and `// Assert` markers stay in the parameterized body.
- **Limit:** do not parameterize when the setup or the assertions differ structurally between cases; write separate
  tests.

```ts
it.each([
	{ name: 'rejects an empty name', name_: '', valid: false },
	{ name: 'accepts a 1 character name', name_: 'a', valid: true },
])('$name', ({ name_, valid }) => {
	// Arrange
	const form = createForm({ name: name_ });

	// Act
	const result = form.valid();

	// Assert
	expect(result).toBe(valid);
});
```

## Output Format

When generating or refactoring test suites, structure the deliverable as follows:

1. **Test Strategy & Covered Scenarios:** concise description of tested paths (nominal flow, UI states, error handling,
   negative RBAC, boundary checks, mapping of the conditional branches), noting which ones are parameterized.
2. **Spec File Implementation (`.spec.ts`):** idiomatic modern TypeScript/Angular code that satisfies the `qa-review`
   rules.
3. **Invariant Checklist:** compliance with `qa-review` §1–§6, absence of duplicated test patterns, and 100% conditional
   branch coverage.
