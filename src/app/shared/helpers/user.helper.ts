import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserModel } from '@shared/models/model/user.model'

/**
 * Purpose: Construit les select items des utilisateurs.
 * Scope: Mapping pur d'un utilisateur vers un select item.
 * Limits: Aucun état et aucune traduction.
 */
export class UserHelper {
    public static toSelectItem (user: UserModel): SelectOptionModel<UserModel> {
        return {
            label: `${user.email} (${user.firstName} ${user.lastName})`,
            value: user,
        }
    }
}
