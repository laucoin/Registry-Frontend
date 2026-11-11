import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ElementActionModel } from '@shared/models/model/element-action.model';

import '@sgdf/ui/button';
import '@sgdf/ui/icon';

/**
 * Objectif: Bouton de l'action principale d'un élément de liste, à côté de son menu d'actions.
 * Périmètre: Affiche l'icône et le libellé de l'action, la lance au clic et la signale indisponible sans la retirer.
 * Limites: Ne décide pas quelle action est principale ni si elle est permise ; le service d'actions de l'élément le fait.
 */
@Component({
	selector: 'app-element-primary-action',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './element-primary-action.component.html',
})
export class ElementPrimaryActionComponent {
	public readonly action = input.required<ElementActionModel>();

	protected run(): void {
		if (!this.action().disabled) this.action().run();
	}
}
