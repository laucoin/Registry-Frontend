import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { VehicleStatusResponseDto } from '@shared/models/dto/response/vehicle-status.response.dto'

/**
 * Purpose: Convertit une réponse VehicleStatus du backend en modèle VehicleStatus.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class VehicleStatusMapper {
    public static toModel (dto: VehicleStatusResponseDto): VehicleStatusModel {
        return {
            present: dto.present,
            absent: dto.absent,
            lastRefresh: dto.lastRefresh,
        }
    }
}
