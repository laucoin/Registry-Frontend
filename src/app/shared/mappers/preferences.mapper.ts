import { PreferencesModel } from '@shared/models/model/preferences.model'
import { PreferencesResponseDto } from '@shared/models/dto/response/preferences.response.dto'

/**
 * Purpose: Converts a Preferences response of the backend into the Preferences model.
 * Scope: Copies each field and delegates the nested entities to their own mappers.
 * Limits: Does not validate, rename or compute any value; the backend contract is trusted.
 */
export class PreferencesMapper {
    public static toModel (dto: PreferencesResponseDto): PreferencesModel {
        return {
            userId: dto.userId,
            theme: dto.theme,
            language: dto.language,
        }
    }
}
