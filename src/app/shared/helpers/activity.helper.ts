import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ActivityModel } from '@shared/models/model/activity.model'

/**
 * Purpose: Builds select items for activities.
 * Scope: Pure mapping from an activity to a select item.
 * Limits: No state and no translation.
 */
export class ActivityHelper {
    public static toSelectItem (activity: ActivityModel): SelectOptionModel<ActivityModel> {
        return {
            label: activity.name,
            value: activity,
        }
    }
}
