import { SelectItem } from 'primeng/api'
import { UserModel } from '../../util-model/model/user.model'

export class UserUtil {
    public static toSelectItem (user: UserModel): SelectItem<UserModel> {
        return {
            label: `${user.email} (${user.firstName} ${user.lastName})`,
            value: user,
        }
    }
}
