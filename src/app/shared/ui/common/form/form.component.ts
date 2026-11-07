import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core';

import { ErrorModel } from '@shared/models/model/error.model';
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component';

import '@sgdf/ui/spinner';

/**
 * Purpose: Enveloppe d'un formulaire avec un titre, un loader et des boutons d'action.
 * Scope: Projette les champs et affiche l'état d'enregistrement.
 * Limits: Ne possède aucun modèle de formulaire ; la page le fournit.
 */
@Component({
	selector: 'app-form',
	imports: [FormErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form.component.html',
	styles: 'h1 { font-size: var(--sgdf-text-3xl); }',
})
export class FormComponent {
	public readonly loading: InputSignal<boolean> = input.required();
	public readonly form: InputSignal<() => { touched: () => boolean }> = input.required();
	public readonly error = input<ErrorModel | undefined>();
	public readonly showTitle = input<boolean>(true);
	public readonly title = input<string | undefined>();

	protected readonly untouched = computed(() => !this.form()().touched());
}
