import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { ErrorModel } from '@shared/models/model/error.model';

import '@sgdf/ui/callout';

/**
 * Purpose: Affiche l'erreur d'un formulaire entier.
 * Scope: Affiche le message renvoyé par le backend pour la soumission.
 * Limits: Les erreurs au niveau des champs sont affichées par le composant d'erreur de champ.
 */
@Component({
	selector: 'app-form-error',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-error.component.html',
})
export class FormErrorComponent {
	public readonly error = input<ErrorModel | undefined>();
}
