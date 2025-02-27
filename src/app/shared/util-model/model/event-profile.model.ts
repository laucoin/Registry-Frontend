import { GenericEventModel } from './generic-event.model'
import { UserModel } from './user.model'
import { SelectItem } from 'primeng/api'
import { CustomDatetimeModel } from './custom-datetime.model'

export interface EventProfileModel extends GenericEventModel {
    user: UserModel
    role: SelectItem<string>
    status: SelectItem<string>
    startAccess: CustomDatetimeModel | undefined
    endAccess: CustomDatetimeModel | undefined
}
