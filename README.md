# Registry (Frontend)

[![Build](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml)
[![CodeQL](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-22-0EA5E9)](https://primeng.org)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## This repository 📖

This project is built with [Angular](https://angular.dev) (standalone components, no NgModules).

This application allows virtual registry management. This is a frontend which calls the backend; authentication is
brokered by the backend too — the browser is redirected to the backend's own login/logout endpoints and never talks to
the identity provider directly.

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
4. Create `public/settings/config.json` with your configuration
    ```json
    {
        "defaultLanguage": "fr",
        "languages": [
            "fr",
            "en"
        ],
        "primeNg": {
            "semantic": {
                "primary": {
                    "50": "#eef9ff",
                    "100": "#dcf4ff",
                    "200": "#b2ebff",
                    "300": "#6ddcff",
                    "400": "#20cbff",
                    "500": "#00b5ff",
                    "600": "#0091df",
                    "700": "#0073b4",
                    "800": "#006295",
                    "900": "#00507a",
                    "950": "#003a5d"
                },
            "colorScheme": {
                "light": {
                    "primary": {
                        "color": "#003a5d",
                        "contrastColor": "#eef9ff",
                        "hoverColor": "#00507a",
                        "activeColor": "#006295"
                    },
                    "highlight": {
                        "background": "#003a5d",
                        "focusBackground": "#0073b4",
                        "color": "#ffffff",
                        "focusColor": "#ffffff"
                    }
                },
                "dark": {
                    "primary": {
                        "color": "#eef9ff",
                        "contrastColor": "#003a5d",
                        "hoverColor": "#dcf4ff",
                        "activeColor": "#b2ebff"
                    },
                    "highlight": {
                        "background": "rgba(250, 250, 250, .16)",
                        "focusBackground": "rgba(250, 250, 250, .24)",
                        "color": "rgba(255,255,255,.87)",
                        "focusColor": "rgba(255,255,255,.87)"
                    }
                }
            }
            },
            "components": {
                "card": {
                    "body": {
                        "padding": "1rem"
                    }
                },
                "dataview": {
                    "root": {
                        "borderWidth": "0"
                    },
                    "header": {
                        "padding": "0"
                    }
                },
                "menu": {
                    "item": {
                        "padding": "0"
                    }
                },
                "popover": {
                    "content": {
                        "padding": "0"
                    }
                },
                "tabs": {
                    "tabpanel": {
                        "padding": "1rem 0"
                    }
                }
            }
        },
        "logo": {
            "normal": {
                "light": "img/SGDF/logo-white.svg",
                "dark": "img/SGDF/logo-white.svg"
            },
            "small": {
                "light": "img/SGDF/small-logo-white.svg",
                "dark": "img/SGDF/small-logo-white.svg"
            }
        },
        "enabledActions": [ "<element-action.enum.ts>" ],
        "notification": {
            "duration": {
                "info": 5000,
                "success": 3000,
                "warn": 8000,
                "error": 15000,
                "secondary": 5000,
                "contrast": 5000
            }
        }
    }
    ```
5. Create `public/settings/env.json` with your environment
    ```json
    {
        "production": "<true-for-non-local>",
        "backend": {
            "url": "<backend-url>",
            "noAuthPaths": [
                "/api/v1/authentication/login/uri",
                "/api/v1/authentication/logout/uri",
                "/api/v1/authentication/token",
                "/api/v1/authentication/token/refresh"
            ]
        }
    }
    ```
   Both files are gitignored (`public/settings/*.json`) and fetched at runtime, so they can be swapped per environment
   without rebuilding the app.

Now, you can use the following scripts. Enjoy !

> To use the frontend properly, you need to start the backend too. To do that refer to
> the [backend readme](https://github.com/laucoin/Registry-Backend.git).

#### Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
pnpm start
```

#### Packaging and running the application

The application can be built using (depending your target environment):

```shell script
pnpm run build --configuration=development
```

```shell script
pnpm run build --configuration=production
```

It produces the `index.html` file and all the other resources in the `dist/browser/` directory.

The application is now usable using `dist/browser/index.html`, or served behind nginx as configured by
the [Dockerfile](Dockerfile) and [nginx.conf](nginx.conf).

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use
`ng generate directive|pipe|service|class|guard|interface|enum|module`.

#### Other scripts

```shell script
pnpm lint   # eslint (angular-eslint)
```

> There is no automated test suite yet — `pnpm lint` and `pnpm build` are the only checks the
> [Pull Request workflow](.github/workflows/pull-request.yml) runs today.

#### Further help

- Angular [documentation](https://angular.dev)
- Angular CLI [reference](https://angular.dev/tools/cli)
- TypeScript [documentation](https://www.typescriptlang.org/docs/)
- NGXS [documentation](https://www.ngxs.io/)
- PrimeNG [documentation](https://primeng.org/)
- ngx-translate [documentation](https://github.com/ngx-translate/core)

## Contributing 💻

The `main` branch contain the production code.

WARNING :

- Any development must be done on a separate branch: every change reaches `main` through a pull request.

The GitHub Actions workflows are the review gate — a pull request must be green before merge:

- **Pull Request** ([pull-request.yml](.github/workflows/pull-request.yml)) — runs `pnpm lint` and `pnpm build`, then
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

Before contributing, please read the [documentation](https://doc.laucoin.fr/registry) and our
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
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lvicainne"><img src="https://avatars.githubusercontent.com/u/1641160?v=4?s=100" width="100px;" alt="Louis VICAINNE"/><br /><sub><b>Louis VICAINNE</b></sub></a><br /><a href="#infra-lvicainne" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-lvicainne" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ctruillet"><img src="https://avatars.githubusercontent.com/u/43933447?v=4?s=100" width="100px;" alt="Clément Truillet"/><br /><sub><b>Clément Truillet</b></sub></a><br /><a href="#ideas-ctruillet" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Usinouv"><img src="https://avatars.githubusercontent.com/u/13047412?v=4?s=100" width="100px;" alt="Usinouv"/><br /><sub><b>Alexandre D'HONT</b></sub></a><br /><a href="#ideas-Usinouv" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/c%C3%A9cile-crochon/"><img src="https://media.licdn.com/dms/image/v2/C4D03AQEWB-ofOcjZ7A/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1626700975351?e=1789603200&v=beta&t=Vj9eWZiVoCro7Lg-L3ewYLOaB3lXejJ8NLNP-LiXkhk" width="100px;" alt="Cécile CROCHON"/><br /><sub><b>Cécile CROCHON</b></sub></a><br /><a href="#projectManagement-crochon" title="Project Management">📆</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!
