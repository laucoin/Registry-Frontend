import { GenericMapper } from '@shared/mappers/generic.mapper';
import { UserInvitationResponseDto } from '@shared/models/dto/response/user-invitation.response.dto';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';

/**
 * Objectif: Convertit une réponse d'invitation d'utilisateur du backend en modèle UserInvitation.
 * Périmètre: Copie chaque champ et le résumé du projet.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const UserInvitationMapper = {
	toModel(dto: UserInvitationResponseDto): UserInvitationModel {
		return {
			...GenericMapper.toModel(dto),
			project: dto.project
				? {
						id: dto.project.id,
						name: dto.project.name,
						begin: dto.project.begin,
						end: dto.project.end,
						favorite: dto.project.favorite,
					}
				: undefined,
			role: dto.role,
			availabilityStatus: dto.availabilityStatus,
			status: dto.status,
			startAccess: dto.startAccess,
			endAccess: dto.endAccess,
		};
	},
} as const;
