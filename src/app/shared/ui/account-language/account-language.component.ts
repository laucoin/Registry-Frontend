import { Component, inject, Signal } from '@angular/core';
import { AuthFacade } from '@core/auth/auth.facade';
import { LanguageService } from '@core/i18n/language.service';
import { TranslocoPipe } from '@jsverse/transloco';
import { LucideLanguages } from '@lucide/angular';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { NzCardComponent } from 'ng-zorro-antd/card';
import { NzDividerComponent } from 'ng-zorro-antd/divider';

@Component({
	imports: [NzCardComponent, NzDividerComponent, TranslocoPipe, LucideLanguages],
	selector: 'app-account-language',
	styleUrl: './account-language.component.less',
	templateUrl: './account-language.component.html',
})
/**
 * Purpose: "My account" section for switching the active UI language.
 * Scope: Reads/sets language through LanguageService only.
 * Limits: No persistence beyond what LanguageService/Transloco already provide.
 */
export class AccountLanguageComponent {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	private readonly _languageService: LanguageService = inject(LanguageService);

	protected readonly currentUser: Signal<CurrentUserModel | undefined> =
		this._authFacade.currentUser;
	protected readonly activeLang: Signal<string> = this._languageService.activeLang;

	protected selectLanguage(lang: string): void {
		this._languageService.setLanguage(lang);
	}
}
