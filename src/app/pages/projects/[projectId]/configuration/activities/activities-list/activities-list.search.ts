import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';

export const ACTIVITIES_LIST_SORT_FIELDS: readonly string[] = [
	'name',
	'status',
	'startAvailability',
	'endAvailability',
];

interface ActivitiesListSearch {
	q: string | undefined;
	at: Date | undefined;
	isAvailable: boolean | undefined;
	isVisible: boolean | undefined;
	sort: string | undefined;
}

export interface ActivitiesListSearchModel extends SortFields {
	q: string;
	at: Date | null;
	isAvailable: BooleanChoice;
	isVisible: BooleanChoice;
}

/**
 * Purpose: Convertit les paramètres de recherche de la liste des activités en valeurs liées au formulaire de recherche.
 * Scope: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limits: Ne valide pas les paramètres.
 */
export function toActivitiesListSearchModel(params: ActivitiesListSearch): ActivitiesListSearchModel {
	return {
		q: params.q ?? '',
		at: params.at ?? null,
		isAvailable: toBooleanChoice(params.isAvailable),
		isVisible: toBooleanChoice(params.isVisible),
		...parseSort(params.sort, ACTIVITIES_LIST_SORT_FIELDS),
	};
}

/**
 * Purpose: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des activités.
 * Scope: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limits: Ne valide pas les valeurs du formulaire.
 */
export function toActivitiesListSearchParams(model: ActivitiesListSearchModel): ActivitiesListSearch {
	return {
		q: model.q === '' ? undefined : model.q,
		at: model.at ?? undefined,
		isAvailable: fromBooleanChoice(model.isAvailable),
		isVisible: fromBooleanChoice(model.isVisible),
		sort: formatSort(model),
	};
}
