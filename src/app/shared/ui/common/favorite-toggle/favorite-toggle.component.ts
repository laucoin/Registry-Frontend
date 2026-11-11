import { Component, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import '@sgdf/ui/icon-button';

/**
 * Objectif: Bouton étoile qui indique si un projet est favori et bascule ce statut.
 * Périmètre: Affiche une étoile ambre pleine pour un favori et une étoile neutre contourée sinon, avec un nom accessible et un état pressé, et émet quand l'utilisateur clique dessus.
 * Limites: Ne détient aucun état et n'appelle aucune api ; le parent exécute la commande et renvoie le nouvel état.
 */
@Component({
	selector: 'app-favorite-toggle',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	imports: [TranslocoPipe],
	templateUrl: './favorite-toggle.component.html',
})
export class FavoriteToggleComponent {
	public readonly favorite = input.required<boolean>();
	public readonly name = input.required<string>();
	public readonly toggled = output();
}
