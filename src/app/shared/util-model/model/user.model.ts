import { GenericModel } from './generic.model'
import { SelectItem } from 'primeng/api'

export interface UserModel extends GenericModel {
    firstName: string | undefined
    lastName: string | undefined
    email: string
    role: SelectItem<string> | undefined
    birthday: Date
    lastLogin: Date
    purged: boolean
}
