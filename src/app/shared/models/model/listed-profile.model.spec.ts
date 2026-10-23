import { profileProjectId } from '@shared/models/model/listed-profile.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { UserInvitationModel } from '@shared/models/model/user-invitation.model'

describe( 'profileProjectId', () => {
    it( 'reads the project id of a project profile and of an invitation, and nothing when the invitation has no project', () => {
        // Arrange
        const profile: ProjectProfileModel = { id: 'pp1', projectId: 'p1', user: { id: 'u1' } } as ProjectProfileModel
        const invitation: UserInvitationModel = { id: 'pp2', project: { id: 'p2', name: 'Camp' } } as UserInvitationModel
        const orphan: UserInvitationModel = { id: 'pp3', project: undefined } as UserInvitationModel

        // Act
        const ids: (string | undefined)[] = [ profile, invitation, orphan ].map( profileProjectId )

        // Assert
        expect( ids ).toEqual( [ 'p1', 'p2', undefined ] )
    } )
} )
