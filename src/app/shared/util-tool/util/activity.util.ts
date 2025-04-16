import { SelectItem } from 'primeng/api'
import { ActivityModel } from '../../util-model/model/activity.model'

export class ActivityUtil {
    public static toSelectItem (activity: ActivityModel): SelectItem<ActivityModel> {
        return {
            label: activity.name,
            value: activity,
        }
    }
}
