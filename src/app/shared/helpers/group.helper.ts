import { GroupModel } from '@shared/models/model/group.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Objectif: Construit les select items des groupes.
 * Périmètre: Mapping pur d'un groupe vers un select item.
 * Limites: Aucun état et aucune traduction.
 */
export const GroupHelper = {
	toSelectItem(group: GroupModel): SelectOptionModel<GroupModel> {
		return {
			label: group.name,
			value: group,
		};
	},
} as const;
