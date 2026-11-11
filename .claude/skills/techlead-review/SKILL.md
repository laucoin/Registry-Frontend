---
name: techlead-review
description: Evaluates craft, code maintainability, strict Design System adherence (@sgdf/ui, source: https://gitlab.com/sgdf/projets-benevoles/sgdf-ui), AST/ESLint compliance, and textual quality for the Registry frontend (Angular >= 22). Enforces project thresholds (methods max 25 lines, max 7 parameters, max 2 nesting levels, cyclomatic complexity max 6, inline templates max 5 lines, template files max 120 lines), no block bodies in pipe/computed, no parent relative imports (mandatory @core, @pages, @shared aliases), zero any, strict design tokens, and bilingual conventions (code in English, comments in French).
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
- **Complexity Counting:** `||`, `&&`, `??`, `?.`, ternaries and default values all count toward the limit. Flat
  mappings use `FormModelHelper.orEmpty` and `orNull`.
- **Store Method Size:** A `withMethods` callback of a store that grows past the size limit is split into several
  chained `withMethods`, by theme.
- **Spec Files:** `*.spec.ts` files are exempt from the function size limit (a `describe` is a container), but
  `beforeEach` and `it` stay short.

### 2. AST Rules, Modern Reactivity & Code Style

- **No Block Bodies `{ ... }` in Reactive Operators & Computeds:**
  - **RxJS Operators inside `pipe()`:** Arrow functions must not contain curly brace block bodies (`{ ... }`). Extract
    complex multi-line callback logic into a dedicated, well-named method.
  - **Readable Reactive Flows (`rxMethod`/`pipe`):** Factor operators and intermediate steps into small, well-named
    private methods so the flow reads at a glance. Each operator call fits on a **single line**; an operator whose
    logic needs a second line is extracted into its own method. Exceptions are defined with the developer case by
    case, never assumed.
  - **Other callbacks** (`subscribe`, `forEach`, form schemas, `effect`) may keep a block body.
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
  cases, null checks, or boundary conditions early. Extract stateless calculations and formatters into
  `shared/helpers/`; a helper computes. Extract DTO to model (and model to DTO) conversions into `shared/mappers/`; a
  mapper only maps between objects and does nothing else.
- **Helpers and Mappers Shape:** They are `as const` objects, never static-only classes; private members become module
  functions.
- **Naming:** Variable and method names are explicit and self-descriptive. **Exception, RxJS operator callbacks:**
  inside a reactive (`rxMethod`/pipe) operator's own callback, a **single** parameter may be named with one or two
  letters (e.g. `it`); the exception stops there and does not apply to a callback with several parameters.
- **No Dead Code:** Remove unused code, methods, imports and variables rather than keeping them "just in case".

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
  - Absolute ban on the non-null assertion `!`. Narrow the type with the `GenericHelper.isNull`/`nonNull` type guards
    or an early return, and use `GenericHelper.require` for a value the validation already guarantees. In specs, use
    `defined()` (`shared/helpers/testing/defined.ts`).
  - Requests without a response body are typed `http.post<undefined>(...)`; the application version is read through
    the `@package` alias.
  - Explicit function return types required on public methods and functions (`explicit-function-return-type`), with
    the documented exception of `*.store.ts` and store feature files.
  - Prohibit redundant typing on trivially inferrable variables (`no-inferrable-types`).
  - Explicit member accessibility (`public`/`private`/`protected`) on every class member, except constructors
    (`@typescript-eslint/explicit-member-accessibility`).

### 4. Design System Compliance & CSS Quality

- **`@sgdf/ui` Library (Owned by the Developer, Source: https://gitlab.com/sgdf/projets-benevoles/sgdf-ui):**
  - **Check first:** Before building any UI, check what `@sgdf/ui` already provides (`custom-elements.json` and the
    `.d.ts` of `node_modules/@sgdf/ui`): a component for the need (e.g. `sgdf-callout` for a message or an error) and
    its `variant`, `appearance`, slots and CSS properties for the look.
  - Prioritize official components from the `@sgdf/ui` package. Do not re-implement existing Design System elements
    locally (buttons, modals, inputs, badges, cards, etc.).
  - **Documented Surfaces Only:** The project acts on an `@sgdf/ui` component only through its properties, slots,
    CSS custom properties and `::part`s listed in `custom-elements.json`. Tailwind never recolors an `@sgdf/ui`
    component or rebuilds one.
  - **Missing Components / Variants / Behaviors:** No local override, workaround or custom fallback. Report the need
    as a change to make in the `@sgdf/ui` repository (https://gitlab.com/sgdf/projets-benevoles/sgdf-ui) (the developer owns the library and decides), and record it as debt until it
    lands.
- **Strict Design Tokens:**
  - Mandatory use of the `--sgdf-*` CSS variables provided by `@sgdf/ui` for colors, typography, border-radii and
    elevations in the project's own CSS. The tokens belong to the library and its components.
  - **Layout:** Arranging `@sgdf/ui` components relative to each other (flex, grid, gaps, spacing) is the project's
    job and uses Tailwind CSS v4 utility classes with the default breakpoints. Beware the spacing scale: Tailwind
    steps are `n × 0.25rem`.
  - **Zero Magic Values:** No hardcoded pixel values (e.g., `margin: 13px`) or raw hex codes (e.g., `#1e293b`) in
    native CSS.
  - **Theming:** `@sgdf/ui` owns the theme. The mode (`light`, `dark`, or no attribute for the system) is set on
    `<html>` as the `data-sgdf-mode` attribute, always via `BrowserService`; the `@sgdf/ui` entry point is never imported
    for it (it would pull the whole library). No theme key is added to `config.json`. Any change to this mechanism is
    raised with the user.
- **CSS Encapsulation & Quality:**
  - Absolute ban on `!important` and `::ng-deep`.
  - No inline styles in templates (`@angular-eslint/template/no-inline-styles`).
  - Respect repository editor formatting: tabs with width 4 for TypeScript and CSS, tabs with width 2 for HTML.

### 5. Linguistic Conventions & Documentation

- **Code in English:** All identifiers (variable names, functions, components, signals, types, interfaces, directives,
  selectors with `app` prefix) must be authored in clear, accurate English.
- **Comments in French:** Explanatory comments (`// ...` or JSDoc) must be written in well-crafted French, focusing on
  _why_ a decision was made rather than _what_ the code does.
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
