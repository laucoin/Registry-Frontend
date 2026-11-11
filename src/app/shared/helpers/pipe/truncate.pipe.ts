import { Pipe, PipeTransform } from '@angular/core';

import { StringHelper } from '@shared/helpers/string.helper';

/**
 * Objectif: Tronque un texte pour l'affichage.
 * Périmètre: Coupe après une longueur et ajoute une marque de fin.
 * Limites: Ne coupe pas aux limites des mots.
 */
@Pipe({
	name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
	public transform(value: string, size = 20, trail = '…'): string {
		return StringHelper.truncate(value, size, trail);
	}
}
