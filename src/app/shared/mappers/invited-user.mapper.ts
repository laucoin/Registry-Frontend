import { InvitedUserResponseDto } from '@shared/models/dto/response/invited-user.response.dto';
import { InvitedUserModel } from '@shared/models/model/invited-user.model';

/**
 * Objectif: Convertit le résumé d'un utilisateur renvoyé par le backend (profil de projet) en modèle InvitedUser.
 * Périmètre: Copie l'identifiant, le prénom, le nom et l'e-mail.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const InvitedUserMapper = {
	toModel(dto: InvitedUserResponseDto): InvitedUserModel {
		return {
			id: dto.id,
			firstName: dto.firstName,
			lastName: dto.lastName,
			email: dto.email,
		};
	},
} as const;
