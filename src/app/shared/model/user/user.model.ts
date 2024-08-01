import { GenericModel } from '../generic/generic.model'

export interface UserModel extends GenericModel {
    oidcId: string
    firstName: string
    lastName: string
    email: string
    role: string | undefined
    defaultProfileId: string | undefined
}
