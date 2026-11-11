import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { UiFacade } from '@core/registry/state/ui.facade';
import { NotificationModel } from '@shared/models/model/notification.model';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/page-title';

/**
 * Objectif: Erreur pleine page affichée quand toute l'application est bloquée.
 * Périmètre: Affiche l'erreur et sa cause côté backend et propose un nouvel essai qui recharge l'application.
 * Limites: Ne décide pas du moment où l'application est bloquée ni de l'erreur affichée ; la facade UI le fait.
 */
@Component({
	selector: 'app-global-error',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './global-error.component.html',
	imports: [TranslocoPipe],
})
export class GlobalErrorComponent {
	private readonly uiFacade = inject(UiFacade);

	public readonly error = input.required<NotificationModel>();

	protected retry(): void {
		this.uiFacade.reloadApplication();
	}
}
