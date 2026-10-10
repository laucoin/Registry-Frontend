import { GenericModel } from '@shared/models/model/generic.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface UserModel extends GenericModel {
    firstName: string | undefined
    lastName: string | undefined
    email: string
    role: SelectOptionModel<string> | undefined
    birthday: Date
    lastLogin: Date
    purged: boolean
}
