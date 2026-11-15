import { GenericProjectMapper } from '@shared/mappers/generic-project.mapper';
import { InvitedUserMapper } from '@shared/mappers/invited-user.mapper';
import { ProjectProfileResponseDto } from '@shared/models/dto/response/project-profile.response.dto';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';

/**
 * Objectif: Convertit une réponse ProjectProfile du backend en modèle ProjectProfile.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ProjectProfileMapper = {
	toModel(dto: ProjectProfileResponseDto): ProjectProfileModel {
		return {
			...GenericProjectMapper.toModel(dto),
			user: InvitedUserMapper.toModel(dto.user),
			role: dto.role,
			availabilityStatus: dto.availabilityStatus,
			status: dto.status,
			startAccess: dto.startAccess,
			endAccess: dto.endAccess,
		};
	},
} as const;
