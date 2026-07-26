# Branding the authentik login flow

The Registry never renders a login form. `sessionStore.login()`
(`app/stores/session.ts`) sends the browser to `/auth/login`, which builds an
OIDC authorize URL (`server/routes/auth/login.get.ts`) and hands off to
authentik. Everything the user sees between clicking **Se connecter** and coming
back is therefore styled *in authentik*, not here.

This directory holds the stylesheet for that hop, so the redirect does not jump
from the SGDF palette to a stock dark card on a stock photograph.

Nothing here is applied automatically — it has to be pasted into the authentik
admin by someone who can log in there.

## Steps

1. **Admin → System → Brands → *(your brand)***.
2. Set **Default UI theme** to **Light**. This matters more than any CSS: the
   flow currently renders with `theme="dark"` on the executor, and authentik
   assigns its dark colour tokens *inside* the shadow roots, where a stylesheet
   cannot override them cleanly. The sheet in `authentik-brand.css` assumes the
   light theme is already active.
3. Set **Logo** to `public/brand/defaults/logo.svg` — the **navy-on-transparent**
   cut of the mark. The white cut beside it (`logo-white.svg`) is right for the
   app's navy panel and wrong for authentik's white card.
4. Paste the contents of [`authentik-brand.css`](./authentik-brand.css) into
   **Custom CSS**.
5. Optionally replace the flow background (the default road photograph):
   **Flows & Stages → Flows → `default-authentication-flow` → Background**.
   A plain `#f4f7f9` field or an SGDF photograph both work; the card is opaque
   either way.

## What was verified, and what was not

Read off the running instance (**authentik 2026.8.0**) so the stylesheet targets
real selectors rather than guessed ones:

- The flow UI is PatternFly inside nested shadow roots — `ak-flow-executor` →
  `ak-stage-identification` → `ak-flow-card` — styled via `adoptedStyleSheets`
  (9 sheets on the executor, 5 on the card).
- CSS custom properties **do** cross the shadow boundary: setting
  `--pf-global--BorderRadius--sm` from the document changed the submit button's
  radius.
- Colours **do not** yield that way. `.pf-c-login` inside the shadow assigns
  `--pf-c-login__main--BackgroundColor` from authentik's own
  `--ak-c-login__main--BackgroundColor`, so a value inherited from `:root` loses
  to one assigned on an element inside. Setting the `--ak-c-*` token from the
  document did not move it either.
- Confirmed class names: `.pf-c-login__main`, `.pf-c-login__header`,
  `.pf-c-login__footer`, `.pf-c-login__main-header.pf-c-brand`,
  `img.branding-logo`, `h1.pf-c-title.pf-m-3xl`, `.pf-c-form`,
  `.pf-c-form__group`, `.pf-c-form__label`, `.pf-c-form__label-text`,
  `input.pf-c-form-control`, `button.pf-c-button.pf-m-primary.pf-m-block`.

**Not verified:** that the Brand *Custom CSS* field reaches inside those shadow
roots. That is the assumption the whole stylesheet rests on — authentik injects
brand CSS into the shadow roots, which is why the rules are written as ordinary
class selectors. It could not be tested from outside the admin.

If pasting the sheet changes **nothing at all**, that assumption is what failed,
and the sheet needs rewriting against the `--ak-c-*` token layer instead. Report
what you see and it can be redone.

## Fonts

Deliberately left alone. Matching Sarabun/Raleway in authentik means either an
external `@import` from a font CDN — a third-party dependency on the login path,
the exact thing `font-src 'self'` in `server/plugins/security.ts` exists to
avoid — or uploading the woff2 files from `app/assets/fonts/` into authentik's
media and writing `@font-face` rules against them. The second is the better
option if the type match matters; neither is worth doing before the colours and
shapes are confirmed to apply at all.

## Keeping the two ends in step

The colour values in `authentik-brand.css` are duplicated from
`app/assets/css/design.css` and `config/config.json` — there is no shared source
of truth across the two systems. If the brand navy, the field border or the
canvas tint changes in the app, change it here too.
