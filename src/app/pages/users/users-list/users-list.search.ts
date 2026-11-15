import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';

export const USERS_LIST_SORT_FIELDS: readonly string[] = ['lastName', 'firstName', 'email', 'lastLogin'];

interface UsersListSearch {
	q: string | undefined;
	isVisible: boolean | undefined;
	sort: string | undefined;
}

export interface UsersListSearchModel extends SortFields {
	q: string;
	isVisible: BooleanChoice;
}

/**
 * Objectif: Convertit les paramètres de recherche de la liste des utilisateurs en valeurs liées au formulaire de recherche.
 * Périmètre: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limites: Ne valide pas les paramètres.
 */
export function toUsersListSearchModel(params: UsersListSearch): UsersListSearchModel {
	return {
		q: params.q ?? '',
		isVisible: toBooleanChoice(params.isVisible),
		...parseSort(params.sort, USERS_LIST_SORT_FIELDS),
	};
}

/**
 * Objectif: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des utilisateurs.
 * Périmètre: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limites: Ne valide pas les valeurs du formulaire.
 */
export function toUsersListSearchParams(model: UsersListSearchModel): UsersListSearch {
	return {
		q: model.q === '' ? undefined : model.q,
		isVisible: fromBooleanChoice(model.isVisible),
		sort: formatSort(model),
	};
}
