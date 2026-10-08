import { AuthenticationUriResponseDto } from '@shared/models/dto/response/authentication-uri.response.dto'
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model'

/**
 * Purpose: Converts an authentication uri response of the backend into its model.
 * Scope: Copies the uri.
 * Limits: Does not validate the uri; the identity provider flow does.
 */
export class AuthenticationUriMapper {
    public static toModel (dto: AuthenticationUriResponseDto): AuthenticationUriModel {
        return { uri: dto.uri }
    }
}
