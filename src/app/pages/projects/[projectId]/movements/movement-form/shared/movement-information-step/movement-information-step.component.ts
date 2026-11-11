import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementInformationModel } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { EventHelper } from '@shared/helpers/event.helper';

import '@sgdf/ui/button';
import '@sgdf/ui/card';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/icon';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Étape des informations d'un mouvement : date et type.
 * Périmètre: Lie chaque champ au formulaire du mouvement, affiche ses erreurs, signale le type choisi, la demande de
 * passer à l'étape suivante et l'annulation.
 * Limites: Ne valide ni n'enregistre rien ; la page valide l'étape et applique les conséquences du changement de type.
 */
@Component({
	selector: 'app-movement-information-step',
	imports: [TranslocoPipe, FormField, SgdfFieldDirective, FieldErrorDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-information-step.component.html',
})
export class MovementInformationStepComponent {
	private readonly facade = inject(MovementFacade);

	public readonly form = input.required<FieldTree<MovementInformationModel>>();
	public readonly typeChanged = output<string>();
	public readonly next = output();
	public readonly cancelled = output();

	protected readonly types = computed(() => this.facade.movementTypesMetadata().filter((type) => !!type.value));

	protected changeType(event: Event): void {
		this.typeChanged.emit(EventHelper.valueOf(event));
	}
}
