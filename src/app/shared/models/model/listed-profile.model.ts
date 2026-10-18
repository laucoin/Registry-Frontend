import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

/** A profile as listed either from the project (with its user) or from the user (with its project summary). */
export type ListedProfileModel = ProjectProfileModel | UserInvitationModel

export function isProjectProfile (profile: ListedProfileModel): profile is ProjectProfileModel {
    return 'user' in profile
}

export function profileProjectId (profile: ListedProfileModel): string | undefined {
    return isProjectProfile( profile ) ? profile.projectId : profile.project?.id
}
