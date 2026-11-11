import { KeyValuePipe } from '@angular/common';
import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementHelper } from '@shared/helpers/movement.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPeopleComponent } from '@shared/ui/domain/movement-element/movement-people/movement-people.component';

import '@sgdf/ui/tab-group';

/**
 * Objectif: Répartit les personnes d'un mouvement en onglets.
 * Périmètre: Onglets « tous », majeurs, mineurs, chaque équipage de véhicule et personnes indépendantes, chacun listant
 * ses personnes.
 * Limites: N'affiche un onglet que s'il a au moins une personne ; « tous » est toujours présent.
 */
@Component({
	selector: 'app-movement-participants',
	imports: [TranslocoPipe, KeyValuePipe, PluralTranslationPipe, MovementPeopleComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-participants.component.html',
})
export class MovementParticipantsComponent {
	public readonly movement = input.required<MovementModel>();
	public readonly canReverse = input(false);

	public readonly reversed = output<MovementContentModel[]>();

	protected readonly adults = computed(() => MovementHelper.getAdults(this.movement()));
	protected readonly children = computed(() => MovementHelper.getChildren(this.movement()));
	protected readonly independent = computed(() => MovementHelper.getIndependent(this.movement()));
	protected readonly pools = computed(() => MovementHelper.getPools(this.movement()));
}
