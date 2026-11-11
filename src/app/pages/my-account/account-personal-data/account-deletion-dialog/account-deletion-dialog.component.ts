import { Component, CUSTOM_ELEMENTS_SCHEMA, model, output, signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { RegistryConfig } from '@core/config/registry.config';
import { EventHelper } from '@shared/helpers/event.helper';

import '@sgdf/ui/button';
import '@sgdf/ui/dialog';
import '@sgdf/ui/icon';
import '@sgdf/ui/input';

/**
 * Objectif: Fait confirmer la suppression du compte en exigeant la saisie d'une phrase de confirmation.
 * Périmètre: Explique les conséquences, garde le bouton de suppression désactivé tant que la phrase n'est pas saisie et
 * émet la confirmation ; vide la saisie à chaque fermeture.
 * Limites: Ne supprime rien ; la section des données personnelles relaie la confirmation à la facade de session.
 */
@Component({
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	selector: 'app-account-deletion-dialog',
	templateUrl: './account-deletion-dialog.component.html',
})
export class AccountDeletionDialogComponent {
	protected readonly EventHelper = EventHelper;
	protected readonly organization = RegistryConfig.config.application.organization;

	public readonly open = model<boolean>(false);
	public readonly confirmed = output();

	protected readonly confirmationText = signal('');

	protected phraseTyped(phrase: string): boolean {
		return this.confirmationText().trim().toLowerCase() === phrase.trim().toLowerCase();
	}

	protected closed(event: Event): void {
		if (EventHelper.isFromHost(event)) {
			this.open.set(false);
			this.confirmationText.set('');
		}
	}

	protected accept(): void {
		this.open.set(false);
		this.confirmationText.set('');
		this.confirmed.emit();
	}
}
