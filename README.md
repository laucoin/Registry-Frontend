# Registry (Frontend)

[![Build](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml)
[![Tests](https://github.com/laucoin/Registry-Frontend/actions/workflows/tests.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/laucoin/Registry-Frontend/branch/main/graph/badge.svg)](https://app.codecov.io/gh/laucoin/Registry-Frontend)
[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)](https://nuxt.com)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)

## This repository 📖

This project is built with [Nuxt](https://nuxt.com) (Vue 3, SSR).

This application allows virtual registry management. This is a frontend which calls the backend and acts as its OIDC
client (BFF): authentication is handled server-side and the browser only ever holds a sealed session cookie.

Checkout the full documentation [here](https://doc.laucoin.fr/registry).

Linked repositories:

- [Backend](https://github.com/laucoin/Registry-Backend.git)
- [E2E tests](https://github.com/laucoin/Registry-E2E.git)

## How to install and use it? ⚙️

### Prerequisites

You need to install a Node environment. To do that there are 2 possibilities.

#### Node Version Management (recommended)

1. Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Then install node (`>= v22`)
    ```shell
    nvm install <version>
    ```

#### Classic installation

1. Install [Node.js](https://nodejs.org/en/download/)

Then, in both cases, install [pnpm](https://pnpm.io/installation):

```shell
corepack enable pnpm
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
4. Create your environment file from the template and fill in the secrets
    ```shell
    cp .env.example .env
    ```
    ```dotenv
    NUXT_REGISTRY_BASE_URL=http://localhost:8081
    NUXT_IDP_ISSUER=http://localhost:8080/realms/laucoin
    NUXT_IDP_CLIENT_ID=registry-web
    NUXT_IDP_CLIENT_SECRET=<keycloak-client-secret>
    NUXT_SESSION_SECRET=<openssl rand -base64 32>
    NUXT_PRODUCTION=false
    NUXT_PUBLIC_LEGAL_HOSTING_NAME=<hosting provider, e.g. OVH SAS>
    NUXT_PUBLIC_LEGAL_HOSTING_ADDRESS=<its postal address>
    NUXT_PUBLIC_LEGAL_HOSTING_PHONE=<its phone number>
    ```
   The three `LEGAL_HOSTING` values feed the "Hébergeur" section of `/legal`, which French law (LCEN art. 6 III)
   requires to name the host, its address and its phone number. They are public (rendered on a public page). Leave them
   empty in development: the section then states that the details are not configured instead of rendering blank.
   **With `NUXT_PRODUCTION=true` all three are mandatory** — a missing or blank value aborts startup with the list of
   offending variables, the same fail-fast contract as a malformed `config.json`, so a deploy can never serve an
   incomplete legal notice.
5. Adjust [config.json](config/config.json) to your configuration (validated at boot; the server refuses to start on a
   bad file)
    ```json
    {
        "defaultLanguage": "fr",
        "languages": ["fr", "en"],
        "theme": {
            "colorPrimary": "#003a5d",
            "colorInfo": "#0073b4",
            "borderRadius": 10,
            "dark": {
                "colorPrimary": "#6ddcff"
            }
        },
        "assets": {},
        "enabledActions": [ "<element-action>" ],
        "notification": {
            "duration": {
                "info": 5000,
                "success": 3000,
                "warn": 8000,
                "error": 15000
            }
        }
    }
    ```

Now, you can use the following scripts. Enjoy !

> To use the frontend properly, you need to start the backend too (Spring on `:8081`)
> and Keycloak (`:8080`, realm `laucoin`, client `registry-web`). To do that refer to
> the [backend readme](https://github.com/laucoin/Registry-Backend.git).

#### Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
pnpm dev
```

Note: CSP is disabled in dev mode (Vite HMR needs it); use a production build to check CSP, SSR style extraction and
sealed cookies.

#### Packaging and running the application

The application can be built using:

```shell script
pnpm build
```

It produces the server bundle and all the other resources in the `.output/` directory.

The application is now runnable using:

```shell script
pnpm start
```

#### Other scripts

```shell script
pnpm lint   # eslint
pnpm test   # vitest (includes the axe a11y gate)
```

#### Deployment model

One immutable image (`Dockerfile`); per-environment values are injected at deploy time:

- `NUXT_*` env vars — server-only wiring & secrets (internal API URL, OIDC client, session key). Never reach the
  browser.
- `config.json` (path via `NUXT_APP_CONFIG_PATH`) — designer-owned presentation payload: theme seed tokens (+ `dark`
  overrides), brand-asset overrides, languages, enabled actions.

#### Further help

- Nuxt [documentation](https://nuxt.com/docs)
- Vue [documentation](https://vuejs.org/guide/introduction.html)
- TypeScript [documentation](https://www.typescriptlang.org/docs/)
- Ant Design Vue [documentation](https://antdv.com/components/overview)
- Pinia [documentation](https://pinia.vuejs.org/)
- Nuxt i18n [documentation](https://i18n.nuxtjs.org/)

## Contributing 💻

The `main` branch contain the production code.

WARNING :

- Any development must be done on a separate branch: every change reaches `main` through a pull request.

The GitHub Actions workflows are the review gate — a pull request must be green before merge:

- **Pull Request** ([pull-request.yml](.github/workflows/pull-request.yml)) — runs `pnpm lint` and `pnpm test`, then
  publishes a branch-tagged image for review.
- **Dependency Review** ([dependency-review.yml](.github/workflows/dependency-review.yml)) — blocks a pull request that
  introduces vulnerable dependencies.
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

Before contributing, please read the [documentation](https://doc.laucoin.fr/registry/) and our
[code of conduct](CODE_OF_CONDUCT.md).

## Contributors 🧑‍💻

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/en/reference/emoji-key/)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://doc.laucoin.fr/"><img src="https://avatars.githubusercontent.com/u/31480129?v=4?s=100" width="100px;" alt="Luc AUCOIN"/><br /><sub><b>Luc AUCOIN</b></sub></a><br /><a href="#projectManagement-laucoin" title="Project Management">📆</a> <a href="#ideas-laucoin" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/laucoin/Registry-Frontend/commits?author=laucoin" title="Code">💻</a> <a href="#maintenance-laucoin" title="Maintenance">🚧</a> <a href="#infra-laucoin" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Usinouv"><img src="https://avatars.githubusercontent.com/u/13047412?v=4?s=100" width="100px;" alt="Usinouv"/><br /><sub><b>Usinouv</b></sub></a><br /><a href="#ideas-Usinouv" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lvicainne"><img src="https://avatars.githubusercontent.com/u/1641160?v=4?s=100" width="100px;" alt="Louis VICAINNE"/><br /><sub><b>Louis VICAINNE</b></sub></a><br /><a href="#infra-lvicainne" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-lvicainne" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ctruillet"><img src="https://avatars.githubusercontent.com/u/43933447?v=4?s=100" width="100px;" alt="Clément Truillet"/><br /><sub><b>Clément Truillet</b></sub></a><br /><a href="#ideas-ctruillet" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="[https://github.com/ctruillet](https://www.linkedin.com/in/c%C3%A9cile-crochon/)"><img src="https://media.licdn.com/dms/image/v2/C4D03AQEWB-ofOcjZ7A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1626700975351?e=1787184000&v=beta&t=mfq6na-TuTZL4pA-0ivIHpnDBxOUjKQ0_I1KSuxhIrQ" width="100px;" alt="Cécile Crochon"/><br /><sub><b>Cécile Crochon</b></sub></a><br /><a href="#projectManagement-ccrochon" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

To add a contributor, either comment on an issue/PR with
`@all-contributors please add @<username> for <contributions>` (bot), or run:

```shell script
pnpm contributors:add <username> <contributions>
```
