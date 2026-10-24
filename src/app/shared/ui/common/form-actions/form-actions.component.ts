import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/icon'

/**
 * Purpose: Boutons d'annulation et de soumission en bas d'une page de formulaire.
 * Scope: Placé à l'intérieur du `<form>` : le bouton de soumission le soumet, donc la touche Entrée des champs aussi ; le bouton d'annulation demande à la page de partir.
 * Limits: Ne possède aucun état de formulaire et ne navigue jamais.
 */
@Component({
	selector: 'app-form-actions',
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-actions.component.html',
})
export class FormActionsComponent {
	public readonly submitLabel: InputSignal<string> = input.required()
	public readonly submitIcon: InputSignal<string> = input<string>('pen-to-square')
	public readonly saving: InputSignal<boolean> = input<boolean>(false)

	public readonly cancelled: OutputEmitterRef<void> = output<void>()
}
