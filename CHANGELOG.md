## [2.0.0](https://github.com/laucoin/Registry-Frontend/compare/1.7.0...2.0.0) (2026-11-15)

### ⚠ BREAKING CHANGES

* NGXS, zone.js, Bootstrap, ngx-translate and Karma are removed in favor of @ngrx/signals, zoneless change detection, Tailwind CSS v4, Transloco and Vitest.

* refactor(api)!: follow the backend API v2 contract
* the frontend requires the backend API v2 and no longer works against v1.

* feat(ui): rebuild the shell and the forms on @sgdf/ui and remove PrimeNG

* feat(projects): add the dashboards, invitations, timelines, soft delete, sortable url-driven lists and the new configuration features

Add the project home and global home dashboards, the monitoring pages, email invitations, participant, vehicle and activity timelines, two-step group creation, soft delete and restore authorities, the movement date search, sorting and automatic search of the lists with filters kept in the url, the user data export and the typed confirmation of destructive actions.

* feat(seo): translate the route titles and metadata, add English and mark the pages with test ids

* refactor(pages): split the pages and shared components, lazy load the routes and reach the browser through BrowserService

* test: cover the stores, facades and components through component harnesses

* docs(conventions): move the agent conventions into the review skills and write the documentation in French

* chore(docker): restrict the CSP connect-src to the backend origin read from env.json when the container starts

* fix(ui): fix the error display, the 320px layout, the keyboard access and the project and profile edge cases

* chore(deps): upgrade Angular to 22.2, angular-eslint to 22.6, eslint to 10.14 and typescript-eslint to 8.72

Claude-Session: https://claude.ai/code/session_01KfU3BnaDS7d1WdYujnh8Kd

* chore(ci): upgrade cycjimmy/semantic-release-action to v8

Claude-Session: https://claude.ai/code/session_01KfU3BnaDS7d1WdYujnh8Kd

* chore(deps): require Node 26 or later through engines and .nvmrc

* fix(movements): stop sending a blank search text when looking for participants and groups

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(projects): show the backend error inside the project form instead of a toast

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(lists): name every list after its page and show the empty message of the groups on their list

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(invitations): title the empty invitations list with its own message

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(groups): show no member instead of one member on an empty group

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(lists): drop the rows a reload no longer returns instead of keeping them on screen

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(alerts): let a message that opens a new alert be saved without a movement or an existing alert

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(alerts): refresh the open alerts of the dashboard as soon as an alert is created

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(groups): say no one was found on a members search and no one is selected on an empty selection

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* feat(movements): lock the leaving guests when editing a guest exit, only its date being correctable

Claude-Session: https://claude.ai/code/session_01KfU3Brkq2JCsaN4BHRWBoF

* feat(login): link to the support under the sign-in button when it is configured

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(communications): sign the first message of a deleted author as a deleted user

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(confirmation): keep a refused confirmation open with the message of the backend inside, with the progress on its button

Claude-Session: https://claude.ai/code/session_01KfU3BrivRJW9QgWKVMBgc8

* fix(participants): lock the linked user of a participant for those who cannot change it, letting them remove only their own link

Claude-Session: https://claude.ai/code/session_01KfU3Brkq2JCsaN4BHRWBoF

* chore(favicon): replace the favicon with the registry logo, in svg with a dark mode variant and in ico as fallback

* refactor(config)!: split the backend noAuthPaths into noRefreshPaths and credentialFreePaths
* env.json renames backend.noAuthPaths to noRefreshPaths and requires backend.credentialFreePaths.

* fix(projects): hide the deleted projects from the favorites and answer project not found when opening one

* fix(projects): drop the toast shown after a project creation

* fix(movements): keep a participant with an empty pool name out of any group

* fix(lists): hide the loading placeholder of the last refresh when the first batch failed

* style(ui): space the page titles from their content, on @sgdf/ui 2.1.1

### 🧹 Improvements

