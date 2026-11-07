import { OutingResponseDto } from '@shared/models/dto/response/outing.response.dto';
import { TimelineRangeResponseDto } from '@shared/models/dto/response/timeline-range.response.dto';
import { OutingModel } from '@shared/models/model/outing.model';
import { TimelineRangeModel } from '@shared/models/model/timeline-range.model';

/**
 * Purpose: Convertit les plages prévues et les sorties d'une frise du backend en modèles.
 * Scope: Remplace les bornes nulles par `undefined` et lit les dates des sorties en `Date`.
 * Limits: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const TimelineMapper = {
	toRange(dto: TimelineRangeResponseDto): TimelineRangeModel {
		return {
			start: dto.start ?? undefined,
			end: dto.end ?? undefined,
		};
	},

	toOuting(dto: OutingResponseDto): OutingModel {
		return {
			start: new Date(dto.start),
			end: new Date(dto.end),
			ongoing: dto.ongoing,
		};
	},
} as const;
