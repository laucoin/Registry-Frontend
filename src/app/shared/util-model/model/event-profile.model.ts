import { GenericEventModel } from './generic-event.model'
import { UserModel } from './user.model'
import { SelectItem } from 'primeng/api'

export interface EventProfileModel extends GenericEventModel {
    user: UserModel
    role: SelectItem<string>
    status: SelectItem<string>
    startAccess: Date | undefined
    endAccess: Date | undefined
}
