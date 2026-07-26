# Accessibility checklist (ADR 015 — WCAG 2.2 AA)

The rewrite targets WCAG 2.2 AA, enforced by the axe gate in the E2E suite (`Registry-E2E/tests/accessibility.spec.ts`,
Nuxt target only). The gate fails on **serious/critical** violations. This file tracks the remaining gaps and
per-component notes ADR 015 calls for.

## Automated gate

- axe-core via `@axe-core/playwright`, tags `wcag2a/aa`, `wcag21a/aa`, `wcag22a/aa`.
- Runs over: home, projects list, users list, a project workspace shell + a scoped domain (participants), the
  participant create form, and the legal/privacy/accessibility pages.
- **No disabled rules.** The two former waivers (`aria-required-attr`, `aria-valid-attr-value`) are gone — see below.
  Do not re-add a waiver to make a scan pass; fix the markup or the patch.

## Ant Design combobox internals — fixed at the source

ADR 013 accepted "AntD is not ARIA-first" as a cost, and the gate waived two rules for it. That waiver is now retired:
`patches/ant-design-vue@4.2.6.patch` (pnpm `patchedDependencies`, `pnpm-workspace.yaml`) fixes three defects in
`vc-select`, in both the `es/` and `lib/` builds:

1. The inner `role="combobox"` input **omitted `aria-expanded` entirely** while closed — `vc-select` leaves `open`
   undefined until the first interaction and Vue drops undefined attributes. Now `!!open`, so it is always concrete.
   (This was the real `aria-required-attr` cause — it was never the DatePicker, as the old statement claimed.)
2. That same input pointed `aria-owns` / `aria-controls` / `aria-activedescendant` at `${id}_list` ids that only exist
   once the dropdown has rendered. Now tied to `open`, so every reference resolves whenever it is present.
3. The **visible** option rows carried `aria-selected` on a `div` with no role. AntD renders the real semantics in a
   separate visually-hidden `role="listbox"`; the virtual list is presentational, so the stray attribute is dropped
   rather than given a role (adding `role="option"` there only trades the violation for `aria-required-parent`).

Guarded by `tests/components/antd-combobox-a11y.test.ts` — it fails fast, without a browser, if a dependency bump drops
the patch. The pinned exact version (`ant-design-vue: 4.2.6`) means pnpm errors rather than silently skipping.

Revisit if AntD fixes this upstream; the patch can then be dropped.

## Labelling AntD pickers

`DatePicker` / `TimePicker` forward only `id` to their inner `<input>` and **silently drop `aria-label` /
`aria-labelledby`**. Several call sites relied on `:aria-label` and were therefore effectively unlabelled (announced
from the placeholder alone, which also disappears once a value is picked). Every picker now takes `id` + a real
`<label for>` — visible where the layout has one, `.sr-only` otherwise:

- `CustomDateTimeField` — takes a `label` prop and composes "&lt;field&gt; — &lt;part&gt;" per input, ids from `useId()`
  so the several instances a form holds stay unique and SSR-stable.
- `project/Form.vue` — the four begin/end date-time pickers.
- `GuestMovementDrawer` — the per-guest birthday picker, numbered by row.
- `CommunicationThread` — the compose timestamp.

## Colour contrast (both modes)

The AA contrast pass is done and **gated in both light and dark modes** (the populated-list test loads `/users` under
each mode via the theme cookie and scans). Fixes:

- **Muted text** — explicit `colorTextDescription` token, overridden per mode (`config/config.json`; AntD's default ≈
  3.3:1 fails AA).
- **Dark-mode links** — `colorLink` dark override (`#40a9ff`); the derived link on the dark layout fell ≈ 3.2:1.
- **Status/category tags** — AntD's tinted preset tags (green/red/blue…) render ≈ 3.4:1; replaced everywhere with
  AA-safe SOLID colours from `app/utils/statusColors.ts` (`STATUS_COLOR`), white text on a dark fill, AA by
  construction in both modes.
- **Focus ring on the header** (2.4.7 / 1.4.11) — the global ring is `--focus: var(--primary)`, and in *light* mode
  `--primary` and the bar's `--brand` are the same navy, so every header control drew an invisible 1:1 ring. The header
  and its mobile drawer now force `outline-color: #fff`.

## WCAG 2.2 additions

- **2.4.11 Focus Not Obscured (Minimum)** — `.app-header` is sticky, so scroll-into-view could slide a newly focused
  control under it. `html { scroll-padding-top: 72px }` (the bar's height) keeps focus clear.
- **2.5.8 Target Size (Minimum)** — `.icon-btn` (34px) already cleared 24×24. Header nav links were ~22px tall and are
  now `min-height: 24px`; AntD's inline clear / tag-close / modal-close glyphs get a 24×24 minimum hit area.
- **3.3.7 Redundant Entry** — reviewed: the only multi-step form (`project/Form.vue`, Informations → Options) does not
  re-ask for anything entered in an earlier step.
- **1.4.10 Reflow** — `responsive.css` holds the 320px floor (list rows stack, drawers go full-width).

## Component notes

- **Theme / language pickers (shell header):** native `<select>` + visually hidden `<label>` (ADR 015 "native elements
  first") — no combobox aria gap.
- **Clickable list rows** (`dashboard/Overview.vue`, `dashboard/CurrentMovementList.vue`): `role="button"` +
  `tabindex="0"` + `aria-label`, activating on **both** Enter and Space, as a native button does.
- **Skip link, landmarks, focus-on-route-change:** shell (`layouts/default.vue`), covered by
  `tests/components/skip-link.test.ts`.
- **`.sr-only`** is global (`app/assets/css/design.css`) — it was duplicated in two components before.

## Still to do (not yet automated)

- **Manual keyboard-only pass and screen-reader (NVDA / VoiceOver) on the critical journeys.** This is the one item
  still holding the public statement at "partially compliant": axe covers only a fraction of the AA criteria
  mechanically, so no amount of green CI can substitute for it.
- axe assertions on each remaining domain's write surface as it is built.
