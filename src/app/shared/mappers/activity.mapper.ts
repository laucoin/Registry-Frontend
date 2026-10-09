import { ActivityModel } from '@shared/models/model/activity.model'
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'

/**
 * Purpose: Converts a Activity response of the backend into the Activity model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class ActivityMapper {
    public static toModel (dto: ActivityResponseDto): ActivityModel {
        return {
            ...GenericProjectMapper.toOptionalModel( dto ),
            name: dto.name,
            status: dto.status,
            description: dto.description,
            duration: dto.duration,
            allowedParticipants: dto.allowedParticipants,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
        }
    }
}
