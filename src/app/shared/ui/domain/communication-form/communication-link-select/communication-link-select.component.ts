import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { FieldErrorState } from '@shared/helpers/form/field-state.helper';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

import '@sgdf/ui/icon-button';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champ de liaison d'une communication à un élément existant (mouvement ou alerte), retirable.
 * Périmètre: Recherche, choix et retrait de l'élément lié ; affiche l'erreur du champ.
 * Limites: Ne charge ni ne retient aucun choix ; le formulaire parent tient le modèle et lance les recherches.
 */
@Component({
	selector: 'app-communication-link-select',
	imports: [FieldErrorDirective],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './communication-link-select.component.html',
})
export class CommunicationLinkSelectComponent {
	public readonly label = input.required<string>();
	public readonly placeholder = input.required<string>();
	public readonly emptyLabel = input.required<string>();
	public readonly removeLabel = input.required<string>();
	public readonly choices = input.required<SelectOptionModel<{ id: string }>[]>();
	public readonly selectedKey = input.required<string>();
	public readonly field = input.required<() => FieldErrorState>();
	public readonly translationPrefix = input.required<string>();

	public readonly searched = output<{ query: string }>();
	public readonly selected = output<string>();
	public readonly left = output();
	public readonly removed = output();
}
