import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

/** Un profil tel que listé depuis le projet (avec son utilisateur) ou depuis l'utilisateur (avec le résumé de son projet). */
export type ListedProfileModel = ProjectProfileModel | UserInvitationModel

export function isProjectProfile (profile: ListedProfileModel): profile is ProjectProfileModel {
    return 'user' in profile
}

export function profileProjectId (profile: ListedProfileModel): string | undefined {
    return isProjectProfile( profile ) ? profile.projectId : profile.project?.id
}
