import { GroupModel } from '@shared/models/model/group.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

/**
 * Purpose: Construit les select items des groupes.
 * Scope: Mapping pur d'un groupe vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export class GroupHelper {
    public static toSelectItem (group: GroupModel): SelectOptionModel<GroupModel> {
        return {
            label: group.name,
            value: group,
        }
    }
}
