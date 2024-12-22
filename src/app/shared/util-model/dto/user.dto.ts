import { BaseModel } from '../model/base.model'

export interface UserDto extends BaseModel {
    firstName: string | undefined
    lastName: string | undefined
    email: string
}
