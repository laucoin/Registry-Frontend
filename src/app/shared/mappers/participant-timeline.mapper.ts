import { TimelineMapper } from '@shared/mappers/timeline.mapper';
import { ParticipantTimelineResponseDto } from '@shared/models/dto/response/participant-timeline.response.dto';
import { ParticipantTimelineModel } from '@shared/models/model/participant-timeline.model';

/**
 * Objectif: Convertit une réponse ParticipantTimeline du backend en modèle ParticipantTimeline.
 * Périmètre: Délègue les plages prévues et les sorties au mapper de frise.
 * Limites: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export const ParticipantTimelineMapper = {
	toModel(dto: ParticipantTimelineResponseDto): ParticipantTimelineModel {
		return {
			planned: dto.planned.map(TimelineMapper.toRange),
			actual: dto.actual.map(TimelineMapper.toOuting),
		};
	},
} as const;
