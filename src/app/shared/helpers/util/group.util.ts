import { GroupModel } from '@shared/models/model/group.model'
import { SelectItem } from 'primeng/api'

export class GroupUtil {
    public static toSelectItem (group: GroupModel): SelectItem<GroupModel> {
        return {
            label: group.name,
            value: group,
        }
    }
}
