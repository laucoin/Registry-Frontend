import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper';
import { FieldErrorState } from '@shared/helpers/form/field-state.helper';

import '@sgdf/ui/field-error';

/**
 * Objectif: Affiche la première erreur d'un champ de signal form.
 * Périmètre: Traduit le type d'erreur sous le préfixe donné avec ses paramètres une fois le champ touché ou modifié ; utilisé pour ce qui n'a pas de champ `@sgdf/ui` pour porter l'erreur (une plage, un formulaire entier).
 * Limites: N'affiche rien pour un champ valide ou vierge et non touché. Un champ `@sgdf/ui` affiche sa propre erreur avec la directive `appFieldError`.
 */
@Component({
	selector: 'app-field-error',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './field-error.component.html',
})
export class FieldErrorComponent {
	private readonly translateService = inject(TranslocoService);

	public readonly field: InputSignal<() => FieldErrorState> = input.required();
	public readonly translationPrefix: InputSignal<string> = input.required();
	public readonly translationArgs: InputSignal<object> = input({});

	protected readonly errorText = computed(() =>
		FieldErrorHelper.text(this.field(), this.translationPrefix(), this.translationArgs(), (key, params) =>
			this.translateService.translate(key, params),
		),
	);
}
