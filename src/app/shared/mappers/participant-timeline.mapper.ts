import { TimelineMapper } from '@shared/mappers/timeline.mapper'
import { ParticipantTimelineResponseDto } from '@shared/models/dto/response/participant-timeline.response.dto'
import { ParticipantTimelineModel } from '@shared/models/model/participant-timeline.model'

/**
 * Purpose: Convertit une réponse ParticipantTimeline du backend en modèle ParticipantTimeline.
 * Scope: Délègue les plages prévues et les sorties au mapper de frise.
 * Limits: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class ParticipantTimelineMapper {
    public static toModel (dto: ParticipantTimelineResponseDto): ParticipantTimelineModel {
        return {
            planned: dto.planned.map( TimelineMapper.toRange ),
            actual: dto.actual.map( TimelineMapper.toOuting ),
        }
    }
}
