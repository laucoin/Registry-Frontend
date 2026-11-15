# AGENTS.md - Development Guidelines for Angular CSR Project

This document outlines the strict guidelines, architecture rules, and conventions for AI agents and developers working
on this Angular Client-Side Rendering (CSR) project.

The architecture, security, QA, techlead, designer, test and git standards live in the skills of `.claude/skills/`,
which are the source of truth for them. This document does not repeat them: it points to the skill and keeps only the
rules specific to this project.

---

## 1. Language & Communication

- **User Interaction:** All direct communication, questions, and validations with the user **must** be conducted in
  **French**. Be concise and factual: no pleasantries, 1–2 simple sentences per explanation, except when a decision is
  requested (see below). Review reports (`code-review` and its sub-skills) are also written in French.
- **Interactive mode first:** always prefer the interactive mode (`AskUserQuestion`) over a free-text question or a
  silent assumption whenever a decision belongs to the user (design choice, scope, naming, trade-off, ambiguous
  request, documentation update). Each question must carry enough context to decide without re-reading the code:
  what is at stake, the relevant code or spec reference (`file:line`), 2–4 options each with its consequences and
  trade-offs, and a recommended option placed first. Group related decisions in a single call. Do not ask when a
  convention of this document or the existing code already settles the point. The limit of two questions of
  `peer-review` only applies to the dialogue of that review.
- **Detailed questions (exception to the brevity rule):** assume the user has lost the context (after `/clear`, a task
  switch or a long session). Every interactive question is therefore self-contained and detailed, never a terse label:
  1. **Situation:** recall the starting point (current behaviour, what was already done, files with `file:line`).
  2. **Stakes:** why a decision is needed now and what it unblocks.
  3. **Options:** for each one, state concretely what changes, what is kept or lost, the risks and the follow-up work.
  4. **Recommendation:** first option, with the reason for the choice.
     Use `preview` to compare before/after. A question the user must reject to ask for clarification is a failed question.
- **Code & Comments:** All source code, variable names, functions, and commit messages **must** be written in
  **US English**. Comments (inline comments and JSDoc blocks) and the project's markdown documentation **must** be
  written in **French**.
- **Strict Scope:** Address only the requested task. Do not refactor surrounding code or fix unrelated items.

---

## 2. Tech Stack

- **Framework:** Angular (latest version configured for **Client-Side Rendering - CSR**).
- **Reactivity & State:** Strictly use **Angular Signals** (including `@ngrx/signals` `signalStore`, `input()`,
  `output()`, etc.). The modern Angular primitives are listed in `architecture-review` §3.
- **Design System:** `@sgdf/ui` (Web Awesome based web components). Check first what it provides, act on its
  components only through their documented surfaces, and keep tokens and theming as specified in `techlead-review` §4.
- **Styling:** Tailwind CSS v4 utility classes in templates (default breakpoints) for the layout of the components among
  themselves, native CSS for the remaining component styles. Bootstrap is not used.
