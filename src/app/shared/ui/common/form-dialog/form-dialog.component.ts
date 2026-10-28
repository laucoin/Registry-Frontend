import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import '@sgdf/ui/button'
import '@sgdf/ui/dialog'
import '@sgdf/ui/icon'
import '@sgdf/ui/spinner'
import { UiFacade } from '@core/registry/state/ui.facade'
import { EventHelper } from '@shared/helpers/event.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component'

/**
 * Purpose: Coque de dialogue d'un court formulaire de création ou d'édition, ouverte par sa propre route au-dessus de la liste.
 * Scope: Affiche le titre, le spinner de chargement, l'erreur de soumission et les boutons d'annulation et de soumission ; demande à la page de soumettre ou de fermer.
 * Limits: Ne possède aucun modèle de formulaire et ne navigue jamais ; la page décide de ce que font la soumission et la fermeture. Un clic à l'extérieur ne le ferme jamais, pour conserver la saisie.
 */
@Component({
	selector: 'app-form-dialog',
	imports: [TranslocoPipe, FormErrorComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-dialog.component.html',
})
export class FormDialogComponent {
	protected readonly uiFacade: UiFacade = inject(UiFacade)

	public readonly title: InputSignal<string | undefined> = input<string | undefined>()
	public readonly submitLabel: InputSignal<string> = input.required()
	public readonly submitIcon: InputSignal<string> = input<string>('pen-to-square')
	public readonly loading: InputSignal<boolean> = input<boolean>(false)
	public readonly saving: InputSignal<boolean> = input<boolean>(false)
	public readonly error: InputSignal<ErrorModel | undefined> = input<ErrorModel | undefined>()

	public readonly submitted: OutputEmitterRef<void> = output<void>()
	public readonly closed: OutputEmitterRef<void> = output<void>()

	protected hidden(event: Event): void {
		if (EventHelper.isFromHost(event)) this.closed.emit()
	}
}
