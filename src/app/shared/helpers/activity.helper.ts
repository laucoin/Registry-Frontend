import { SelectItem } from 'primeng/api'
import { ActivityModel } from '@shared/models/model/activity.model'

export class ActivityHelper {
    public static toSelectItem (activity: ActivityModel): SelectItem<ActivityModel> {
        return {
            label: activity.name,
            value: activity,
        }
    }
}
