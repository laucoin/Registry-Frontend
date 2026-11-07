import { GroupModel } from '@shared/models/model/group.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Construit les select items des groupes.
 * Scope: Mapping pur d'un groupe vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export const GroupHelper = {
	toSelectItem(group: GroupModel): SelectOptionModel<GroupModel> {
		return {
			label: group.name,
			value: group,
		};
	},
} as const;
