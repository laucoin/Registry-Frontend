import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { AccountInfoComponent } from '@pages/my-account/account-info/account-info.component';
import { AccountLanguageComponent } from '@pages/my-account/account-language/account-language.component';
import { AccountPersonalDataComponent } from '@pages/my-account/account-personal-data/account-personal-data.component';
import { AccountRefreshComponent } from '@pages/my-account/account-refresh/account-refresh.component';
import { AccountThemeComponent } from '@pages/my-account/account-theme/account-theme.component';

import '@sgdf/ui/page-title';

/**
 * Objectif: Page de compte de l'utilisateur connecté.
 * Périmètre: Compose les sections d'informations, de langue, de thème et de données personnelles.
 * Limites: Ne détient aucun état propre ; chaque section lit la session via son propre composant.
 */
@Component({
	selector: 'app-my-account',
	imports: [
		TranslocoPipe,
		AccountInfoComponent,
		AccountLanguageComponent,
		AccountThemeComponent,
		AccountRefreshComponent,
		AccountPersonalDataComponent,
	],
	providers: [provideTranslocoScope('my-account')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: { class: 'w-full' },
	templateUrl: './my-account.page.html',
})
export class MyAccountPage {}
