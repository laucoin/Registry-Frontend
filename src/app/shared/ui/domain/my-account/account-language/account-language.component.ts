import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import '@sgdf/ui/button'
import '@sgdf/ui/button-group'
import '@sgdf/ui/icon'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import '@sgdf/ui/table'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/table-row'

/**
 * Purpose: Permet à l'utilisateur connecté de choisir la langue d'affichage de l'application.
 * Scope: Affiche les langues configurées sous forme de boutons, ou de select au-delà de deux, relaie le choix et montre quelle langue est en cours d'enregistrement.
 * Limits: Ne décide pas des langues existantes, ne charge pas les traductions et ne persiste rien lui-même ; la facade de session le fait.
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
