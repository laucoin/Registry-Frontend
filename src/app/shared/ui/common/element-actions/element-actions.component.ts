import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal } from '@angular/core';

import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { ElementActionModel } from '@shared/models/model/element-action.model';

import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/menu';
import '@sgdf/ui/menu-item';

/**
 * Purpose: Menu des commandes offertes par un élément de liste.
 * Scope: Affiche un déclencheur et un item par action, marque les actions dangereuses et indisponibles et exécute celle qui est choisie.
 * Limits: N'affiche rien sans action ; ne décide ni des actions existantes ni de leur autorisation.
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
		const label = this.translocoService.translate('global.menu.options');
		return this.subject() ? `${label} : ${this.subject()}` : label;
	}
}
