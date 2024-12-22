import { UserDto } from '../../util-model/dto/user.dto'
import { SelectItem } from 'primeng/api'

export class UserUtil {
    public static toSelectItem (user: UserDto): SelectItem<UserDto> {
        return {
            label: `${user.email} (${user.firstName} ${user.lastName})`,
            value: user,
        }
    }
}
