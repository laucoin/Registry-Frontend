---
name: test
description: Generates comprehensive, robust, and non-flaky frontend tests for Angular (>= 22) under Vitest (facades, signalStores, components via Component Harnesses, interceptors via HttpTestingController), enforcing the AAA pattern, RBAC/permission isolation, full 4-state UI coverage, and coverage thresholds (80% global minimum, 100% on conditional branches).
---

# Test Writer (Frontend Test Generation under Vitest)

Generate robust, deterministic, and comprehensive tests for modern Angular (>= 22) frontend code, strictly adhering to
quality invariants and testing standards (minimum 80% overall coverage with 100% branch coverage, RBAC role/permission
isolation, AAA pattern, 4-state UI handling, Component Harnesses, and zero flakiness under Vitest).

## Core Guiding Principles for Writing

### 1. Typology & Target Technical Stack (Vitest & Angular >= 22)

* **Component Tests (UI & Interaction):**
    * Systematic use of **Component Harnesses** (Angular CDK harnesses or custom harnesses) to interact with the DOM and
      validate rendering decoupled from internal template selectors (`fixture.nativeElement.querySelector`).
    * Verify interactive behavior (clicks, typing, selections) through asynchronous Harness APIs.
* **Facade & SignalStore Tests (`@ngrx/signals`):**
    * Direct unit validation of reactive state signals, computed derivations (`computed`), and asynchronous routines
      (`rxMethod`).
    * Verify data stream purity: facades must expose clean signals, deduplicate redundant emissions, and coordinate
      domain operations without unmanaged state leaks.
* **API Adapters & HTTP Interceptor Tests:**
    * Systematic setup using `provideHttpClient()` paired with `provideHttpClientTesting()` and `HttpTestingController`.
    * Validate outgoing HTTP requests (URL, HTTP method, headers, request body) and simulate nominal/error responses
      (`req.flush()`).
* **Vitest Test Runner:**
    * Exclusive use of **Vitest** APIs (`describe`, `it`, `expect`, `vi`).
    * Zero legacy Jest (`jest.fn()`) or Jasmine (`spyOn`, `jasmine.createSpyObj`) imports.
* **Coverage Gates:**
    * **Global Coverage:** Minimum strict **80% threshold** on lines, functions, and statements.
    * **Branch Coverage:** **100% mandatory coverage** across all conditional branches (`if`, `@if`, `switch`,
      `@switch`, ternary operators, and nullish coalescing expressions). Every alternative execution path must have an
      explicit test case.

### 2. Structural Rigor (Strict AAA Pattern)

* **Mandatory AAA Separation:** Every test must explicitly segment its execution phases using mandatory section
  comments:
    * `// Arrange`: Initialize `TestBed`, register spies (`vi.fn()`), instantiate harnesses, and configure initial
      signal states.
    * `// Act`: Dispatch a user interaction via a harness, trigger a facade method, or emit a UI event.
    * `// Assert`: Verify real observable state and rendered output.
* **Real Behavioral Assertions:**
    * Assert against visible outcomes (signal values, rendered DOM text via Harnesses, disabled/enabled button states,
      triggered route navigations).
    * Ban assertions restricted solely to mock invocations (`expect(spy).toHaveBeenCalled()`) without validating
      downstream UI or state impact.
* **Uncompromised Integrity:** Never generate skipped or weakened tests (`describe.skip`, `it.skip`, `it.todo`,
  `it.only`).

### 3. Complete UI States, Edge Cases & Forms

* **Mandatory 4 UI States:** Every component rendering asynchronous data must explicitly test:
    1. **Loading:** Spinner or skeleton loader presence during pending state.
    2. **Success / Data:** Accurate rendering of received payload.
    3. **Empty State:** Contextual empty-state illustration/message and CTA presence when collections are empty.
    4. **Error:** Human-readable error message and retry CTA behavior.
* **Signal Forms & Input Validation:**
    * Verify validation boundaries (empty required field, pattern mismatch, boundary limits).
    * Verify submit button disabled status until validity is met.
    * Test nominal form submission payloads and subsequent form resets.
* **Destructive Actions & Confirmations:**
    * Verify confirmation modal display upon triggering destructive actions.
    * For critical multi-scope actions: verify the destructive action button remains strictly `disabled` until the
      required confirmation keyword is typed out identically.

### 4. Role Isolation & Authorization Testing (Frontend RBAC)

* **Functional Route Guards:**
    * Verify functional guard execution (`canActivateFn`, `canMatchFn`): granted access for authenticated/authorized
      roles vs. redirection or block for unauthorized profiles.
* **Permission-Based Conditional Rendering (Negative A/B Tests):**
    * Verify users with sufficient permissions can see and access restricted controls (edit/delete buttons).
    * Include mandatory negative tests: verify restricted elements are entirely absent or disabled when evaluated
      against unauthorized roles.

### 5. Zero Flakiness & Determinism under Vitest

* **Ban on Arbitrary Timeouts:**
    * Absolute ban on `setTimeout`, `sleep`, or arbitrary time-based waits in tests.
* **Deterministic Time Control:**
    * Use Vitest fake timers (`vi.useFakeTimers()`, `vi.advanceTimersByTime()`, `vi.runAllTimers()`) to validate
      debouncing or delayed flows.
    * Use `fakeAsync` / `tick` or `TestBed.flushEffects()` to synchronize reactive signals and Angular effects.
* **Complete Test Isolation:**
    * Reset `TestBed`, clear spies (`vi.clearAllMocks()`, `vi.resetAllMocks()`), and clear local state in `beforeEach` /
      `afterEach` hooks to guarantee total test execution independence.

## Output Format

When generating or refactoring test suites, structure the deliverable as follows:

1. **Test Strategy & Covered Scenarios:** Concise description of tested paths (nominal flow, the 4 UI states, error
   handling, negative RBAC, boundary checks, and conditional branch coverage mapping).
2. **Spec File Implementation (`.spec.ts`):** Clean, idiomatic modern TypeScript/Angular test code using Vitest,
   strictly separated into `// Arrange`, `// Act`, and `// Assert` phases using Component Harnesses and
   `HttpTestingController`.
3. **Invariant Checklist:** Explicit verification of AAA compliance, absence of arbitrary timeouts, exclusive Vitest
   APIs, full 4-state UI coverage, and 100% conditional branch coverage.
