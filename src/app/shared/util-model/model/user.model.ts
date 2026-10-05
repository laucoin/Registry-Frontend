import { SelectItem } from 'primeng/api'
import { GenericModel } from './generic.model'

export interface UserModel extends GenericModel {
	firstName: string | undefined
	lastName: string | undefined
	email: string
	role: SelectItem<string> | undefined
	birthday: Date
	lastLogin: Date
	purged: boolean
}
