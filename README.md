# Registry (Frontend)

[![Build](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml)
[![CodeQL](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![ng-zorro-antd](https://img.shields.io/badge/ng--zorro--antd-22-F5222D)](https://ng.ant.design)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## This repository 📖

This project is built with [Angular](https://angular.dev) (standalone components, no NgModules, signals) and
**server-side rendered**: an [Express](https://expressjs.com) server (`src/server.ts`) uses `@angular/ssr` to render
every route on the server before it reaches the browser, then hydrates on the client.

This application allows virtual registry management. This is a frontend which calls the backend; authentication is
brokered by the backend too — the browser is redirected to the backend's own login/logout endpoints and never talks to
the identity provider directly. The session lives in an HttpOnly cookie the frontend never reads.

Runtime configuration (backend URL, organization identity, support/hosting details, ...) is never baked into the
build. `server.ts` reads it from environment variables at process start and serves it to the client over
`GET /api/config`, fetched once at boot via `provideAppInitializer` before the app renders. See
[Runtime configuration](#runtime-configuration) below for the full list of variables.

Checkout the full documentation [here](https://doc.laucoin.fr/registry).

Linked repositories:

- [Backend](https://github.com/laucoin/Registry-Backend.git)
- [E2E tests](https://github.com/laucoin/Registry-E2E.git)

## How to install and use it? ⚙️

### Prerequisites

You need to install a Node environment. To do that there are 2 possibilities.

#### Node Version Management (recommended)

1. Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Then install node (`^24`, matches the Dockerfile's `node:24-slim` builder / `nodejs24` distroless runtime)
    ```shell
    nvm install <version>
    ```

#### Classic installation

1. Install [Node.js](https://nodejs.org/en/download/)

Then, in both cases, install [pnpm](https://pnpm.io/installation) (version pinned via `packageManager` in
`package.json` — `corepack` picks it up automatically, no separate install needed):

```shell
corepack enable
```

### Build and run locally

1. Clone this repository with:
    ```shell
    git clone https://github.com/laucoin/Registry-Frontend.git
    ```
   OR
    ```shell
    git clone git@github.com:laucoin/Registry-Frontend.git
    ```
2. Move into the project directory
    ```shell
    cd Registry-Frontend/
    ```
3. Install dependencies
    ```shell
    pnpm install
    ```
4. Copy `.env.example` to `.env` and fill it in:
    ```shell
    cp .env.example .env
    ```

   `.env` is gitignored and read once by `server.ts` at startup — nothing here is compiled into the build. In
   production these are set on the host/container itself (Docker, PM2, ...) instead of a committed `.env` file.

#### Runtime configuration

| Variable                                             | Required?                  | Holds                                                                                                                                                                                                          |
|-------------------------------------------------------|----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `BACKEND_URL`                                        | Yes                         | Base URL of the backend API.                                                                                                                                                                                  |
| `NG_ALLOWED_HOSTS`                                   | Yes, in practice            | Comma-separated hostnames (no port, no scheme) Angular's built-in SSRF guard accepts a `Host` header for. Empty/unset rejects **every** request, including the app's own same-origin `/api/config` self-fetch on boot — set this even to load the login page locally (e.g. `localhost`). |
| `ORGANIZATION_NAME` / `ORGANIZATION_WEBSITE`         | Name yes, website no        | The organization this instance is deployed for (Registry is a multi-tenant SaaS — SGDF is only the origin use case, not a hardcoded assumption). Shown on the login screen and throughout the legal pages.  |
| `CREATOR_NAME` / `CREATOR_WEBSITE` / `CREATOR_EMAIL` | Name + email yes, website no | Copyright notice in the footer, and the login screen / legal pages.                                                                                                                                          |
| `HOSTING_PROVIDER_NAME` / `HOSTING_PROVIDER_ADDRESS` | No                          | Displayed in the `/terms` and `/privacy` legal notices (hébergeur). Missing just shows a fallback message.                                                                                                    |
| `SUPPORT_ISSUES_URL`                                 | No                          | Repository issues URL, linked from the "Support" entry in the footer. Left unset, the link is hidden.                                                                                                        |

A missing *required* variable crashes the server loudly at startup rather than silently booting misconfigured.

Now, you can use the following scripts. Enjoy !

> To use the frontend properly, you need to start the backend too. To do that refer to
> the [backend readme](https://github.com/laucoin/Registry-Backend.git).

#### Running the application in dev mode

You can run your application in dev mode that enables live coding (with SSR) using:

```shell script
pnpm start
```

This runs `ng serve` on `http://localhost:4200` — it requires the backend running and `NG_ALLOWED_HOSTS` set (see
above), otherwise every request 400s, including the app's own boot.

#### Packaging and running the application

The application can be built using (depending your target environment):

```shell script
pnpm run build --configuration=development
```

```shell script
pnpm run build --configuration=production
```

It produces `dist/registry-frontend/browser/` (static client assets) and `dist/registry-frontend/server/` (the
Express/Angular-SSR entry point, `server.mjs`).

Run the compiled server with:

```shell script
pnpm run serve:ssr:registry-frontend
```

It listens on `http://localhost:4000` by default (override with the `PORT` environment variable), or is served as
configured by the [Dockerfile](Dockerfile).

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use
`ng generate directive|pipe|service|class|guard|interface|enum`.

#### Other scripts

```shell script
pnpm test   # vitest (@angular/build:unit-test)
pnpm lint   # eslint (angular-eslint)
```

#### Docker

```shell script
docker build .
```

Multi-stage build: `node:24-slim` (install + `ng build`) → `gcr.io/distroless/nodejs24-debian12:nonroot` runtime
(uid 65532, no shell, no package manager). The build stage sets throwaway placeholder env vars purely so `ng build`'s
internal route-extraction step (which briefly boots `server.ts`) doesn't abort on a missing required variable — real
configuration is supplied at `docker run` time via the variables listed in
[Runtime configuration](#runtime-configuration).

#### Further help

- Angular [documentation](https://angular.dev)
- Angular CLI [reference](https://angular.dev/tools/cli)
- TypeScript [documentation](https://www.typescriptlang.org/docs/)
- NgRx Signals [documentation](https://ngrx.io/guide/signals)
- ng-zorro-antd [documentation](https://ng.ant.design)
- Transloco [documentation](https://jsverse.github.io/transloco/)

## Contributing 💻

The `main` branch contain the production code.

WARNING :

- Any development must be done on a separate branch: every change reaches `main` through a pull request.

The GitHub Actions workflows are the review gate — a pull request must be green before merge:

- **Pull Request** ([pull-request.yml](.github/workflows/pull-request.yml)) — runs `pnpm lint` and `pnpm build`, then
  publishes a branch-tagged image for review.
- **Dependency Review** ([dependency-review.yml](.github/workflows/dependency-review.yml)) — blocks a pull request that
  introduces vulnerable dependencies.
- **Dependency Audit** ([dependency-audit.yml](.github/workflows/dependency-audit.yml)) — weekly `pnpm audit` of the
  full lockfile, catching vulnerabilities disclosed after a dependency was already merged in (Dependency Review only
  ever sees a PR's diff).
- **CodeQL** ([codeql.yml](.github/workflows/codeql.yml)) — javascript-typescript static analysis on pull requests,
  pushes to `main` and on a schedule.
- **Release** ([release.yml](.github/workflows/release.yml), on merge to `main`) — builds & pushes the DEV image, then
  Semantic Release derives the next version from the commit messages, tags it and publishes the release image; a
  retention job prunes old images. Commit messages must therefore follow
  [Conventional Commits](https://www.conventionalcommits.org/).
- **Hotfix** ([hotfix.yml](.github/workflows/hotfix.yml)) — pushing a tag matching `*-hotfix-*` (branched off an
  existing release tag) builds & pushes an isolated hotfix image, outside Semantic Release.
- **PR Cleanup** ([pr-cleanup.yml](.github/workflows/pr-cleanup.yml)) — deletes the branch image from the registry when
  the pull request closes.

Before contributing, please read the [documentation](https://doc.laucoin.fr/registry), our
[code of conduct](CODE_OF_CONDUCT.md) and our [security policy](SECURITY.md).

## Contributors 🧑‍💻

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/en/reference/emoji-key/)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://doc.laucoin.fr/"><img src="https://avatars.githubusercontent.com/u/31480129?v=4?s=100" width="100px;" alt="Luc AUCOIN"/><br /><sub><b>Luc AUCOIN</b></sub></a><br /><a href="#projectManagement-laucoin" title="Project Management">📆</a> <a href="#ideas-laucoin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/laucoin/Registry-Frontend/commits?author=laucoin" title="Code">💻</a> <a href="#maintenance-laucoin" title="Maintenance">🚧</a> <a href="#infra-laucoin" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lvicainne"><img src="https://avatars.githubusercontent.com/u/1641160?v=4?s=100" width="100px;" alt="Louis VICAINNE"/><br /><sub><b>Louis VICAINNE</b></sub></a><br /><a href="#infra-lvicainne" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-lvicainne" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ctruillet"><img src="https://avatars.githubusercontent.com/u/43933447?v=4?s=100" width="100px;" alt="Clément Truillet"/><br /><sub><b>Clément Truillet</b></sub></a><br /><a href="#ideas-ctruillet" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Usinouv"><img src="https://avatars.githubusercontent.com/u/13047412?v=4?s=100" width="100px;" alt="Usinouv"/><br /><sub><b>Alexandre D'HONT</b></sub></a><br /><a href="#ideas-Usinouv" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/c%C3%A9cile-crochon/"><img src="https://avatars.githubusercontent.com/u/0?v=4&s=100" width="100px;" alt="Cécile CROCHON"/><br /><sub><b>Cécile CROCHON</b></sub></a><br /><a href="#projectManagement-crochon" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!
