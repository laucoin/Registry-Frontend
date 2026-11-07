---
name: techlead-review
description: Evaluates craft, code maintainability, strict Design System adherence (@sgdf/ui on GitLab), AST/ESLint compliance, and textual quality for the Registry frontend (Angular >= 22). Enforces project thresholds (methods max 25 lines, max 7 parameters, max 2 nesting levels, cyclomatic complexity max 6, inline templates max 5 lines, template files max 120 lines), no block bodies in pipe/computed, no parent relative imports (mandatory @core, @pages, @shared aliases), zero any, strict design tokens, and bilingual conventions (code in English, comments in French).
---

# TechLead Review (Craft, Clean Code, Design System & Editorial Quality)

Examine the change (diff, files, or current branch) against the craft, ESLint/AST hygiene, Design System adherence, and
maintainability requirements of the Registry frontend. Start with a baseline score of **100 points** and apply
deductions: **blocker −40**, **should-fix −10**, **nit −2.5** (minimum floor at 0).

---

## Evaluation Criteria & Strict Thresholds

### 1. Function Metrics & Complexity (Hard Limits)

- **Method & Function Size:** A function or method must not exceed **25 lines** excluding signature declarations, blank
  lines, and comments (`max-lines-per-function`). Break down or extract blocks that exceed this limit.
- **Template Line Length:**
    - Inline templates must not exceed **5 lines** (`component-max-inline-declarations`). Beyond that, an external
      `.html` template file is mandatory.
    - External template files must not exceed **120 lines**. Decompose templates exceeding this threshold into
      presentational (Dumb) sub-components.
- **Parameter Count:** Maximum **7 parameters** per function, method, or constructor (`@typescript-eslint/max-params`).
  Group excess parameters into a dedicated configuration object or interface.
- **Nesting Level:** Maximum **2 nesting levels** (`max-depth`). Beyond this, extract logic into helper functions or
  private methods.
- **Cyclomatic Complexity:** Limited to a maximum of **6** per method (`complexity`). Flatten complex branching using
  guard clauses or polymorphism.
- **Parameter Immutability:** Parameter reassignment is prohibited (`no-param-reassign` with `props: true`).

### 2. AST Rules, Modern Reactivity & Code Style

- **No Block Bodies `{ ... }` in Reactive Operators & Computeds:**
    - **RxJS Operators inside `pipe()`:** Arrow functions must not contain curly brace block bodies (`{ ... }`). Extract
      complex multi-line callback logic into a dedicated, well-named method.
    - **`computed()` Signals:** Curly brace block bodies (`{ ... }`) are strictly forbidden. Use single-line concise
      expressions or delegate the calculation to a pure private method.
- **Modern Angular Primitives & Prohibited APIs:**
    - **No Legacy Decorators:** Ban `@Input()`, `@Output()`, `@ViewChild()`, `@ViewChildren()`, and `@ContentChild()`.
      Use modern Signal-based alternatives (`input()`, `output()`, `viewChild()`, etc.).
    - **No `ChangeDetectorRef`:** Rely on native Signal reactivity and standard change detection.
    - **Dependency Injection:** Use `inject()` exclusively; constructor parameter injection is prohibited.
    - **No Redundant Declarations:** Do not specify `standalone: true` or
      `changeDetection: ChangeDetectionStrategy.OnPush` in component decorators (these are standard project defaults).
- **Early Return Pattern & Helper Extraction:** Systematically prioritize early returns (guard clauses) to handle edge
  cases, null checks, or boundary conditions early. Extract stateless calculations, DTO mappers, and formatters into
  `shared/helpers/` or `shared/mappers/`.

### 3. Import Hygiene & TypeScript Standards

- **Prohibition of Parent Relative Imports:**
    - Relative imports reaching parent directories (`../`) are strictly forbidden
      (`@typescript-eslint/no-restricted-imports`).
    - Mandatory use of configured path aliases: `@core/`, `@pages/`, `@shared/`.
- **Import Ordering & Grouping:** Enforce the four sorted import groups (`simple-import-sort`):
    1. Angular core packages (`^@angular`)
    2. External third-party packages (`rxjs`, `@ngrx/signals`, etc.)
    3. Internal path aliases (`^@(core|pages|shared)/`, `^@package$`)
    4. Sibling relative imports (`^\\.`)
- **Strict Typing:**
    - Absolute ban on `any` (`@typescript-eslint/no-explicit-any`).
    - Explicit function return types required on public methods and functions (`explicit-function-return-type`), with
      the documented exception of `*.store.ts` and store feature files.
    - Prohibit redundant typing on trivially inferrable variables (`no-inferrable-types`).

### 4. Design System Compliance & CSS Quality

- **`@sgdf/ui` Library (GitLab Package under Team Governance):**
    - Prioritize official components from the `@sgdf/ui` package (published on the internal GitLab registry).
    - Do not re-implement existing Design System elements locally (buttons, modals, inputs, badges, cards, etc.).
    - **Missing Components / Variants:** Because the team maintains the `@sgdf/ui` GitLab repository, any requirement
      for a new generic component or variant must result in a Merge Request to `@sgdf/ui` rather than local workarounds.
- **Strict Design Tokens:**
    - Mandatory use of CSS variables / design tokens provided by `@sgdf/ui` for spacing, typography, colors,
      border-radii, and elevations.
    - **Zero Magic Values:** No hardcoded pixel values (e.g., `margin: 13px`) or raw hex codes (e.g., `#1e293b`).
- **CSS Encapsulation & Quality:**
    - Absolute ban on `!important` and `::ng-deep`.
    - No inline styles in templates (`@angular-eslint/template/no-inline-styles`).
    - Respect repository editor formatting: tabs with width 4 for TypeScript and SCSS/CSS, tabs with width 2 for HTML.

### 5. Linguistic Conventions & Documentation

- **Code in English:** All identifiers (variable names, functions, components, signals, types, interfaces, directives,
  selectors with `app` prefix) must be authored in clear, accurate English.
- **Comments in French:** Explanatory comments (`// ...` or JSDoc) must be written in well-crafted French, focusing on
  *why* a decision was made rather than *what* the code does.
- **Documentation Headers:** Non-trivial components, facades, stores, and services must include the standard header
  block:
  `/** Objectif: ... | Périmètre: ... | Limites: ... */`.
- **Textual Quality:** Ensure zero spelling, typographical, or grammatical mistakes in i18n translation bundles, console
  messages, and user-facing notifications.

---

## Output Format

1. **Partial Score:** Start at 100, apply deductions (**blocker −40**, **should-fix −10**, **nit −2.5**), and output the
   score (e.g., `TechLead: 90/100`).
2. **List of Anomalies:** Grouped by severity with precise locations (`file:line`), description of the rule or metric
   broken, and concrete remediation code.
3. **Technical Debt:** Out-of-diff observations on untouched code (informational, zero score deduction).
