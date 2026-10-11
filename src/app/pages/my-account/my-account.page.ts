import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { AccountInfoComponent } from "@shared/ui/domain/my-account/account-info/account-info.component";
import { AccountLanguageComponent } from "@shared/ui/domain/my-account/account-language/account-language.component";
import {
	AccountPersonalDataComponent
} from "@shared/ui/domain/my-account/account-personal-data/account-personal-data.component";
import { AccountThemeComponent } from "@shared/ui/domain/my-account/account-theme/account-theme.component";
import '@sgdf/ui/page-title'

/**
 * Purpose: Account page of the signed-in user.
 * Scope: Composes the information, language, theme and personal data sections.
 * Limits: Holds no state of its own; each section reads the session through its own component.
 */
@Component({
	imports: [
		TranslocoPipe,
		AccountInfoComponent,
		AccountLanguageComponent,
		AccountThemeComponent,
		AccountPersonalDataComponent
	],
	providers: [provideTranslocoScope('my-account')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styleUrl: './my-account.page.css',
	templateUrl: './my-account.page.html',
})
export class MyAccountPage {
}
