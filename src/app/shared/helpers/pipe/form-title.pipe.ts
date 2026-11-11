import { Pipe, PipeTransform } from '@angular/core';

/**
 * Objectif: Donne la clé de traduction du titre d'un formulaire.
 * Périmètre: Ajoute à une clé de base le suffixe edit ou create.
 * Limites: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe({
	name: 'formTitle',
})
export class FormTitlePipe implements PipeTransform {
	public transform(value: string, element: unknown | undefined): string {
		return `${value}.${element ? 'edit' : 'create'}`;
	}
}
