import { TimelineMapper } from '@shared/mappers/timeline.mapper'
import { VehicleTimelineResponseDto } from '@shared/models/dto/response/vehicle-timeline.response.dto'
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model'

/**
 * Purpose: Convertit une réponse VehicleTimeline du backend en modèle VehicleTimeline.
 * Scope: Délègue les plages prévues et les sorties au mapper de frise et remplace le taux nul par `undefined`.
 * Limits: Ne valide ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class VehicleTimelineMapper {
    public static toModel (dto: VehicleTimelineResponseDto): VehicleTimelineModel {
        return {
            planned: dto.planned.map( TimelineMapper.toRange ),
            actual: dto.actual.map( TimelineMapper.toOuting ),
            outSeconds: dto.outSeconds,
            usageRate: dto.usageRate ?? undefined,
        }
    }
}
