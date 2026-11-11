import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal } from '@angular/core';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ElementActionModel } from '@shared/models/model/element-action.model';

import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';

/**
 * Objectif: Menu des commandes offertes par un élément de liste.
 * Périmètre: Affiche un déclencheur et un item par action, marque les actions dangereuses et indisponibles et exécute celle qui est choisie.
 * Limites: N'affiche rien sans action ; ne décide ni des actions existantes ni de leur autorisation.
 */
@Component({
	selector: 'app-element-actions',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './element-actions.component.html',
})
export class ElementActionsComponent {
	private readonly translocoService = inject(TranslocoService);

	public readonly actions: InputSignal<readonly ElementActionModel[]> = input.required();
	public readonly subject = input<string | undefined>();

	protected readonly triggerLabel = computed(() => this.buildTriggerLabel());

	private buildTriggerLabel(): string {
		const subject = this.subject();
		if (!subject) return this.translocoService.translate('global.menu.options');
		return this.translocoService.translate('global.menu.options-of', { name: subject });
	}
}
