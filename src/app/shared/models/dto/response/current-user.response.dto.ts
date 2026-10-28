import { PreferencesResponseDto } from '@shared/models/dto/response/preferences.response.dto'
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto'

export interface CurrentUserResponseDto extends UserResponseDto {
    authorities: string[]
    preferences: PreferencesResponseDto
}
