import { AlertModel } from '@shared/models/model/alert.model'
import { AlertResponseDto } from '@shared/models/dto/response/alert.response.dto'
import { CommunicationMapper } from '@shared/mappers/communication.mapper'
import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper'

/**
 * Purpose: Converts a Alert response of the backend into the Alert model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class AlertMapper {
    public static toModel (dto: AlertResponseDto): AlertModel {
        return {
            ...GenericProjectMapper.toOptionalModel( dto ),
            dateTime: dto.dateTime,
            title: dto.title,
            status: dto.status,
            communications: dto.communications?.map( CommunicationMapper.toModel ),
        }
    }
}
