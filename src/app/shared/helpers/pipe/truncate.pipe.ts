import { Pipe, PipeTransform } from '@angular/core';

import { StringHelper } from '@shared/helpers/string.helper';

/**
 * Purpose: Tronque un texte pour l'affichage.
 * Scope: Coupe après une longueur et ajoute une marque de fin.
 * Limits: Ne coupe pas aux limites des mots.
 */
@Pipe({
	name: 'truncate',
	standalone: true,
})
export class TruncatePipe implements PipeTransform {
	public transform(value: string, size = 20, trail = '…'): string {
		return StringHelper.truncate(value, size, trail);
	}
}
