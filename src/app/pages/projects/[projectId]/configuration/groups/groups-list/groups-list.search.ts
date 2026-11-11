import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';

export const GROUPS_LIST_SORT_FIELDS: readonly string[] = [
	'name',
	'membersCount',
	'status',
	'startAvailability',
	'endAvailability',
];

interface GroupsListSearch {
	q: string | undefined;
	at: Date | undefined;
	isPresent: boolean | undefined;
	isVisible: boolean | undefined;
	sort: string | undefined;
}

export interface GroupsListSearchModel extends SortFields {
	q: string;
	at: Date | null;
	isPresent: BooleanChoice;
	isVisible: BooleanChoice;
}

/**
 * Objectif: Convertit les paramètres de recherche de la liste des groupes en valeurs liées au formulaire de recherche.
 * Périmètre: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limites: Ne valide pas les paramètres.
 */
export function toGroupsListSearchModel(params: GroupsListSearch): GroupsListSearchModel {
	return {
		q: params.q ?? '',
		at: params.at ?? null,
		isPresent: toBooleanChoice(params.isPresent),
		isVisible: toBooleanChoice(params.isVisible),
		...parseSort(params.sort, GROUPS_LIST_SORT_FIELDS),
	};
}

/**
 * Objectif: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des groupes.
 * Périmètre: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limites: Ne valide pas les valeurs du formulaire.
 */
export function toGroupsListSearchParams(model: GroupsListSearchModel): GroupsListSearch {
	return {
		q: model.q === '' ? undefined : model.q,
		at: model.at ?? undefined,
		isPresent: fromBooleanChoice(model.isPresent),
		isVisible: fromBooleanChoice(model.isVisible),
		sort: formatSort(model),
	};
}
