import '@sgdf/ui/icon-button'
import { Component, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'

/**
 * Purpose: Bouton étoile qui indique si un projet est favori et bascule ce statut.
 * Scope: Affiche une étoile ambre pleine pour un favori et une étoile neutre contourée sinon, avec un nom accessible et un état pressé, et émet quand l'utilisateur clique dessus.
 * Limits: Ne détient aucun état et n'appelle aucune api ; le parent exécute la commande et renvoie le nouvel état.
 */
@Component({
	selector: 'app-favorite-toggle',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe],
	templateUrl: './favorite-toggle.component.html',
})
export class FavoriteToggleComponent {
	public readonly favorite: InputSignal<boolean> = input.required<boolean>()
	public readonly name: InputSignal<string> = input.required<string>()
	public readonly toggled: OutputEmitterRef<void> = output<void>()
}
