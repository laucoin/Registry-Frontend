import { MovementReasonMapper } from '@shared/mappers/movement-reason.mapper'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { PlannedMovementResponseDto } from '@shared/models/dto/response/planned-movement.response.dto'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'

/**
 * Purpose: Converts a planned movement response of the backend into the planned movement model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class PlannedMovementMapper {
    public static toModel (dto: PlannedMovementResponseDto): PlannedMovementModel {
        return {
            type: dto.type,
            reason: dto.reason ? MovementReasonMapper.toModel( dto.reason ) : undefined,
            contentType: dto.contentType,
            plannedAt: dto.plannedAt,
            poolName: dto.poolName,
            participants: dto.participants.map( ParticipantMapper.toModel ),
        }
    }
}
