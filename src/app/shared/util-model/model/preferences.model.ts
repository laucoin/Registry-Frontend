import { ProjectProfileModel } from './project-profile.model'

export interface PreferencesModel {
    userId: string
    theme: string
    language: string
    selectedProfile: ProjectProfileModel | undefined
}