* migrate the frontend to API v2, signal stores and @sgdf/ui ([#40](https://github.com/laucoin/Registry-Frontend/issues/40)) ([cdf36e7](https://github.com/laucoin/Registry-Frontend/commit/cdf36e7f3cd054490f54c893836162dc90e2262a))

## [1.7.0](https://github.com/laucoin/Registry-Frontend/compare/1.6.3...1.7.0) (2026-09-14)

### 📦️ Other

* **message:** Complete some translations to inform user action may … ([#32](https://github.com/laucoin/Registry-Frontend/issues/32)) ([2a277a5](https://github.com/laucoin/Registry-Frontend/commit/2a277a510bc11aaf4eef800e63b22d516df844ef))

### 🐛 Bug Fixes

* **refresh:** Avoid calling refresh token multiple times ([#31](https://github.com/laucoin/Registry-Frontend/issues/31)) ([0fb9414](https://github.com/laucoin/Registry-Frontend/commit/0fb9414e18125904f9cf48a3451fb94665aeb79b))

## [1.6.2](https://github.com/laucoin/Registry-Frontend/compare/1.6.1...1.6.2) (2026-09-13)

### 🐛 Bug Fixes

* **GDPR:** Not log anymore form data in console ([#30](https://github.com/laucoin/Registry-Frontend/issues/30)) ([ea429ff](https://github.com/laucoin/Registry-Frontend/commit/ea429ffecd5705b341c4e1cf02dc51756fdfd2a9))

## [1.6.1](https://github.com/laucoin/Registry-Frontend/compare/1.6.0...1.6.1) (2026-09-13)

### 🐛 Bug Fixes

* **link:** Protect site from external link ([#29](https://github.com/laucoin/Registry-Frontend/issues/29)) ([5386553](https://github.com/laucoin/Registry-Frontend/commit/53865539b2b71869c94e916c37022550ca2e7c97))

## [1.6.0](https://github.com/laucoin/Registry-Frontend/compare/1.5.0...1.6.0) (2026-09-13)

### 📦️ Other

* **dependabot:** add dependabot check ([#28](https://github.com/laucoin/Registry-Frontend/issues/28)) ([49cdb36](https://github.com/laucoin/Registry-Frontend/commit/49cdb367b91298bd83a852bbb43442b539ddee2a))

## [1.5.0](https://github.com/laucoin/Registry-Frontend/compare/1.4.0...1.5.0) (2026-09-13)

### 📦️ Other

* **security:** clean nginx.conf ([#27](https://github.com/laucoin/Registry-Frontend/issues/27)) ([274e50e](https://github.com/laucoin/Registry-Frontend/commit/274e50e45dd0b02e46ea5c403f12d18099e3df4c))

## [1.4.0](https://github.com/laucoin/Registry-Frontend/compare/1.3.0...1.4.0) (2026-09-12)

### 🚀 Features

* **auth:** Authenticate with cookie instead of header ([#26](https://github.com/laucoin/Registry-Frontend/issues/26)) ([110357c](https://github.com/laucoin/Registry-Frontend/commit/110357c5a29adfc000c3397fb29802db31bdfad9))

## [1.3.0](https://github.com/laucoin/Registry-Frontend/compare/1.2.1...1.3.0) (2026-09-05)

### 📦️ Other

* **AI:** Add doc diff skill ([#18](https://github.com/laucoin/Registry-Frontend/issues/18)) ([86efb27](https://github.com/laucoin/Registry-Frontend/commit/86efb271a29d5d1b32bddb6e6cb6136f087ff5fc))
* **AI:** Generate AGENTS.md from https://doc.laucoin.fr/registry ([#20](https://github.com/laucoin/Registry-Frontend/issues/20)) ([a226f99](https://github.com/laucoin/Registry-Frontend/commit/a226f99ff782e0a53c79be7c8a1f83d9653d85fa))
* **movement:** Remove the dead getDrivers helper ([#19](https://github.com/laucoin/Registry-Frontend/issues/19)) ([6cab94b](https://github.com/laucoin/Registry-Frontend/commit/6cab94bb4d581efe2628a24530403467750b16b8))
* **node:** Bump node version to 24 LTS ([#21](https://github.com/laucoin/Registry-Frontend/issues/21)) ([9390355](https://github.com/laucoin/Registry-Frontend/commit/93903557a3783983445cbd2a4ef7329b33bbdec4))
* **PR:** Add pull request template ([#17](https://github.com/laucoin/Registry-Frontend/issues/17)) ([eae3c91](https://github.com/laucoin/Registry-Frontend/commit/eae3c9194528a80befee9b430312109df364f638))

### 📝 Documentation

* **readme:** Improve README.md content ([#16](https://github.com/laucoin/Registry-Frontend/issues/16)) ([dcccba0](https://github.com/laucoin/Registry-Frontend/commit/dcccba06f6286903f257b6f05bf89ee2e959b759))

### 🐛 Bug Fixes

* **ci:** Releases were block by the changelog generation with conventional commits ([#22](https://github.com/laucoin/Registry-Frontend/issues/22)) ([a405769](https://github.com/laucoin/Registry-Frontend/commit/a40576995d2b9baefbe6c6deddbef0fca8f20d16))

## [1.2.1](https://github.com/laucoin/Registry-Frontend/compare/1.2.0...1.2.1) (2026-07-24)

## [1.2.0](https://github.com/laucoin/Registry-Frontend/compare/1.1.1...1.2.0) (2026-07-24)

## [1.1.1](https://github.com/laucoin/Registry-Frontend/compare/1.1.0...1.1.1) (2026-07-24)

## [1.1.0](https://github.com/laucoin/Registry-Frontend/compare/1.0.1...1.1.0) (2026-07-24)
