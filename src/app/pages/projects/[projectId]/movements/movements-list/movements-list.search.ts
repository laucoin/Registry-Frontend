import { BooleanChoice, fromBooleanChoice, toBooleanChoice } from '@shared/helpers/form/boolean-choice';
import { SearchQuerySchema } from '@shared/helpers/search/search-query';
import { formatSort, parseSort, SortFields } from '@shared/helpers/search/sort-query';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';

export const MOVEMENTS_LIST_SORT_FIELDS: readonly string[] = ['dateTime', 'type', 'lastCommunicationDateTime'];

export interface MovementsListSearch {
	type: string | undefined;
	from: Date | undefined;
	to: Date | undefined;
	isVisible: boolean | undefined;
	sort: string | undefined;
}

export interface MovementsListSearchModel extends SortFields {
	type: string;
	from: Date | null;
	to: Date | null;
	isVisible: BooleanChoice;
}

/**
 * Objectif: Convertit les paramètres de recherche de la liste des mouvements en valeurs liées au formulaire de recherche.
 * Périmètre: Remplit les paramètres vides avec les valeurs par défaut du formulaire.
 * Limites: Ne valide pas les paramètres.
 */
export function toMovementsListSearchModel(params: MovementsListSearch): MovementsListSearchModel {
	return {
		type: params.type ?? '',
		from: params.from ?? null,
		to: params.to ?? null,
		isVisible: toBooleanChoice(params.isVisible),
		...parseSort(params.sort, MOVEMENTS_LIST_SORT_FIELDS),
	};
}

/**
 * Objectif: Convertit les valeurs du formulaire de recherche en paramètres de recherche de la liste des mouvements.
 * Périmètre: Transforme les valeurs vides du formulaire en paramètres undefined.
 * Limites: Ne valide pas les valeurs du formulaire.
 */
export function toMovementsListSearchParams(model: MovementsListSearchModel): MovementsListSearch {
	return {
		type: model.type === '' ? undefined : model.type,
		from: model.from ?? undefined,
		to: model.to ?? undefined,
		isVisible: fromBooleanChoice(model.isVisible),
		sort: formatSort(model),
	};
}

export const MOVEMENTS_LIST_DEFAULTS: MovementsListSearchModel = toMovementsListSearchModel({
	type: undefined,
	from: undefined,
	to: undefined,
	isVisible: undefined,
	sort: undefined,
});

export const MOVEMENTS_LIST_QUERY_SCHEMA: SearchQuerySchema<MovementsListSearchModel> = {
	type: SearchQueryFieldKindEnum.TEXT,
	from: SearchQueryFieldKindEnum.DATE,
	to: SearchQueryFieldKindEnum.DATE,
	isVisible: SearchQueryFieldKindEnum.CHOICE,
};
