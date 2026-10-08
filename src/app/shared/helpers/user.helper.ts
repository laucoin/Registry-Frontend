import { SelectItem } from 'primeng/api'
import { UserModel } from '@shared/models/model/user.model'

/**
 * Purpose: Builds select items for users.
 * Scope: Pure mapping from a user to a select item.
 * Limits: No state and no translation.
 */
export class UserHelper {
    public static toSelectItem (user: UserModel): SelectItem<UserModel> {
        return {
            label: `${user.email} (${user.firstName} ${user.lastName})`,
            value: user,
        }
    }
}
