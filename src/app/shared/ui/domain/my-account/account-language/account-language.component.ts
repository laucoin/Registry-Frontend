import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RegistryConfig } from "@core/config/registry.config";
import { RegistryFacade } from "@core/registry/state/registry.facade";
import { SessionFacade } from "@core/registry/state/session.facade";
import { UiFacade } from "@core/registry/state/ui.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";

/**
 * Purpose: Lets the signed-in user pick the display language of the application.
 * Scope: Shows the configured languages as buttons, or as a select past two, and forwards the choice and shows which language is being saved.
 * Limits: Does not load translations or persist anything itself; the registry facade does.
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
	private readonly uiFacade: UiFacade = inject(UiFacade)
	private readonly registryFacade: RegistryFacade = inject(RegistryFacade)

	protected readonly availableLanguages: string[] = RegistryConfig.config.languages
	protected readonly currentLanguage: Signal<string> = this.sessionFacade.currentUserLanguage
	protected readonly pendingLanguage: Signal<string | undefined> = this.uiFacade.pendingLanguage

	protected select(language: string): void {
		this.registryFacade.updateCurrentUserLanguage(language)
	}

	protected selectFromEvent(event: Event): void {
		this.select((event.target as HTMLSelectElement).value)
	}
}
