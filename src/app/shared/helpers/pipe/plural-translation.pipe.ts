import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

function sizeOf(number: number | unknown[] | undefined): number | undefined {
	return number instanceof Array ? number.length : number;
}

/**
 * Objectif: Choisit la forme plurielle d'une clé de traduction.
 * Périmètre: Choisit zéro, un, deux ou quelques à partir d'un nombre ou de la longueur d'une liste.
 * Limites: Renvoie une clé ; la traduction est faite par l'appelant.
 */
@Pipe({
	name: 'pluralTranslation',
	pure: false,
})
export class PluralTranslationPipe implements PipeTransform {
	private translateService = inject(TranslocoService);

	public transform(key: string, number: number | unknown[] | undefined = undefined): string {
		const size = sizeOf(number);
		if (size === 0) return this.zeroKey(key);
		if (size === 1) return `${key}.one`;
		return size === 2 && this.hasTranslation(`${key}.two`) ? `${key}.two` : `${key}.few`;
	}

	private zeroKey(key: string): string {
		return this.hasTranslation(`${key}.zero`) ? `${key}.zero` : `${key}.one`;
	}

	private hasTranslation(key: string): boolean {
		return key in this.translateService.getTranslation(this.translateService.getActiveLang());
	}
}
