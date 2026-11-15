import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core';

import { ErrorModel } from '@shared/models/model/error.model';
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component';

import '@sgdf/ui/spinner';
import '@sgdf/ui/page-title';

/**
 * Objectif: Enveloppe d'un formulaire avec un titre, un loader et des boutons d'action.
 * Périmètre: Projette les champs et affiche l'état d'enregistrement.
 * Limites: Ne possède aucun modèle de formulaire ; la page le fournit.
 */
@Component({
	selector: 'app-form',
	imports: [FormErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form.component.html',
})
export class FormComponent {
	public readonly loading: InputSignal<boolean> = input.required();
	public readonly form: InputSignal<() => { touched: () => boolean }> = input.required();
	public readonly error = input<ErrorModel | undefined>();
	public readonly showTitle = input<boolean>(true);
	public readonly title = input<string | undefined>();

	protected readonly untouched = computed(() => !this.form()().touched());
}
