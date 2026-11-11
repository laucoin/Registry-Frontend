import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';

export const PARTICIPANTS_LIST_SORT_FIELDS: readonly string[] = [
	'lastName',
	'firstName',
	'status',
	'startAvailability',
	'endAvailability',
];

interface ParticipantsListSearch {
	q: string | undefined;
	status: string | undefined;
	isVisible: boolean | undefined;
	sort: string | undefined;
}

export interface ParticipantsListSearchModel extends SortFields {
	q: string;
	status: string;
	isVisible: BooleanChoice;
}

/**
 * Objectif: Convertit les paramètres de recherche de la liste des participants en valeurs liées au formulaire de recherche.
 * Périmètre: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limites: Ne valide pas les paramètres.
 */
export function toParticipantsListSearchModel(params: ParticipantsListSearch): ParticipantsListSearchModel {
	return {
		q: params.q ?? '',
		status: params.status ?? '',
		isVisible: toBooleanChoice(params.isVisible),
		...parseSort(params.sort, PARTICIPANTS_LIST_SORT_FIELDS),
	};
}

/**
 * Objectif: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des participants.
 * Périmètre: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limites: Ne valide pas les valeurs du formulaire.
 */
export function toParticipantsListSearchParams(model: ParticipantsListSearchModel): ParticipantsListSearch {
	return {
		q: model.q === '' ? undefined : model.q,
		status: model.status === '' ? undefined : model.status,
		isVisible: fromBooleanChoice(model.isVisible),
		sort: formatSort(model),
	};
}
