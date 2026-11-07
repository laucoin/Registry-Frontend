## name: qa-review

description: Evaluates frontend test strategy and quality for Angular (>= 22) under Vitest, including unit and component
coverage (Vitest, Component Harnesses), strict AAA pattern adherence, UI state coverage (loading, error, empty),
role/permission isolation (RBAC), anti-flaky deterministic guarantees (no arbitrary timeouts via vi fake timers), E2E
testability enforcement (mandatory data-test-id on interactive elements), and code coverage gates.

# QA Review (Test Strategy & Frontend Robustness under Vitest)

Review the change (diff, files, or current branch) against the quality and testing invariants of the Registry frontend.
Only files touched by the change are scored; gaps identified in untouched existing code are listed as technical debt
without score deductions. Start with a baseline score of **100 points** and deduct points based on findings: **blocker
−40**, **should-fix −10**, **nit −2.5** (floor at 0).

## Evaluation Criteria

### 1. Test Coverage & Typology

* **Tested Scope:** Every component, facade, store (`signalStore`), mapper, helper, guard, or interceptor created or
  modified must have a dedicated test suite (`.spec.ts`).
* **Target Stack & Tooling (Vitest & Angular):**
    * **Test Runner:** Exclusive use of **Vitest** APIs (`describe`, `it`, `expect`, `vi`). No legacy Jest or Jasmine
      imports allowed.
    * **Components:** Systematic use of **Component Harnesses** (Angular CDK harnesses or custom harnesses) to interact
      with the DOM and validate rendering decoupled from internal template structure.
    * **Facades & Stores:** Direct testing of reactive signals, computed values (`computed`), and asynchronous methods
      (`rxMethod`).
    * **HTTP Mocking & Contracts:** Use `provideHttpClientTesting()` and `HttpTestingController` to validate
      interceptors and API adapters without real network requests.
* **Coverage Gate:** Strict adherence to configured code coverage thresholds in the Vitest runner (v8/istanbul). No
  incremental or overall coverage regression tolerated on modified/added code.

### 2. Test Structure & Rigor (AAA Pattern)

* **Strict AAA Separation:** Every test must explicitly and legibly separate its phases using mandatory section
  comments:
    * `// Arrange`
    * `// Act`
    * `// Assert`
* **Real Behavioral Assertions:** Assertions must evaluate real application state and rendered user-facing output
  (signal values, DOM text via Harnesses, button disabled states, triggered navigation) rather than merely verifying
  mock invocations (`expect(spy).toHaveBeenCalled()`).
* **Test Integrity:** No test may be disabled (`describe.skip`, `it.skip`, `it.todo`, `it.only`), ignored, or weakened
  (assertions removed or commented out) to bypass CI.

### 3. UI States, Edge Cases & Error Handling Coverage

* **Complete UI States:** Any component rendering asynchronous data must explicitly test all visual states:
    * Loading state (spinners / skeletons).
    * Nominal state with data (successful payload).
    * Empty state (empty list / zero results message).
    * Error state (contextual error message, retry options).
* **Forms & Validation (Signal Forms):** Boundary testing for user inputs, submit button disabled status on invalid form
  states, field-level error messages, and successful submission workflows.
* **Collection Boundaries & Edge Values:** Tests covering boundary conditions (0 items, 1 item, pagination thresholds),
  long strings, special characters, and `null` / `undefined` resilience.

### 4. E2E Testability & Deterministic Selectors (`data-test-id`)

* **Mandatory `data-test-id` on All Interactive Elements:**
    * Every interactive or actionable template element must provide a unique, semantic `data-test-id` attribute (e.g.,
      `data-test-id="project-create-submit-btn"`, `data-test-id="project-name-input"`,
      `data-test-id="confirm-delete-dialog-input"`).
    * This applies to: buttons, links acting as triggers, form inputs, selects, checkboxes/radios, action dropdowns,
      modal triggers, and critical data containers.
    * **Objective:** Decouple E2E test selectors from visual styling classes, layout changes, or localized labels,
      ensuring resilient and unbreakable Playwright E2E locators (`page.getByTestId(...)`).
    * *Severity rule:* An interactive element introduced without a `data-test-id` is a **should-fix (-10)**.

### 5. Authorization & Role Isolation Testing (Frontend RBAC)

* **Guards & Navigation:** Unit test verification that route guards grant access to authorized roles and consistently
  redirect or block unauthorized roles.
* **Permission-Based Conditional Rendering:** Negative testing verifying that sensitive UI elements (e.g., action
  buttons, administrative forms) are either hidden or disabled when a user lacks required permissions.

### 6. Zero Flaky Tests & Determinism under Vitest

* **No Arbitrary Pauses:** Strict ban on `setTimeout`, `sleep`, or arbitrary time-based waits in tests.
* **Time & Asynchrony Control:** Use Vitest fake timers (`vi.useFakeTimers()`, `vi.advanceTimersByTime()`,
  `vi.runAllTimers()`) or Angular testing utilities (`fakeAsync` / `tick`, `TestBed.flushEffects()`).
* **Complete Test Isolation:** Thorough reset of `TestBed`, stores, and mocks between tests in `beforeEach` /
  `afterEach` hooks (`vi.clearAllMocks()`, `vi.resetAllMocks()`) to ensure absolute independence from test execution
  order.

## Output Format

* **Partial Score:** Start at 100, apply deductions (**blocker −40**, **should-fix −10**, **nit −2.5**), and output the
  resulting score (e.g., `QA: 90/100`).
* **Findings List:** Grouped by severity with precise locations (`file:line`), explanation of the testing gap or missing
  `data-test-id`, and concrete remedies.
* **Technical Debt:** Missing or fragile tests in untouched pre-existing code reported informatively (no score
  deduction).