- **`@sgdf/ui` ownership:** the developer owns the library (source: https://gitlab.com/sgdf/projets-benevoles/sgdf-ui) and can change it. No override,
  workaround or custom fallback in this project: a need the library does not cover is reported as a change to make in
  the `@sgdf/ui` repository (https://gitlab.com/sgdf/projets-benevoles/sgdf-ui) (rules in `techlead-review` §4 and `designer-review` §4).

---

## 3. Architecture & Project Structure

The three-pillar layout (`core/`, `pages/`, `shared/`), the isolation rules and their documented exceptions, the
placement of domains, the core facades, the `api → store → facade` data flow (`@ngrx/signals`), the store scoping, the
DTO mappers, the single HTTP interceptor and the performance rules are specified in `architecture-review`. Project
specifics not covered there:

- **`shared/ui/domain/`** (cards and forms of the business entities) is reworked with the `@sgdf/ui` migration: do not
  add new `shared` to `pages` imports elsewhere.

---

## 4. Abstraction & Environment Configuration

- **Environment Agnostic (CSR):** no environment-specific parameter is hardcoded or compiled into the bundle; runtime
  configuration is loaded as specified in `cybersecurity-review` §3.
- **Browser access:** `window`, `document`, `location` and `navigator` are reached only through `BrowserService`
  (`core/browser/browser.service.ts`); storage goes through the storage helpers (`cybersecurity-review` §1 and §3).

---

## 5. Coding Standards, Quality & Best Practices

- **Formatting & Linting:** Strictly adhere to project linting rules (`ESLint`, Prettier, etc.).
- **Standards by skill:** the function metrics, AST rules, imports, typing, naming, dead code and design system rules
  are in `techlead-review`; the accessibility, UX states (loading, error, empty), lists, mobile-first and SEO rules in
  `designer-review`; the test ids (`data-test-id`) and test quality in `qa-review`; the security rules in
  `cybersecurity-review`; the structure, data flow and invariants of the data layer in `architecture-review`.
- **Error Handling:** the strategy (backend title and message shown as is, generic frontend message otherwise) is in
  `designer-review` §1. A feature may instead be log-only, but only when this has been **defined with the developer**
  before implementation (reporting rules in `cybersecurity-review` §4).

---

## 6. Skills (mandatory routing)

When a request matches a skill, **load and follow it before doing anything else**. Do not improvise the procedure.

| Request                                                               | Skill                 |
| --------------------------------------------------------------------- | --------------------- |
| Review a diff, file or branch; "review", "check my change"            | `code-review`         |
| Add, write, extend or fix tests                                       | `test`                |
| Create a commit, plan commit scopes                                   | `git-commit`          |
| Create a local branch                                                 | `git-branch-creation` |
| Create an issue (explicit request, or branch without a ticket number) | `git-issue-creation`  |

`code-review` orchestrates `architecture-review`, `cybersecurity-review`, `qa-review`, `techlead-review`,
`designer-review` and `peer-review`: each of them can also be requested alone. `code-review` and `test` run **only**
before a commit or when the user asks for them; never automatically after an edit. Before each commit, the scored
categories of `code-review` must reach 100/100 (scale and re-check loop defined in the skill), and the new code must be
covered by tests.

---

## 7. Build, Tests & Commands

- **Gate and commands:** `pnpm lint`, `pnpm build` and `pnpm test:coverage` are the pre-commit authority, as defined in
  `git-commit` §5. `pnpm test` is the faster inner loop.
- **Coverage:** `pnpm test:coverage` measures the whole `src/app` and enforces the thresholds of `angular.json`
  (`test` §2). Test writing conventions are in the `test` skill.

## 8. Documentation (doc.laucoin.fr)

- Reference: https://doc.laucoin.fr/registry
- Rule: The agent must always ask the user if documentation updates are relevant for any given feature or change, and
  where the documentation is located before attempting any updates.
- Separation: never modify documentation during code steps, never touch frontend source during a specification step.
  A scope change or unforeseen case means updating the specification **first**.
- Conflict/Missing: If a user request, or a specification fetched from the documentation hub during spec-driven
  development, would require violating a rule in this document, stop before implementing it. Do not silently comply with
  the request, and do not silently ignore the spec. Propose one of two paths to the user: update this document to
  reflect the new rule, or adjust the request/spec to fit the existing rule. Proceed only once the user has picked one.

## 9. Comments Policy

- No Superfluous Comments: Keep comments synthetic, modern, and state-of-the-art.
- Prohibitions: Do not write comments about migrations, past states, or changelogs.
- Future Actions: Any comment referring to future tasks or technical debt must be explicitly marked as // TODO:.
- Permission Required: The agent must always ask the user for permission before adding any comment to the code.
- Pre-approved exceptions (standing, no need to ask each time; every other comment still requires permission):
  - **File-level header:** the `Objectif | Périmètre | Limites` block above non-trivial units, with the format and the
    units concerned defined in `techlead-review` §5.
  - **AAA markers:** the `// Arrange`, `// Act` and `// Assert` comments of the tests, as required by the `test` skill.

## 10. Git & Version Control

- **Commits:** the agent may commit, in Conventional Commits format, `type` ∈ `feat, fix, chore, docs, style, refactor,
perf, test` (semantic-release derives versions from them). Message format, atomicity, scope check against the
  branch ticket and the pre-commit gate: `git-commit`. Branch creation: `git-branch-creation`.
- **The git remote is read-only:** no write action on it (push, creating or editing a pull request or release, editing
  or commenting an issue, etc.). Reads (fetch, viewing pull requests and issues) are allowed. **Exception:** creating
  an issue through `git-issue-creation`, only after the explicit validation of the user (`gh issue create` is in the
  `ask` list of `.claude/settings.json`). The other write actions are denied in `.claude/settings.json`.
- **Scopes** are planned and agreed with the user before development begins, broken down into the smallest
  functionally testable increments.
- **Work-in-progress gate:** while a complete, testable feature is implemented but uncommitted, refuse any new unrelated
  feature; only fixes, review feedback and adjustments to the pending feature are allowed. Local commits on the current
  branch are enough: the developer decides when to push and open the PR, and may ask the agent to keep working on the
  same branch meanwhile.
- **Misunderstanding / bug:** stop immediately, never stack patch commits on a broken change. Explain the issue in one
  sentence so the user can `git reset`.

## 11. Non-Negotiable Technical Invariants

- The frontend enforces nothing. Guards and permission-driven UI exist for usability only — the backend re-checks every
  condition on every request. Never treat a guard or a hidden control as a security boundary.
- Permissions, not roles: the UI reads authorities, never the role name. **Documented exception:** on the project home
  page, the birthdays and the participants to regularize are neither loaded nor shown unless the user's role on the
  project is `PROJECT_ADMINISTRATOR` or `PROJECT_COORDINATOR` (`ProjectRoleEnum`, `ProjectHomePage.canSeeProfileWidgets`).
  Do not add other role checks without agreeing on a new exception with the user.
- Pure Client-Side Execution (CSR): the browser globals and the storage are encapsulated as defined in §4, which keeps
  the code cleanly unit testable.
- Static Web Serving (CSR): Production output is hosted as pure static assets (e.g. NGINX / Caddy). Ensure web server
  fallback rules (URL rewriting to index.html) are configured for HTML5 client-side routing.
- Hardening headers (including a CSP) are set in `nginx.conf`. The CSP must stay as strict as the app allows: no
  `unsafe-eval`, and any loosening must be justified and agreed with the user first. `style-src 'unsafe-inline'` is
  currently present in `nginx.conf` (Angular and `@sgdf/ui` inject styles at runtime); the goal is to remove it, as a
  separate task.
- semantic-release drives versioning/changelog/tags from Conventional Commits — a non-conventional commit message
  produces a wrong or missing release.
- Invariants specified in a skill, to keep in mind: `rxMethod` pipes swallow their own errors and the single HTTP
  interceptor with the refresh exclusion (`architecture-review` §2), the runtime configuration (`cybersecurity-review`
  §3), the theming through `data-sgdf-mode` via `BrowserService` (`techlead-review` §4) and the lazy-loading pagination
  without page numbers (`designer-review` §1).
