import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { NotificationModel } from '@shared/models/model/notification.model';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';

/**
 * Objectif: Affiche l'échec d'une section d'une page, avec une action de nouvel essai.
 * Périmètre: Affiche le titre et le message du backend de l'erreur dans un callout danger et émet la demande de nouvel essai quand l'échec peut être réessayé.
 * Limites: Ne possède aucun état et ne recharge rien ; la page décide de ce que fait un nouvel essai.
 */
@Component({
	selector: 'app-section-error',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './section-error.component.html',
})
export class SectionErrorComponent {
	public readonly error: InputSignal<NotificationModel> = input.required();
	public readonly retrying = input(false);
	public readonly retryable = input(true);

	public readonly retry = output();
}
