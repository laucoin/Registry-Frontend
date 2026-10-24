import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleResponseDto } from '@shared/models/dto/response/vehicle.response.dto'
import { GenericMapper } from '@shared/mappers/generic.mapper'

/**
 * Purpose: Convertit une réponse Vehicle du backend en modèle Vehicle.
 * Scope: Copie chaque champ et délègue les entités imbriquées à leurs propres mappers.
 * Limits: Ne valide, ne renomme ni ne calcule aucune valeur ; le contrat du backend est considéré comme fiable.
 */
export class VehicleMapper {
    public static toModel (dto: VehicleResponseDto): VehicleModel {
        return {
            ...GenericMapper.toModel( dto ),
            licensePlate: dto.licensePlate,
            brand: dto.brand,
            model: dto.model,
            status: dto.status,
            startAvailability: dto.startAvailability,
            endAvailability: dto.endAvailability,
        }
    }
}
