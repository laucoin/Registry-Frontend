import { CurrentProjectProfileModel } from '@shared/models/model/current-project-profile.model'
import { CurrentProjectProfileResponseDto } from '@shared/models/dto/response/current-project-profile.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Converts the current user's profile response of a project into its model.
 * Scope: Copies each field.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class CurrentProjectProfileMapper {
    public static toModel (dto: CurrentProjectProfileResponseDto): CurrentProjectProfileModel {
        return {
            ...GenericMapper.toModel( dto ),
            role: dto.role,
            availabilityStatus: dto.availabilityStatus,
            status: dto.status,
            startAccess: dto.startAccess,
            endAccess: dto.endAccess,
        }
    }
}
