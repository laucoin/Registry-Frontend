import { UserInvitationModel } from '@shared/models/model/user-invitation.model'
import { UserInvitationResponseDto } from '@shared/models/dto/response/user-invitation.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Converts a user invitation response of the backend into the UserInvitation model.
 * Scope: Copies each field and the project summary.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class UserInvitationMapper {
    public static toModel (dto: UserInvitationResponseDto): UserInvitationModel {
        return {
            ...GenericMapper.toModel( dto ),
            project: dto.project
                ? { id: dto.project.id, name: dto.project.name, begin: dto.project.begin, end: dto.project.end, favorite: dto.project.favorite }
                : undefined,
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
