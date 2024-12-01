import { UserTypeEnum } from '../enumeration/user-type.enum'
import { GenericModel } from './generic.model'

export interface UserModel extends GenericModel {
    oidcId: string
    type: UserTypeEnum
    firstName: string | undefined
    lastName: string | undefined
    email: string
    role: string | undefined
    birthday: Date
    lastLogin: Date
    purged: boolean
}
