import { GenericModel } from '@shared/models/model/generic.model'
import { GenericResponseDto } from '@shared/models/dto/response/generic.response.dto'
import { HistoryMapper } from '@shared/mappers/history.mapper'

/**
 * Purpose: Converts a Generic response of the backend into the Generic model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class GenericMapper {
    public static toModel (dto: GenericResponseDto): GenericModel {
        return {
            id: dto.id,
            visible: dto.visible,
            creation: HistoryMapper.toModel( dto.creation ),
            lastEdition: HistoryMapper.toModel( dto.lastEdition ),
        }
    }
}
