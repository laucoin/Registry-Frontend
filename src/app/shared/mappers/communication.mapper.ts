import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationResponseDto } from '@shared/models/dto/response/communication.response.dto'
import { AlertMapper } from '@shared/mappers/alert.mapper'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'
import { MovementMapper } from '@shared/mappers/movement.mapper'

/**
 * Purpose: Converts a Communication response of the backend into the Communication model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class CommunicationMapper {
    public static toModel (dto: CommunicationResponseDto): CommunicationModel {
        return {
            ...GenericProjectMapper.toModel( dto ),
            dateTime: dto.dateTime,
            message: dto.message,
            movement: dto.movement ? MovementMapper.toModel( dto.movement ) : undefined,
            alert: dto.alert ? AlertMapper.toModel( dto.alert ) : undefined,
        }
    }
}
