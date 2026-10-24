# Registry (Frontend)

[![Build](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/release.yml)
[![CodeQL](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/laucoin/Registry-Frontend/actions/workflows/codeql.yml)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributeurs-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## Ce dépôt 📖

Ce projet est construit avec [Angular](https://angular.dev) (composants standalone, sans NgModules).

Cette application permet la gestion d'un registre virtuel. C'est un frontend qui appelle le backend ; l'authentification
est elle aussi orchestrée par le backend — le navigateur est redirigé vers les endpoints de connexion/déconnexion du
backend et ne dialogue jamais directement avec le fournisseur d'identité.

Consultez la documentation complète [ici](https://doc.laucoin.fr/registry).

Dépôts liés :

- [Backend](https://github.com/laucoin/Registry-Backend.git)
- [Tests E2E](https://github.com/laucoin/Registry-E2E.git)

## Comment l'installer et l'utiliser ? ⚙️

### Prérequis

Il faut installer un environnement Node. Il y a deux possibilités.

#### Node Version Management (recommandé)

1. Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Installer ensuite Node (`^24.15`, la CI tourne sur Node 24 LTS)
    ```shell
    nvm install <version>
    ```

#### Installation classique

1. Installer [Node.js](https://nodejs.org/en/download/)

Ensuite, dans les deux cas, installer [pnpm](https://pnpm.io/installation):

```shell
corepack enable pnpm
```

### Construire et lancer en local

1. Cloner ce dépôt avec :
    ```shell
    git clone https://github.com/laucoin/Registry-Frontend.git
    ```
   OU
    ```shell
    git clone git@github.com:laucoin/Registry-Frontend.git
    ```
2. Se placer dans le répertoire du projet
    ```shell
    cd Registry-Frontend/
    ```
3. Installer les dépendances
    ```shell
    pnpm install
    ```
4. Créer `public/settings/config.json` avec votre configuration
    ```json
    {
        "defaultLanguage": "fr",
        "languages": [
            "fr",
            "en"
        ],
        "logo": {
            "normal": {
                "light": "img/SGDF/logo.svg",
                "dark": "img/SGDF/logo.svg"
            },
            "small": {
                "light": "img/SGDF/small-logo.svg",
                "dark": "img/SGDF/small-logo.svg"
            }
        },
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
5. Créer `public/settings/env.json` avec votre environnement
    ```json
    {
        "production": "<true-for-non-local>",
        "backend": {
            "url": "<backend-url>",
            "noAuthPaths": [
                "/api/v2/authentication/login/uri",
                "/api/v2/authentication/logout/uri",
                "/api/v2/authentication/token",
                "/api/v2/authentication/token/refresh"
            ]
        }
    }
    ```
   Les deux fichiers sont ignorés par git (`public/settings/*.json`) et récupérés à l'exécution : ils peuvent donc être
   remplacés selon l'environnement sans reconstruire l'application.

Vous pouvez maintenant utiliser les scripts suivants. Bon développement !

> Pour utiliser correctement le frontend, il faut aussi démarrer le backend. Pour cela, voir
> le [readme du backend](https://github.com/laucoin/Registry-Backend.git).

#### Lancer l'application en mode développement

Vous pouvez lancer l'application en mode développement, qui permet le rechargement à chaud, avec :

```shell script
pnpm start
```

#### Empaqueter et lancer l'application

L'application peut être construite avec (selon l'environnement cible) :

```shell script
pnpm run build --configuration=development
```

```shell script
pnpm run build --configuration=production
```

Cela produit le fichier `index.html` et toutes les autres ressources dans le répertoire `dist/browser/`.

L'application est alors utilisable via `dist/browser/index.html`, ou servie derrière nginx comme configuré par
le [Dockerfile](Dockerfile) et [nginx.conf](nginx.conf).

#### Génération de code

Lancer `ng generate component component-name` pour générer un nouveau composant. On peut aussi utiliser
`ng generate directive|pipe|service|class|guard|interface|enum|module`.

#### Autres scripts

```shell script
pnpm lint            # eslint (angular-eslint)
pnpm test            # tests unitaires (Vitest), en mode watch
pnpm test:coverage   # tests unitaires en un passage, avec couverture et seuils de angular.json
```

> `pnpm lint`, `pnpm test:coverage` et `pnpm build` sont les vérifications que le
> [workflow Pull Request](.github/workflows/pull-request.yml) exécute ; elles doivent aussi passer avant chaque commit.

#### Pour aller plus loin

- [Documentation](https://angular.dev) d'Angular
- [Référence](https://angular.dev/tools/cli) d'Angular CLI
- [Documentation](https://www.typescriptlang.org/docs/) de TypeScript
- [Documentation](https://ngrx.io/guide/signals) de NgRx Signals
- [Documentation](https://jsverse.gitbook.io/transloco) de Transloco

## Contribuer 💻

La branche `main` contient le code de production.

ATTENTION :

- Tout développement doit être fait sur une branche séparée : chaque changement atteint `main` via une pull request.

Les workflows GitHub Actions constituent la barrière de revue — une pull request doit être verte avant d'être fusionnée :

- **Pull Request** ([pull-request.yml](.github/workflows/pull-request.yml)) — exécute `pnpm lint`, `pnpm test:coverage` et `pnpm build`, puis
  publie une image taguée par branche pour la revue.
- **Dependency Review** ([dependency-review.yml](.github/workflows/dependency-review.yml)) — bloque une pull request qui
  introduit des dépendances vulnérables.
- **Dependency Audit** ([dependency-audit.yml](.github/workflows/dependency-audit.yml)) — `pnpm audit` hebdomadaire du
  lockfile complet, qui repère les vulnérabilités divulguées après la fusion d'une dépendance (Dependency Review ne
  voit que le diff d'une PR).
- **CodeQL** ([codeql.yml](.github/workflows/codeql.yml)) — analyse statique javascript-typescript sur les pull requests,
  les pushes vers `main` et selon un calendrier.
- **Release** ([release.yml](.github/workflows/release.yml), à la fusion vers `main`) — construit et pousse l'image DEV, puis
  Semantic Release dérive la prochaine version des messages de commit, la tague et publie l'image de release ; un job
  de rétention élague les anciennes images. Les messages de commit doivent donc suivre
  [Conventional Commits](https://www.conventionalcommits.org/).
- **Hotfix** ([hotfix.yml](.github/workflows/hotfix.yml)) — pousser un tag correspondant à `*-hotfix-*` (créé à partir d'un
  tag de release existant) construit et pousse une image de hotfix isolée, hors Semantic Release.
- **PR Cleanup** ([pr-cleanup.yml](.github/workflows/pr-cleanup.yml)) — supprime l'image de la branche du registry à
  la fermeture de la pull request.

Avant de contribuer, merci de lire la [documentation](https://doc.laucoin.fr/registry) et notre
[code de conduite](CODE_OF_CONDUCT.md).

## Contributeurs 🧑‍💻

Merci à ces personnes formidables ([légende des emojis](https://allcontributors.org/en/reference/emoji-key/)) :

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

Ce projet suit la spécification [all-contributors](https://github.com/all-contributors/all-contributors).
Les contributions de toute nature sont les bienvenues !
