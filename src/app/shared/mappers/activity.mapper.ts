import { GenericMapper } from '@shared/mappers/generic.mapper';
import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto';
import { ActivityModel } from '@shared/models/model/activity.model';

/**
 * Objectif: Convertit une réponse Activity du backend en modèle Activity.
 * Périmètre: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limites: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ActivityMapper = {
	toModel(dto: ActivityResponseDto): ActivityModel {
		return {
			...GenericMapper.toModel(dto),
			name: dto.name,
			status: dto.status,
			description: dto.description,
			duration: dto.duration,
			allowedParticipants: dto.allowedParticipants,
			startAvailability: dto.startAvailability,
			endAvailability: dto.endAvailability,
		};
	},
} as const;
