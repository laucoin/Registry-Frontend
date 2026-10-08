import { SelectItem } from 'primeng/api'
import { ActivityModel } from '@shared/models/model/activity.model'

/**
 * Purpose: Builds select items for activities.
 * Scope: Pure mapping from an activity to a select item.
 * Limits: No state and no translation.
 */
export class ActivityHelper {
    public static toSelectItem (activity: ActivityModel): SelectItem<ActivityModel> {
        return {
            label: activity.name,
            value: activity,
        }
    }
}
