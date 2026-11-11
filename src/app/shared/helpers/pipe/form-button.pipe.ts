import { Pipe, PipeTransform } from '@angular/core';

/**
 * Objectif: Donne la clé de traduction du bouton de soumission d'un formulaire.
 * Périmètre: Édition pour un élément existant, création sinon.
 * Limites: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe({
	name: 'formButton',
})
export class FormButtonPipe implements PipeTransform {
	public transform(element: unknown | undefined): string {
		return `global.actions.${element ? 'edit' : 'create'}`;
	}
}
