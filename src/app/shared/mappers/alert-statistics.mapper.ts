import { AlertStatisticsResponseDto } from '@shared/models/dto/response/alert-statistics.response.dto';
import { AlertStatisticsModel } from '@shared/models/model/alert-statistics.model';

/**
 * Objectif: Convertit une réponse AlertStatistics du backend en modèle AlertStatistics.
 * Périmètre: Copie chaque champ et remplace les valeurs nulles du backend par `undefined`.
 * Limites: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const AlertStatisticsMapper = {
	toModel(dto: AlertStatisticsResponseDto): AlertStatisticsModel {
		return {
			resolvedCount: dto.resolvedCount,
			canceledCount: dto.canceledCount,
			averageResolutionSeconds: dto.averageResolutionSeconds ?? undefined,
			realAlertRate: dto.realAlertRate ?? undefined,
		};
	},
} as const;
