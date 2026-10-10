import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Lets the signed-in user pick the display language of the application.
 * Scope: Shows the configured languages as buttons, or as a select past two, and forwards the choice and shows which language is being saved.
 * Limits: Does not decide which languages exist, load translations or persist anything itself; the session facade does.
 */
@Component({
	imports: [
		TranslocoPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-language',
	styleUrl: './account-language.component.css',
	templateUrl: './account-language.component.html',
})
export class AccountLanguageComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly availableLanguages: readonly string[] = this.sessionFacade.availableLanguages
	protected readonly currentLanguage: Signal<string> = this.sessionFacade.currentUserLanguage
	protected readonly pendingLanguage: Signal<string | undefined> = this.sessionFacade.pendingLanguage

	protected select(language: string): void {
		this.sessionFacade.updateCurrentUserLanguage(language)
	}

	protected selectFromEvent(event: Event): void {
		this.select((event.target as HTMLSelectElement).value)
	}
}
