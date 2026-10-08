import { HistoryModel } from '@shared/models/model/history.model'
import { HistoryResponseDto } from '@shared/models/dto/response/history.response.dto'
import { HistoryUserMapper } from '@shared/mappers/history-user.mapper'

/**
 * Purpose: Converts a History response of the backend into the History model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class HistoryMapper {
    public static toModel (dto: HistoryResponseDto): HistoryModel {
        return {
            dateTime: dto.dateTime,
            user: dto.user ? HistoryUserMapper.toModel( dto.user ) : undefined,
        }
    }
}
