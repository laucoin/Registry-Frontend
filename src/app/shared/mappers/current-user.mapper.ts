import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { CurrentUserResponseDto } from '@shared/models/dto/response/current-user.response.dto'
import { PreferencesMapper } from '@shared/mappers/preferences.mapper'
import { UserMapper } from '@shared/mappers/user.mapper'

/**
 * Purpose: Converts a CurrentUser response of the backend into the CurrentUser model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class CurrentUserMapper {
    public static toModel (dto: CurrentUserResponseDto): CurrentUserModel {
        return {
            ...UserMapper.toModel( dto ),
            authorities: dto.authorities,
            preferences: PreferencesMapper.toModel( dto.preferences ),
        }
    }
}
