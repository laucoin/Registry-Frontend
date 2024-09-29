import { EventProfileModel } from './event-profile.model'

export interface PreferencesModel {
    userId: string
    selectedProfile: EventProfileModel | undefined
}
