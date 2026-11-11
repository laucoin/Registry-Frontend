import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	emptyGuest,
	MovementGuestModel,
} from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement.form';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { FieldErrorComponent } from '@shared/ui/common/field-error/field-error.component';

import '@sgdf/ui/button';
import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/divider';
import '@sgdf/ui/icon';
import '@sgdf/ui/icon-button';
import '@sgdf/ui/input';

/**
 * Objectif: Saisie des invités qui arrivent avec un mouvement.
 * Périmètre: Lie le prénom, le nom et la date de naissance de chaque invité au formulaire, ajoute un invité et retire
 * un invité pas encore enregistré.
 * Limites: Ne valide rien ; le schéma du formulaire d'invités le fait.
 */
@Component({
	selector: 'app-guest-list-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		FieldErrorDirective,
		FieldErrorComponent,
		PluralTranslationPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './guest-list-fields.component.html',
})
export class GuestListFieldsComponent {
	public readonly guests = input.required<FieldTree<MovementGuestModel[]>>();

	protected readonly count = computed(() => this.guests()().value().length);

	protected add(): void {
		this.guests()().value.update((guests) => [...guests, emptyGuest()]);
	}

	protected remove(index: number): void {
		this.guests()().value.update((guests) => guests.filter((_, position) => position !== index));
	}
}
