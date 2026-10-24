import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { AccountInfoComponent } from "@shared/ui/domain/my-account/account-info/account-info.component";
import { AccountLanguageComponent } from "@shared/ui/domain/my-account/account-language/account-language.component";
import {
	AccountPersonalDataComponent
} from "@shared/ui/domain/my-account/account-personal-data/account-personal-data.component";
import { AccountThemeComponent } from "@shared/ui/domain/my-account/account-theme/account-theme.component";
import { AccountRefreshComponent } from "@shared/ui/domain/my-account/account-refresh/account-refresh.component";
import '@sgdf/ui/page-title'

/**
 * Purpose: Page de compte de l'utilisateur connecté.
 * Scope: Compose les sections d'informations, de langue, de thème et de données personnelles.
 * Limits: Ne détient aucun état propre ; chaque section lit la session via son propre composant.
 */
@Component({
	imports: [
		TranslocoPipe,
		AccountInfoComponent,
		AccountLanguageComponent,
		AccountThemeComponent,
		AccountRefreshComponent,
		AccountPersonalDataComponent
	],
	providers: [provideTranslocoScope('my-account')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styleUrl: './my-account.page.css',
	templateUrl: './my-account.page.html',
})
export class MyAccountPage {
}
