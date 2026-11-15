import { HttpParams } from '@angular/common/http';

import { GenericHelper } from '@shared/helpers/generic.helper';

/**
 * Objectif: Construit la query string des requêtes paginées.
 * Périmètre: Ajoute le numéro de page, la taille de page et les critères de recherche définis, jamais le drapeau de réinitialisation.
 * Limites: N'encode pas les valeurs complexes ; les appelants passent des primitives.
 */
export const QueryHelper = {
	buildQueryParams(page: number | undefined, size: number | undefined, params: object | undefined): HttpParams {
		let builtParams = new HttpParams().set('page', page ?? 0).set('size', size ?? 20);

		if (GenericHelper.isNull(params)) return builtParams;

		Object.entries(params).forEach(([key, value]: [string, string | number | boolean | undefined]) => {
			if (GenericHelper.nonNull(value) && key !== 'resetSearch') builtParams = builtParams.set(key, value);
		});

		return builtParams;
	},
} as const;
