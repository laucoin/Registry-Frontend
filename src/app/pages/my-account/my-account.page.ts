import { Component } from '@angular/core';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { AccountInfoComponent } from '@shared/ui/account-info/account-info.component';
import { AccountLanguageComponent } from '@shared/ui/account-language/account-language.component';
import { AccountPersonalDataComponent } from '@shared/ui/account-personal-data/account-personal-data.component';
import { AccountThemeComponent } from '@shared/ui/account-theme/account-theme.component';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';

@Component({
	imports: [
		PageTitleComponent,
		TranslocoPipe,
		AccountInfoComponent,
		AccountLanguageComponent,
		AccountThemeComponent,
		AccountPersonalDataComponent,
	],
	providers: [provideTranslocoScope('myAccount')],
	selector: 'app-my-account',
	styleUrl: './my-account.page.less',
	templateUrl: './my-account.page.html',
})
/**
 * Purpose: "My account" route — account info, language, theme, and personal-data sections.
 * Scope: Pure composition of the four account components; no data or state of its own.
 * Limits: None beyond that — purely structural.
 */
export class MyAccountPage {}
