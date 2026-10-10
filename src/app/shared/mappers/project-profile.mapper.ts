import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Converts a ProjectProfile response of the backend into the ProjectProfile model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ProjectProfileMapper {
    public static toModel (dto: ProjectProfileResponseDto): ProjectProfileModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            user: UserMapper.toModel( dto.user ),
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
