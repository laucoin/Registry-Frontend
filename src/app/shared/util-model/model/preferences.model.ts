import { ProjectProfileModel } from './project-profile.model'

export interface PreferencesModel {
    userId: string
    selectedProfile: ProjectProfileModel | undefined
}
