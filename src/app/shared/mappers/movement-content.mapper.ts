import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto'
import { ParticipantMapper } from '@shared/mappers/participant.mapper'
import { VehicleMapper } from '@shared/mappers/vehicle.mapper'

/**
 * Purpose: Converts a MovementContent response of the backend into the MovementContent model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class MovementContentMapper {
    public static toModel (dto: MovementContentResponseDto): MovementContentModel {
        return {
            poolName: dto.poolName,
            participant: ParticipantMapper.toModel( dto.participant ),
            vehicle: dto.vehicle ? VehicleMapper.toModel( dto.vehicle ) : undefined,
        }
    }
}
