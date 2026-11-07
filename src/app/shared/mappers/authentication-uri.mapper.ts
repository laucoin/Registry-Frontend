import { AuthenticationUriResponseDto } from '@shared/models/dto/response/authentication-uri.response.dto';
import { AuthenticationUriModel } from '@shared/models/model/authentication-uri.model';

/**
 * Purpose: Convertit une réponse d'uri d'authentification du backend en son modèle.
 * Scope: Copie l'uri.
 * Limits: Ne valide pas l'uri ; le flux du fournisseur d'identité le fait.
 */
export const AuthenticationUriMapper = {
	toModel(dto: AuthenticationUriResponseDto): AuthenticationUriModel {
		return { uri: dto.uri };
	},
} as const;
