import { GroupModel } from '@shared/models/model/group.model'
import { SelectItem } from 'primeng/api'

/**
 * Purpose: Builds select items for groups.
 * Scope: Pure mapping from a group to a select item.
 * Limits: No state and no translation.
 */
export class GroupHelper {
    public static toSelectItem (group: GroupModel): SelectItem<GroupModel> {
        return {
            label: group.name,
            value: group,
        }
    }
}
