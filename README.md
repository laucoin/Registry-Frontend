# Registry (Frontend)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## This repository 📖

This project was generated with [Angular CLI](https://github.com/angular/angular-cli).

This application allows virtual registry management. This is a frontend which call the
backend (https://gitlab.com/laucoin/registry-backend.git).

## How to install and use it? ⚙️

### Prerequisites

You need to install a Node environment. To do that there are 2 possibilities.

#### Node Version Management (recommended)

1. Install [NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
2. Then install node (`>= v21.1.0`)
    ```shell
    nvm install <version>
    ```

#### Classic installation

1. Install [Node.js](https://nodejs.org/en/download/)
2. Install [Angular CLI](https://cli.angular.io/)

### Build and run locally

1. Clone this repository with:
    ```shell
    git clone https://gitlab.com/laucoin/registry-frontend.git
    ```
   OR
    ```shell
    git clone git@gitlab.com:laucoin/registry-frontend.git
    ```
2. Move into the project directory
    ```shell
    cd registry-frontend/
    ```
3. Install dependencies
    ```shell
    npm install
    ```
   OR
    ```shell
    npm i
    ```
4. Duplicate and rename [environment.development.ts](src/environments/environment.development.ts) to `environment.local.ts` and setup
   your environment config
5. Now, you can use the following scripts. Enjoy !

> To use the frontend properly, you need to start the backend too. To do that refer to
> the [backend readme](https://gitlab.com/laucoin/registry-backend.git).

#### Running the application in dev mode

You can run your application in dev mode that enables live coding using:

```shell script
npm start
```

#### Packaging and running the application

The application can be build using (depending your target environment):

```shell script
npm run build --configuration=development
```

```shell script
npm run build --configuration=production
```

It produces the `index.html` file and all the other resources in the `dist/browser/` directory.

The application is now usable using `dist/browser/index.html`.

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also
use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

#### Further help

- Angular [documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- Angular CLI [guide](https://angular.io/cli)
- TypeScript [documentation](https://www.typescriptlang.org/docs/)
- Sheriff's [repository](https://github.com/softarc-consulting/sheriff)
- PrimeNg's [documentation](https://primeng.org/)

## Contributing 💻

The `main` branch contain the production code.
The `develop` branch contain the development code.

WARNING :

- Any development must be done on a separate branch.
- It is strictly forbidden to merge a branch other than `develop` on `main`.

If you have more question, please have a look
on [contributing file](https://gitlab.com/laucoin/global-readme/-/blob/main/CONTRIBUTING.md)

## Contributors 🧑‍💻

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<table>
  <tbody>
    <tr>
      <td><div style='text-align: center'><a href="https://laucoin.fr"><img src="https://gitlab.com/uploads/-/system/user/avatar/4656880/avatar.png?width=400" width="100px;" alt="Luc AUCOIN"/><br /><sub><b>Luc AUCOIN</b></sub></a><br /><a href="https://gitlab.com/laucoin/registry-frontend/commits?author=laucoin" title="Code">💻</a> <a href="https://gitlab.com/laucoin/registry-frontend/commits?author=laucoin" title="Documentation">📖</a> <a href="#" title="Maintenance">🚧</a> <a href="#" title="Project Management">📆</a> <a href="https://gitlab.com/laucoin/registry-frontend/commits?author=laucoin" title="Tests">⚠️</a></div></td>
    </tr>
  </tbody>
</table>

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

