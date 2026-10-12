import { HistoryUserModel } from '@shared/models/model/history-user.model'
import { HistoryUserResponseDto } from '@shared/models/dto/response/history-user.response.dto'

/**
 * Purpose: Converts a HistoryUser response of the backend into the HistoryUser model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class HistoryUserMapper {
    public static toModel (dto: HistoryUserResponseDto): HistoryUserModel {
        return {
            id: dto.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
        }
    }
}
