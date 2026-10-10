import { MovementModel } from '@shared/models/model/movement.model'
import { MovementResponseDto } from '@shared/models/dto/response/movement.response.dto'
import { ActivityMapper } from '@shared/mappers/activity.mapper'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { MovementContentMapper } from '@shared/mappers/movement-content.mapper'
import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper'

/**
 * Purpose: Converts a Movement response of the backend into the Movement model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class MovementMapper {
    public static toModel (dto: MovementResponseDto): MovementModel {
        return {
            ...GenericProjectMapper.toOptionalModel( dto ),
            dateTime: dto.dateTime,
            type: dto.type,
            reason: dto.reason ? MovementReasonMapper.toModel( dto.reason ) : undefined,
            activity: dto.activity ? { ...dto.activity, value: ActivityMapper.toModel( dto.activity.value ) } : undefined,
            contentType: dto.contentType,
            content: dto.content.map( MovementContentMapper.toModel ),
        }
    }
}
