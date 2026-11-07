---
name: code-review
description: Review gate for the Angular frontend repository. Sequentially orchestrates architecture & performance, cybersecurity, QA, techlead (including design system), designer (UI/UX/a11y), and interactive peer reviews from macro to micro, delegating details to sub-skills, using a /100 scale with iterative re-checks after fixes.
---

# Code Review — Angular Frontend (Orchestrator)

## 0. Scope, Volumetry & Context Analysis

- **Default:** Analyzes the diff of the current branch against `main` (`git diff main...HEAD`). The diff serves as the
  scoring basis; gaps identified in untouched existing code are reported as technical debt without score deductions.
- **Volumetry Threshold / Full Project:** If the diff is too large (too many files/lines modified) or if the user
  requests a review of the **entire project**, immediately interrupt the analysis and suggest switching to a model with
  an expanded context window (e.g., 1M tokens) or proceeding incrementally by feature/directory chunks.

---

## Contract: Sequential, Iterative, and Interactive Review (Macro -> Micro)

The analysis is performed **category by category, from macro to micro**, delegating each perspective to its dedicated
sub-skill.

- **Stop & Re-check Rule:** At the conclusion of each category:
    - If the score reaches **100/100**, proceed directly to the next category.
    - If issues are detected (e.g., 80/100), **stop immediately**. Propose and apply fixes collaboratively with the
      user, then **re-run an evaluation pass on this exact category** to refresh the score (targeting 100/100) before
      advancing.
- **Evidence over Opinion:** Run the build and lint checks (`npm run build` and `npm run lint` or package manager
  equivalents) upfront to ensure base technical health.
- **Branches & Commits:** Disregard commit messages, branch naming conventions, and commit count during review.

---

## Sequence of Perspectives & Delegation

The orchestrator delegates evaluations to specialized sub-skills in the following descending order:

### 1. Architecture & Performance (Macro & Runtime Efficiency)

- **Delegated skill:** `architecture-review`
- *Verifies:*
    - **Structure & Modularity:** Strict Standalone components architecture (no NgModules), Smart/Dumb component
      separation, clear state management boundaries, route-level lazy loading.
    - **Reactivity & Rendering Strategy:** Modern reactivity using Signals (`signal`, `computed`, Signal
      inputs/outputs/queries), Zoneless readiness or explicit `ChangeDetectionStrategy.OnPush`, deferrable views
      (`@defer`) with proper trigger boundaries (`on viewport`, `on idle`).
    - **Memory & Resource Lifecycle:** Clean async handling, lifecycle cleanup (mandatory `takeUntilDestroyed` or
      conversion via `toSignal`), prevention of event listener and subscription leaks.
    - **Bundle & Web Vitals:** Tree-shaking integrity, dynamic imports for heavy dependencies, asset delivery best
      practices (`NgOptimizedImage`), and overall Core Web Vitals preservation (LCP, INP, CLS).

### 2. Cybersecurity (Perimeter & Defense)

- **Delegated skill:** `cybersecurity-review`
- *Verifies:* XSS mitigation (strict enforcement and justification for `DomSanitizer` / `bypassSecurityTrust*`), DOM
  manipulation safety (avoiding raw `ElementRef.nativeElement` and direct `window`/`document` access; prioritizing safe
  template bindings), secure client-side storage (zero storage of sensitive JWTs/PII in `localStorage`/
  `sessionStorage`), route guard protection (`canActivate`, `canMatch`), and dependency audit checks (`npm audit`).

### 3. QA (Testing Strategy)

- **Delegated skill:** `qa-review`
- *Verifies:* Systematic test coverage for all new component and service behaviors, strict adherence to the AAA
  (Arrange, Act, Assert) pattern, component testing using Angular Component Harnesses, deterministic test guarantees (no
  arbitrary sleep/delays), comprehensive coverage of UI edge states (loading, error, empty), and testing threshold
  enforcement.

### 4. TechLead & Design System (Micro & Engineering Standards)

- **Delegated skill:** `techlead-review`
- *Verifies:*
    - **Design System Enforcement:** Strict application of corporate design tokens (colors, spacing, typography), reuse
      of core UI library components, total absence of hardcoded magic values or `!important`, and encapsulated styling.
    - **Craft & Clean Code:** Strict complexity limits (template length, function cognitive complexity, deep nesting),
      strict TypeScript standards (zero `any`, proper union types), codebase hygiene (unused imports, orphaned files),
      standard naming conventions, and dead code elimination.

### 5. Designer (UI, UX & Accessibility)

- **Delegated skill:** `designer-review`
- *Verifies:*
    - **UI / UX:** Visual hierarchy, feedback states across interactions (`hover`, `focus`, `active`, `disabled`), user
      guidance through visual states (skeletons, spinners, clear error banners, contextual toasts), and responsive
      layout fidelity.
    - **Accessibility (A11y):** WCAG / RGAA compliance, complete keyboard navigation, modal and drawer focus
      traps/restoration, semantic HTML elements over unstyled container clicks, correct ARIA roles and labels, and
      accessible color contrast.

### 6. Peer (Feature Walkthrough & Team Context)

- **Delegated skill:** `peer-review`
- *Verifies:* Collaborative, feature-by-feature guided walkthrough, concise alignment summary (business intent vs
  technical implementation), constructive dialogue on architectural trade-offs, readability and simplicity (KISS /
  YAGNI), strict adherence to acceptance criteria, and fast workspace adjustments applied on the fly.

---

## Scoring Scale (/100) & Step-by-Step Output

For each evaluated category (1 through 5):

- **Starts at 100 points**, applying standard deductions per issue: **blocker −40**, **should-fix −10**, **nit −2.5**
  (floor at 0).
- The output displays the current score out of 100, bulleted findings with actionable remedies, and executes the
  re-check loop until a score of 100/100 is reached before triggering the next evaluation phase.
