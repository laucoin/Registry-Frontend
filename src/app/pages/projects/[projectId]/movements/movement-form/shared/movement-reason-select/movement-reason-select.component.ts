import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	reasonChoices,
	reasonKeyOf,
} from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { EventHelper } from '@shared/helpers/event.helper';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';

import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Choix du motif ou de l'activité d'un mouvement.
 * Périmètre: Cherche les motifs et activités du type de mouvement et de participant, garde le motif déjà choisi parmi
 * les options et l'écrit dans le champ du formulaire.
 * Limites: Ne décide pas si le motif est requis ; le schéma du formulaire le fait.
 */
@Component({
	selector: 'app-movement-reason-select',
	imports: [TranslocoPipe, FieldErrorDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movement-reason-select.component.html',
})
export class MovementReasonSelectComponent {
	private readonly facade = inject(MovementFacade);

	public readonly field = input.required<FieldTree<MovementReasonModel | null>>();
	public readonly movementType = input.required<string>();
	public readonly participantType = input.required<ParticipantTypeEnum>();

	protected readonly options = computed(() =>
		reasonChoices(this.facade.searchedReasonAndActivityMetadata(), this.field()().value()),
	);
	protected readonly chosenKey = computed(() => reasonKeyOf(this.field()().value()));
	protected readonly reasonKeyOf = reasonKeyOf;

	protected search(query: string): void {
		this.facade.searchReasonsAndActivities(query, this.movementType(), this.participantType());
	}

	protected choose(event: Event): void {
		const key = EventHelper.valueOf(event);
		this.field()().value.set(this.options().find((option) => reasonKeyOf(option) === key) ?? null);
	}
}
