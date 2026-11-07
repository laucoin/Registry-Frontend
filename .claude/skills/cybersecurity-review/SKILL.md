---
name: cybersecurity-review
description: Evaluates Registry frontend security (Angular >= 22), including XSS prevention, DOM manipulation safety, client-side access control (Guards/RBAC), token and secret management, PII/data leak prevention, and supply chain security (pnpm audit).
---

# Cybersecurity Review (Perimeter & Frontend Defense)

Review the change (diff, files, or current branch) against the security and defensive robustness invariants of the
Registry frontend. Only files touched by the change are scored; gaps identified in untouched existing code are listed as
technical debt without score deductions. Start with a baseline score of **100 points** and deduct points based on
findings: **blocker −40**, **should-fix −10**, **nit −2.5** (floor at 0).

---

## Evaluation Criteria

### 1. Injection Protection & DOM Security (Anti-XSS)

- **Sanitization & Angular Bypasses:**
    - Usage of `DomSanitizer` and its bypass helpers (`bypassSecurityTrustHtml`, `bypassSecurityTrustScript`,
      `bypassSecurityTrustStyle`, `bypassSecurityTrustUrl`, `bypassSecurityTrustResourceUrl`) is strictly prohibited
      without explicit security justification and upfront sanitization (e.g., via DOMPurify).
    - Prohibit raw `[innerHTML]` bindings containing unsanitized dynamic data, user inputs, or external API responses.
      Prioritize Angular's native interpolation (`{{ }}`) and `[textContent]`.
- **Direct DOM Manipulation:**
    - Direct DOM mutation or element injection using `ElementRef.nativeElement` is prohibited.
    - Usage of unsafe browser global APIs manipulating raw HTML (`document.write`, `eval()`, `innerHTML`, `outerHTML`)
      is strictly forbidden.
    - Avoid direct access to globals (`window`, `document`, `localStorage`); prioritize Angular abstractions
      (`DOCUMENT`) or dedicated wrapper services.
- **Dynamic URLs & Open Redirects:**
    - Strictly validate and restrict dynamic URLs bound to `href`, `src`, or `iframe[src]` attributes to eliminate
      `javascript:` pseudo-protocol injection and unvalidated open redirects.

### 2. Access Control & Authorization (Guards & UI RBAC)

- **Route Protection:**
    - All non-public routes must be guarded using strict functional guards (`canActivateFn`, `canMatchFn`).
    - Permission checks must use typed permission constants (shared models aligned with backend definitions), never
      string literals.
- **Conditional Rendering & UI RBAC:**
    - Sensitive UI actions (delete buttons, administrative panels, restricted navigation menus) must be gated against
      verified user permissions (via dedicated structural directives or session facades).
    - *Defensive Note:* Frontend UI gating improves user experience; definitive authorization enforcement strictly
      remains the responsibility of the BFF and backend.

### 3. Secret Management, Tokens & Local Storage

- **Secrets & Hardcoded Keys:**
    - Zero hardcoded secrets, passwords, private keys, cryptographic signatures, or access tokens in source code, test
      mocks, or environment files (`environment.ts`).
    - Only non-sensitive runtime configurations (e.g., public BFF URL, public OAuth client ID) may reside in client
      configuration files.
- **Persistence & Sensitive Data:**
    - Prohibit storing sensitive authentication tokens (access JWTs, refresh tokens) or PII in `localStorage` or
      `sessionStorage` where they are vulnerable to script-based exfiltration. Prefer secure, HttpOnly,
      `SameSite=Strict`/`Lax` cookies issued by the BFF.
    - Thoroughly purge in-memory state and local session caches upon sign-out (`SessionFacade.signOut()`).

### 4. Data Leaks & Network Traffic Hygiene

- **Data Exposure & Logging:**
    - No `console.log` or `console.error` exposing sensitive user payloads, raw API responses, or PII in production
      builds.
    - HTTP error interceptors must avoid displaying raw stack traces or internal server error diagnostics in user-facing
      toasts or UI banners.
- **Headers & File Downloads:**
    - Client-side file exports: ensure dynamically generated Object URLs (`URL.createObjectURL`) are revoked immediately
      after trigger (`URL.revokeObjectURL`) to avoid memory and data leaks.
    - Content Security Policy (CSP) alignment: avoid inline scripts or dynamically injected inline styles that break
      strict CSP directives (`nonce-based` or without `'unsafe-inline'`).

### 5. Supply Chain & Dependencies (pnpm audit)

- **Dependency Auditing:**
  When touching `package.json`, `pnpm-lock.yaml`, `Dockerfile`, or CI workflows:
    - Audit newly introduced, updated, or removed dependencies via `pnpm audit`.
    - Screen for both direct and transitive vulnerabilities against public vulnerability registries.
    - *Severity rule:* An exploitable or critical CVE on a direct dependency is a **blocker**; a vulnerability on a
      build/dev dependency with an available patch is a **should-fix**.
- **Package Hygiene:**
    - Reject abandoned, obscure, or oversized dependencies introduced for trivial logic that can be safely authored in
      native TypeScript/Angular.

---

## Output Format

- **Partial Score:** Start at 100, apply deductions (**blocker −40**, **should-fix −10**, **nit −2.5**), and output the
  resulting score (e.g., `Cybersecurity: 90/100`).
- **Findings List:** Grouped by severity with precise locations (`file:line`), threat explanation, and exact proposed
  fixes.
- **Technical Debt:** Untouched existing code issues reported informatively (no score deduction).
