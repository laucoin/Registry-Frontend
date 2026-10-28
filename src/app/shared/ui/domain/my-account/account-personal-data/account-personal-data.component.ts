import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { RegistryConfig } from "@core/config/registry.config";
import { SessionFacade } from "@core/registry/state/session.facade";
import { RegistryRouteEnum } from "@core/routing/registry-route.enum";
import { RouteHelper } from "@shared/helpers/route.helper";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/dialog'
import '@sgdf/ui/icon'
import '@sgdf/ui/input'
import '@sgdf/ui/table'
import '@sgdf/ui/table-cell'
import '@sgdf/ui/table-row'

/**
 * Purpose: Présente les droits RGPD de l'utilisateur connecté : l'extraction des données et la suppression du compte.
 * Scope: Affiche les deux actions avec leur explication et un lien vers la page de confidentialité.
 * Limits: L'extraction télécharge l'export JSON immédiatement ; la suppression du compte passe par un dialogue de confirmation.
 */
@Component({
	imports: [
		TranslocoPipe,
		RouterLink,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-personal-data',
	templateUrl: './account-personal-data.component.html',
})
export class AccountPersonalDataComponent {
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly organization: string = RegistryConfig.config.application.organization
	protected readonly privacyRoute: string = RouteHelper.absolute(RegistryRouteEnum.PRIVACY)

	protected readonly deletionConfirmationOpen: WritableSignal<boolean> = signal(false)
	protected readonly deletionConfirmationText: WritableSignal<string> = signal('')

	protected exportData(): void {
		this.sessionFacade.exportAccount()
	}

	protected onDeletionConfirmationInput(event: Event): void {
		this.deletionConfirmationText.set((event.target as HTMLInputElement).value)
	}

	protected deletionPhraseTyped(phrase: string): boolean {
		return this.deletionConfirmationText().trim().toLowerCase() === phrase.trim().toLowerCase()
	}

	protected closeDeletionConfirmation(event: Event): void {
		if (event.target === event.currentTarget) {
			this.deletionConfirmationOpen.set(false)
			this.deletionConfirmationText.set('')
		}
	}

	protected deleteAccount(phrase: string): void {
		if (!this.deletionPhraseTyped(phrase)) {
			return
		}
		this.deletionConfirmationOpen.set(false)
		this.deletionConfirmationText.set('')
		this.sessionFacade.deleteAccount()
	}
}
