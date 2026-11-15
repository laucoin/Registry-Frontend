import { GenericMapper } from '@shared/mappers/generic.mapper';
import { UserResponseDto } from '@shared/models/dto/response/user.response.dto';
import { UserModel } from '@shared/models/model/user.model';

/**
 * Objectif: Convertit une réponse User du backend en modèle User.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const UserMapper = {
	toModel(dto: UserResponseDto): UserModel {
		return {
			...GenericMapper.toModel(dto),
			firstName: dto.firstName,
			lastName: dto.lastName,
			email: dto.email,
			role: dto.role,
			birthday: dto.birthday,
			lastLogin: dto.lastLogin,
		};
	},
} as const;
