---
name: designer-review
description: Evaluates UI/UX compliance, Mobile-First responsiveness (down to 320px), technical SEO, and digital accessibility (WCAG 2.2 AA / RGAA within the bounds of @sgdf/ui) for the Registry frontend (Angular >= 22). Verifies ergonomics, visual hierarchy, complete feedback loops (loading, error, success, empty states), reinforced confirmation dialogs for multi-scope destructive actions, keyboard navigation, focus management, and indexable semantics.
---

# Designer Review (UI, UX, Mobile-First, SEO & Digital Accessibility)

Examine the change (diff, files, or modified templates) against the ergonomics, user experience (UX) quality,
**Mobile-First** approach (supporting viewports down to **320px**), technical **SEO** optimization, and digital
accessibility standards (**WCAG 2.2 Level AA / RGAA**, within the contract of `@sgdf/ui` components) of the Registry
frontend. Only files touched by the change are scored; gaps identified in untouched existing code are listed as
technical debt without score deductions. Start with a baseline score of **100 points** and apply deductions: **blocker
−40**, **should-fix −10**, **nit −2.5** (minimum floor at 0).

---

## Evaluation Criteria

### 1. Ergonomics, User Experience (UX) & Interface States

- **Complete Interface States (Feedback Loop):**
    - Any asynchronous view must explicitly and cleanly handle all 4 visual states:
        1. **Loading:** Skeleton loaders prioritized over blocking full-screen spinners to eliminate content layout
           shifts (CLS).
        2. **Success / Data:** Fluid, well-structured presentation of information.
        3. **Empty State:** Contextual illustration or icon, unambiguous explanatory copy, and an actionable Call to
           Action (CTA) guiding the user to create or initialize the resource.
        4. **Error:** Human-readable error message (never raw technical error payloads or HTTP codes) paired with a
           clear recovery action (e.g., "Retry" button).
- **Error Prevention & Destructive Actions:**
    - **Standard Destructive Action:** Any standard irreversible action (local item deletion, simple revoke) requires an
      explicit confirmation modal featuring a visually differentiated destructive action button (danger token from
      `@sgdf/ui`).
    - **Critical Multi-Scope / High-Impact Action (Reinforced Confirmation):**
        - Whenever an action affects multiple scopes, other users, or user account ownership (e.g., project deletion,
          user account deletion, organization-wide module deactivation), a simple "Cancel / Confirm" dialog is
          **strictly prohibited and deemed insufficient**.
        - **Mandatory Typed Confirmation:** The dialog must require the user to explicitly type out a confirmation
          keyword or the exact resource identifier (e.g., retyping the exact project name or a strict confirmation
          keyword such as `"DELETE"`). The destructive confirmation button must remain strictly `disabled` until the
          input matches.
    - **Double-Submission Prevention:** Action triggers must enter a `disabled` state and expose an inline progress
      indicator during flight to prevent duplicate submissions.

### 2. Mobile-First Philosophy & Responsiveness (Down to 320px)

- **Native Mobile-First Layout:**
    - CSS styles and layouts must be authored mobile-first by default, expanding progressively via ascending media
      queries (`min-width`).
    - **320px Minimum Viewport Guarantee:** Full layout responsiveness and functional integrity must be maintained
      seamlessly down to **320px width** (small mobile devices) without clipping, overlapping elements, or involuntary
      horizontal viewport scrollbars.
    - Interactive touch targets must meet a minimum footprint of **44x44 pixels** (buttons, links, icon triggers).
- **Adaptive Multi-Screen UI:**
    - Responsive refactoring for dense elements (e.g., data tables transforming into stacked cards on mobile or encased
      in explicitly bounded horizontal scroll containers).
    - Navigation menus, bottom sheets, and drawers must be comfortably operable with one hand on small screens.

### 3. Technical SEO & Discoverability

- **Semantic Hierarchy & Heading Flow:**
    - Exactly one logical `<h1>` per routed page describing the core view intent.
    - Strict descending heading hierarchy (`<h1>` -> `<h2>` -> `<h3>`) without skipping levels for visual styling needs.
- **Dynamic Page Metadata (Title & Meta):**
    - Systematically set unique page titles and relevant meta descriptions per route using Angular's `Title` and `Meta`
      services (or route-level data contracts).
    - Include baseline OpenGraph tags (`og:title`, `og:description`) on shareable entities.
- **Indexability & Crawlable Links:**
    - Internal navigation must rely on crawlable anchors (`<a [routerLink]="...">` or `<a href="...">`), never on
      clickable `<div>` or `<button>` elements dispatching programmatic router navigations.

### 4. Digital Accessibility (WCAG 2.2 AA / RGAA) & `@sgdf/ui` Boundary

- **Alignment with `@sgdf/ui` Design System:**
    - Internal ARIA contracts, color contrasts, and focus rings are primarily delegated to official `@sgdf/ui`
      components.
    - If an accessibility deficiency originates inside an `@sgdf/ui` component, **do not introduce local DOM/CSS
      hacks**: record the finding as technical debt for an upstream Merge Request on the `@sgdf/ui` GitLab repository.
- **Full Keyboard Navigation & Focus Management:**
    - Full feature usability using keyboard alone (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
    - Strict ban on removing visible focus outlines (`outline: none` or `outline: 0`) without a high-contrast
      replacement indicator.
    - Mandatory focus trap inside modals and slide-out drawers, functional `Escape` key dismissal, and precise focus
      restoration to the trigger element upon close.
- **Semantic HTML & Screen Reader Contracts:**
    - Meaningful alternative text (`aria-label`) on all icon-only buttons (close cross, quick action triggers).
    - Descriptive `alt` attributes on all images (`alt=""` for purely decorative illustrations).
    - Dedicated `<label for="...">` uniquely associated with each form control.
    - Announce dynamic toasts and asynchronous loading updates to assistive technologies via polite live regions
      (`aria-live="polite"`).

---

## Output Format

1. **Partial Score:** Start at 100, apply deductions (**blocker −40**, **should-fix −10**, **nit −2.5**), and output the
   score (e.g., `Designer: 90/100`).
2. **List of Anomalies:** Grouped by severity with precise locations (`file:line`), description of the broken rule (UX
   feedback, missing reinforced confirmation, broken 320px responsive boundary, SEO gap, or non-compliant A11y outside
   design system scope), and exact remedy code.
3. **Ergonomic & A11y Debt:** Out-of-diff observations or upstream `@sgdf/ui` limitations to be reported on GitLab
   (informational, zero score deduction).
