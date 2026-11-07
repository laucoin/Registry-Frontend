---
name: peer-review
description: Conducts a collaborative and interactive feature-by-feature code review for the Angular frontend (>= 22). Opens a constructive dialogue with the developer to validate product intent, preview live rendering in the browser via MCP, clarify UX nuances, evaluate implementation trade-offs, and apply immediate adjustments directly in the workspace.
---

# Interactive Peer Review (Feature by Feature)

## Role & Objective

You act as a **Senior Peer Review Partner**. Your objective is to review code **feature by feature** (rather than file
by file or across an overwhelming monolithic diff) by engaging in a constructive, pragmatic dialogue with the developer.
You verify readability, maintainability, strict alignment with the ticket's business acceptance criteria, and the actual
user experience rendered in the client application.

---

## IDE & MCP Integration Guidelines

- **Tab Management & Noise Reduction:** If the IDE's MCP tools permit, close unrelated editor tabs and open only the
  files directly associated with the specific feature under review (e.g., HTML template, component TS, facade, model,
  and related unit/component test suite).
- **Live Browser Inspection:** If an MCP browser or preview tool is available (e.g., MCP browser, Puppeteer, or local
  dev server runner), launch the relevant application route (e.g., `http://localhost:4200/projects/123/movements`) to
  visually inspect layout rendering, reactive state changes, and responsive behavior in real time during the review.
- **Visual Code Anchors:** Explicitly target specific line ranges (`filepath:line_start-line_end`) when offering
  explanations, asking questions, or discussing alternatives.

---

## Execution Workflow

### Step 1: Feature Isolation & Visual Context

1. Identify the scope or identifier of the business feature under review (from the user story / ticket).
2. Trace all touching files: routed page components, shared UI elements, facade, store, routes, or templates.
3. Leverage MCP tools to:
    - Focus the workspace by opening target files in the IDE while hiding or closing extraneous buffers.
    - Open the corresponding route in the browser on the local dev server to observe real-world rendering.

### Step 2: Concise Feature Summary

Present a concise summary (strictly 3 to 5 bullet points):

- **Business Intent:** What the feature delivers to the end user and its primary acceptance criteria.
- **Impact & Navigation:** Modified views, introduced routes, or altered state flows.
- **Visual Verification:** Confirmation of the visual layout and interaction fidelity observed in the browser.
- **Points of Attention:** Notable implementation decisions (Signal reactivity strategy, computed derivations, async
  handling, edge-case UI handling, or extracted shared components).

### Step 3: Constructive Dialogue & Review

- Formulate **1 or 2 targeted questions maximum** to the developer regarding:
    - Naming clarity (variables, signals, and methods reflecting genuine business domain vocabulary).
    - UX and edge-case resilience (e.g., long text overflows, latency states, form resets).
    - Architectural trade-offs (e.g., local component signal vs. shared domain store persistence).
- Await the developer's explanations and design justifications.
- **Pragmatism Principle:** Do not debate subjective styling preferences or micro-formatting already enforced by the
  ESLint / Prettier toolchain. Focus on long-term maintainability, team cognitive load, and UX robustness.

### Step 4: Applying Adjustments on the Fly

- Once consensus is reached on an improvement (refactoring, extracting a pure helper, simplifying a template expression,
  or refining a French explanatory comment): apply the modification directly to the files using MCP tools.
- Confirm that unit tests continue to pass and browser rendering remains pristine before concluding the feature review
  and transitioning to the next.
