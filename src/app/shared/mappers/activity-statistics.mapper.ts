import { ActivityStatisticsResponseDto } from '@shared/models/dto/response/activity-statistics.response.dto';
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model';

/**
 * Objectif: Convertit une réponse ActivityStatistics du backend en modèle ActivityStatistics.
 * Périmètre: Copie chaque champ et remplace le taux nul du backend par `undefined`.
 * Limites: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ActivityStatisticsMapper = {
	toModel(dto: ActivityStatisticsResponseDto): ActivityStatisticsModel {
		return {
			participantCount: dto.participantCount,
			projectParticipantCount: dto.projectParticipantCount,
			participantRate: dto.participantRate ?? undefined,
			movementSeconds: dto.movementSeconds,
			manSeconds: dto.manSeconds,
		};
	},
} as const;
