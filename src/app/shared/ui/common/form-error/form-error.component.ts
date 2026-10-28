import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal } from '@angular/core'
import '@sgdf/ui/callout'
import {TranslocoPipe} from '@jsverse/transloco'
import { ErrorModel } from '@shared/models/model/error.model'

/**
 * Purpose: Affiche l'erreur d'un formulaire entier.
 * Scope: Affiche le message renvoyé par le backend pour la soumission.
 * Limits: Les erreurs au niveau des champs sont affichées par le composant d'erreur de champ.
 */
@Component({
	selector: 'app-form-error',
	imports: [
		TranslocoPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-error.component.html',
})
export class FormErrorComponent {
	public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()
}
