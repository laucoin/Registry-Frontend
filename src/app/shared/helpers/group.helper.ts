import { GroupModel } from '@shared/models/model/group.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

/**
 * Purpose: Builds select items for groups.
 * Scope: Pure mapping from a group to a select item.
 * Limits: No state and no translation.
 */
export class GroupHelper {
    public static toSelectItem (group: GroupModel): SelectOptionModel<GroupModel> {
        return {
            label: group.name,
            value: group,
        }
    }
}
