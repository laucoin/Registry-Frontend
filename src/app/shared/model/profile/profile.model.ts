import { GenericEventModel } from '../event/generic-event.model'

export interface ProfileModel extends GenericEventModel {
    userId: string
    role: string
    accepted: boolean
    startAccess: Date | undefined
    endAccess: Date | undefined
}
