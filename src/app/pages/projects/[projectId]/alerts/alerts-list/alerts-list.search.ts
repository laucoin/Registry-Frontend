import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';

export const ALERTS_LIST_SORT_FIELDS: readonly string[] = ['dateTime', 'title', 'status', 'criticality'];

interface AlertsListSearch {
	q: string | undefined;
	status: string | undefined;
	isVisible: boolean | undefined;
	from: Date | undefined;
	to: Date | undefined;
	sort: string | undefined;
}

export interface AlertsListSearchModel extends SortFields {
	q: string;
	status: string;
	isVisible: BooleanChoice;
	from: Date | null;
	to: Date | null;
}

/**
 * Objectif: Convertit les paramètres de recherche de la liste des alertes en valeurs liées au formulaire de recherche.
 * Périmètre: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limites: Ne valide pas les paramètres.
 */
export function toAlertsListSearchModel(params: AlertsListSearch): AlertsListSearchModel {
	return {
		q: params.q ?? '',
		status: params.status ?? '',
		isVisible: toBooleanChoice(params.isVisible),
		from: params.from ?? null,
		to: params.to ?? null,
		...parseSort(params.sort, ALERTS_LIST_SORT_FIELDS),
	};
}

/**
 * Objectif: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des alertes.
 * Périmètre: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limites: Ne valide pas les valeurs du formulaire.
 */
export function toAlertsListSearchParams(model: AlertsListSearchModel): AlertsListSearch {
	return {
		q: model.q === '' ? undefined : model.q,
		status: model.status === '' ? undefined : model.status,
		isVisible: fromBooleanChoice(model.isVisible),
		from: model.from ?? undefined,
		to: model.to ?? undefined,
		sort: formatSort(model),
	};
}
